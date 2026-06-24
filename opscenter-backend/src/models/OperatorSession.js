import database from "../config/database.js";
import crypto from "crypto";
import logger from "../middleware/logger.js";

class OperatorSession {
    /**
     * START SESSION - Atomic dengan database locking
     *
     * Flow:
     * 1. BEGIN transaction
     * 2. Lock robot row (SELECT ... FOR UPDATE)
     * 3. Check active session (akan fail jika ada)
     * 4. Check operator busy (akan fail jika ada)
     * 5. Insert session
     * 6. Create audit log
     * 7. COMMIT
     *
     * Jika step 3 atau 4 fail → ROLLBACK, return error
     */
    static async startSession(operator_id, robot_id, socket_id = null) {
        const client = await database.getClient();

        try {
            await client.query("BEGIN");

            // ✅ STEP 1: Lock robot row untuk prevent race condition
            const robotLock = await client.query("SELECT id, name FROM robots WHERE id = $1 FOR UPDATE", [robot_id]);

            if (robotLock.rows.length === 0) {
                await client.query("ROLLBACK");
                const error = new Error("Robot not found");
                error.code = "ROBOT_NOT_FOUND";
                throw error;
            }

            const robot_name = robotLock.rows[0].name;

            // ✅ STEP 2: Check active session (dengan lock)
            const activeCheck = await client.query(
                `SELECT os.id, os.operator_id, o.full_name as operator_name, o.employee_id
         FROM operator_sessions os
         JOIN operators o ON os.operator_id = o.id
         WHERE os.robot_id = $1 AND os.status = 'active'
         FOR UPDATE`,
                [robot_id],
            );

            if (activeCheck.rows.length > 0) {
                await client.query("ROLLBACK");
                const existing = activeCheck.rows[0];
                const error = new Error(`Robot ${robot_name} sedang dikontrol oleh ${existing.operator_name} (${existing.employee_id})`);
                error.code = "ROBOT_IN_USE";
                error.existing_session = existing;
                throw error;
            }

            // ✅ STEP 3: Check operator tidak punya session aktif lain
            const operatorCheck = await client.query(
                `SELECT os.id, r.name as robot_name
         FROM operator_sessions os
         JOIN robots r ON os.robot_id = r.id
         WHERE os.operator_id = $1 AND os.status = 'active'
         FOR UPDATE`,
                [operator_id],
            );

            if (operatorCheck.rows.length > 0) {
                await client.query("ROLLBACK");
                const error = new Error(`Operator sedang mengontrol ${operatorCheck.rows[0].robot_name}. Akhiri session tersebut terlebih dahulu.`);
                error.code = "OPERATOR_BUSY";
                throw error;
            }

            // ✅ STEP 4: Generate control token
            const control_token = crypto.randomBytes(32).toString("hex");

            // ✅ STEP 5: Insert session
            const insertResult = await client.query(
                `INSERT INTO operator_sessions 
         (operator_id, robot_id, status, control_token, socket_id, last_heartbeat)
         VALUES ($1, $2, 'active', $3, $4, NOW())
         RETURNING *`,
                [operator_id, robot_id, control_token, socket_id],
            );

            const session = insertResult.rows[0];

            // ✅ STEP 6: Create audit log
            await client.query(
                `INSERT INTO session_audit_logs 
         (session_id, action, target_operator_id, target_robot_id, details)
         VALUES ($1, 'start', $2, $3, $4)`,
                [session.id, operator_id, robot_id, JSON.stringify({ robot_name, control_token: control_token.substring(0, 8) + "..." })],
            );

            await client.query("COMMIT");

            logger.info(`✅ Session started: operator=${operator_id}, robot=${robot_name}`);
            return session;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * FORCE TAKEOVER - Supervisor override dengan audit trail
     */
    static async forceTakeover(robot_id, new_operator_id, supervisor_user_id, socket_id = null) {
        const client = await database.getClient();

        try {
            await client.query("BEGIN");

            // Lock robot
            const robotLock = await client.query("SELECT id, name FROM robots WHERE id = $1 FOR UPDATE", [robot_id]);

            if (robotLock.rows.length === 0) {
                await client.query("ROLLBACK");
                throw new Error("Robot not found");
            }

            const robot_name = robotLock.rows[0].name;

            // Find current session
            const currentSession = await client.query(
                `SELECT os.*, o.full_name as operator_name, o.employee_id, o.user_id
         FROM operator_sessions os
         JOIN operators o ON os.operator_id = o.id
         WHERE os.robot_id = $1 AND os.status = 'active'
         FOR UPDATE`,
                [robot_id],
            );

            let previousSession = null;

            if (currentSession.rows.length > 0) {
                const old = currentSession.rows[0];
                previousSession = old;

                // End previous session
                await client.query(
                    `UPDATE operator_sessions
           SET end_time = NOW(),
               status = 'interrupted',
               force_takeover = TRUE,
               taken_over_by = $2
           WHERE id = $1`,
                    [old.id, new_operator_id],
                );

                // Audit log
                await client.query(
                    `INSERT INTO session_audit_logs 
           (session_id, action, actor_user_id, target_operator_id, target_robot_id, details)
           VALUES ($1, 'force_takeover', $2, $3, $4, $5)`,
                    [
                        old.id,
                        supervisor_user_id,
                        old.operator_id,
                        robot_id,
                        JSON.stringify({
                            previous_operator: old.operator_name,
                            previous_employee_id: old.employee_id,
                            robot_name,
                        }),
                    ],
                );
            }

            // Check new operator is not busy
            const operatorCheck = await client.query(
                `SELECT id FROM operator_sessions 
         WHERE operator_id = $1 AND status = 'active'`,
                [new_operator_id],
            );

            if (operatorCheck.rows.length > 0) {
                await client.query("ROLLBACK");
                throw new Error("New operator is already controlling another robot");
            }

            // Create new session
            const control_token = crypto.randomBytes(32).toString("hex");
            const newSession = await client.query(
                `INSERT INTO operator_sessions 
         (operator_id, robot_id, status, control_token, socket_id, last_heartbeat)
         VALUES ($1, $2, 'active', $3, $4, NOW())
         RETURNING *`,
                [new_operator_id, robot_id, control_token, socket_id],
            );

            await client.query("COMMIT");

            logger.warn(`⚠️ Force takeover: ${robot_name}, from=${previousSession?.operator_name || "none"}, to=${new_operator_id}`);

            return {
                new_session: newSession.rows[0],
                previous_session: previousSession,
            };
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * VALIDATE COMMAND - Check if user authorized to control robot
     */
    static async validateCommand(robot_id, user_id, control_token = null) {
        const query = `
      SELECT os.id, os.control_token, os.operator_id, os.robot_id,
             o.full_name as operator_name, o.user_id as operator_user_id
      FROM operator_sessions os
      JOIN operators o ON os.operator_id = o.id
      WHERE os.robot_id = $1 
        AND os.status = 'active'
        AND o.user_id = $2
    `;
        const result = await database.query(query, [robot_id, user_id]);

        if (result.rows.length === 0) {
            return {
                authorized: false,
                reason: "Tidak ada session aktif untuk operator ini pada robot ini",
            };
        }

        const session = result.rows[0];

        // Validate control token jika disediakan
        if (control_token && session.control_token !== control_token) {
            return {
                authorized: false,
                reason: "Control token tidak valid",
            };
        }

        return {
            authorized: true,
            session,
        };
    }

    /**
     * UPDATE HEARTBEAT - Keep session alive
     */
    static async updateHeartbeat(session_id) {
        const query = `
      UPDATE operator_sessions
      SET last_heartbeat = NOW()
      WHERE id = $1 AND status = 'active'
      RETURNING id
    `;
        const result = await database.query(query, [session_id]);
        return result.rowCount > 0;
    }

    /**
     * CLEANUP STALE SESSIONS - Auto-end sessions without heartbeat
     */
    static async cleanupStaleSessions(timeout_minutes = 2) {
        const client = await database.getClient();

        try {
            await client.query("BEGIN");

            // Find stale sessions
            const staleQuery = `
        SELECT os.id, os.robot_id, os.operator_id, o.full_name as operator_name, r.name as robot_name
        FROM operator_sessions os
        JOIN operators o ON os.operator_id = o.id
        JOIN robots r ON os.robot_id = r.id
        WHERE os.status = 'active'
          AND os.last_heartbeat < NOW() - INTERVAL '${timeout_minutes} minutes'
        FOR UPDATE
      `;
            const staleResult = await client.query(staleQuery);

            if (staleResult.rows.length === 0) {
                await client.query("COMMIT");
                return [];
            }

            const staleSessions = staleResult.rows;

            // End all stale sessions
            for (const session of staleSessions) {
                await client.query(
                    `UPDATE operator_sessions
           SET status = 'interrupted', end_time = NOW()
           WHERE id = $1`,
                    [session.id],
                );

                // Audit log
                await client.query(
                    `INSERT INTO session_audit_logs 
           (session_id, action, target_operator_id, target_robot_id, details)
           VALUES ($1, 'stale_cleanup', $2, $3, $4)`,
                    [
                        session.id,
                        session.operator_id,
                        session.robot_id,
                        JSON.stringify({
                            reason: `No heartbeat for ${timeout_minutes} minutes`,
                            operator_name: session.operator_name,
                            robot_name: session.robot_name,
                        }),
                    ],
                );
            }

            await client.query("COMMIT");

            logger.warn(`🧹 Cleaned up ${staleSessions.length} stale sessions`);
            return staleSessions;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * END SESSION
     */
    static async endSession(session_id, status = "completed", notes = null, ended_by_user_id = null) {
        const client = await database.getClient();

        try {
            await client.query("BEGIN");

            // Get session info
            const sessionQuery = `
        SELECT os.*, o.full_name as operator_name, r.name as robot_name
        FROM operator_sessions os
        JOIN operators o ON os.operator_id = o.id
        JOIN robots r ON os.robot_id = r.id
        WHERE os.id = $1 AND os.status = 'active'
        FOR UPDATE
      `;
            const sessionResult = await client.query(sessionQuery, [session_id]);

            if (sessionResult.rows.length === 0) {
                await client.query("ROLLBACK");
                throw new Error("Active session not found or already ended");
            }

            const session = sessionResult.rows[0];

            // End session
            const endQuery = `
        UPDATE operator_sessions
        SET end_time = NOW(),
            status = $2,
            notes = COALESCE($3, notes)
        WHERE id = $1
        RETURNING *
      `;
            const endResult = await client.query(endQuery, [session_id, status, notes]);

            // Audit log
            await client.query(
                `INSERT INTO session_audit_logs 
         (session_id, action, actor_user_id, target_operator_id, target_robot_id, details)
         VALUES ($1, 'end', $2, $3, $4, $5)`,
                [
                    session_id,
                    ended_by_user_id,
                    session.operator_id,
                    session.robot_id,
                    JSON.stringify({
                        status,
                        notes,
                        operator_name: session.operator_name,
                        robot_name: session.robot_name,
                    }),
                ],
            );

            await client.query("COMMIT");

            logger.info(`✅ Session ended: ${session.operator_name} → ${session.robot_name} (${status})`);
            return endResult.rows[0];
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * GET ACTIVE SESSION
     */
    static async getActiveSession(robot_id) {
        const query = `
      SELECT os.*, o.full_name as operator_name, o.employee_id, 
             r.name as robot_name, u.username
      FROM operator_sessions os
      JOIN operators o ON os.operator_id = o.id
      JOIN robots r ON os.robot_id = r.id
      JOIN users u ON o.user_id = u.id
      WHERE os.robot_id = $1 AND os.status = 'active'
      LIMIT 1
    `;
        const result = await database.query(query, [robot_id]);
        return result.rows[0];
    }

    /**
     * UPDATE SESSION STATS
     */
    static async updateSessionStats(session_id, { total_score, distance_covered, harsh_brakes, collisions }) {
        const query = `
      UPDATE operator_sessions
      SET 
        total_score = COALESCE($2, total_score),
        distance_covered = COALESCE($3, distance_covered),
        harsh_brakes = COALESCE($4, harsh_brakes),
        collisions = COALESCE($5, collisions)
      WHERE id = $1
      RETURNING *
    `;
        const result = await database.query(query, [session_id, total_score, distance_covered, harsh_brakes, collisions]);
        return result.rows[0];
    }
}

export default OperatorSession;
