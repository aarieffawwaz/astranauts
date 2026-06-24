import OperatorSession from "../models/OperatorSession.js";
import Robot from "../models/Robot.js";
import Operator from "../models/Operator.js";
import User from "../models/User.js";
import GamificationService from "./gamificationService.js";
import { ApiError } from "../middleware/errorHandler.js";
import { broadcastToAll } from "../config/websocket.js";
import logger from "../middleware/logger.js";

class ShiftService {
    /**
     * START SHIFT - API validation + DB atomic operation
     */
    static async startShift(operator_id, robot_id, user_id, socket_id = null) {
        // ✅ API-LEVEL VALIDATION 1: Validate operator exists & active
        const operator = await Operator.findById(operator_id);
        if (!operator) {
            throw new ApiError(404, "Operator tidak ditemukan");
        }
        if (!operator.is_active) {
            throw new ApiError(403, "Operator tidak aktif");
        }

        // ✅ API-LEVEL VALIDATION 2: Ensure user owns this operator profile
        if (operator.user_id !== user_id) {
            throw new ApiError(403, "Anda hanya bisa memulai shift untuk profil operator Anda sendiri");
        }

        // ✅ API-LEVEL VALIDATION 3: Validate robot exists
        const robot = await Robot.findById(robot_id);
        if (!robot) {
            throw new ApiError(404, "Robot tidak ditemukan");
        }

        // ✅ DATABASE ATOMIC OPERATION (dengan locking)
        try {
            const session = await OperatorSession.startSession(operator_id, robot_id, socket_id);

            // Reset gamification
            GamificationService.resetSession(robot_id);

            // Broadcast
            broadcastToAll("shift:started", {
                session,
                operator: operator.full_name,
                robot: robot.name,
                started_by: user_id,
            });

            logger.info(`✅ Shift started: ${operator.full_name} → ${robot.name}`);
            return session;
        } catch (error) {
            // Handle specific error codes dari DB
            if (error.code === "ROBOT_IN_USE") {
                throw new ApiError(409, error.message, { existing_session: error.existing_session });
            }
            if (error.code === "OPERATOR_BUSY") {
                throw new ApiError(409, error.message);
            }
            if (error.code === "ROBOT_NOT_FOUND") {
                throw new ApiError(404, error.message);
            }
            throw error;
        }
    }

    /**
     * FORCE TAKEOVER - Supervisor override
     */
    static async forceTakeover(robot_id, new_operator_id, supervisor_user_id, socket_id = null) {
        // ✅ API-LEVEL VALIDATION 1: Validate supervisor role
        const supervisor = await User.findById(supervisor_user_id);
        if (!supervisor) {
            throw new ApiError(404, "Supervisor tidak ditemukan");
        }
        if (!["admin", "supervisor"].includes(supervisor.role)) {
            throw new ApiError(403, "Hanya admin/supervisor yang bisa force takeover");
        }

        // ✅ API-LEVEL VALIDATION 2: Validate new operator
        const newOperator = await Operator.findById(new_operator_id);
        if (!newOperator) {
            throw new ApiError(404, "Operator target tidak ditemukan");
        }
        if (!newOperator.is_active) {
            throw new ApiError(403, "Operator target tidak aktif");
        }

        // ✅ API-LEVEL VALIDATION 3: Validate robot
        const robot = await Robot.findById(robot_id);
        if (!robot) {
            throw new ApiError(404, "Robot tidak ditemukan");
        }

        // ✅ DATABASE ATOMIC OPERATION
        const result = await OperatorSession.forceTakeover(robot_id, new_operator_id, supervisor_user_id, socket_id);

        // Notify previous operator
        if (result.previous_session) {
            broadcastToAll("shift:force_taken_over", {
                robot_id,
                robot_name: robot.name,
                previous_operator: result.previous_session.operator_name,
                new_operator: newOperator.full_name,
                taken_by: supervisor.full_name,
            });
        }

        // Start new gamification
        GamificationService.resetSession(robot_id);

        broadcastToAll("shift:started", {
            session: result.new_session,
            operator: newOperator.full_name,
            robot: robot.name,
            force_takeover: true,
        });

        logger.warn(`⚠️ Force takeover: ${robot.name} from ${result.previous_session?.operator_name || "none"} to ${newOperator.full_name}`);

        return result;
    }

    /**
     * END SHIFT
     */
    static async endShift(session_id, user_id, notes = null) {
        // ✅ API-LEVEL VALIDATION: Get session & check ownership
        const sessionQuery = `
      SELECT os.*, o.user_id as operator_user_id, o.full_name as operator_name,
             r.name as robot_name
      FROM operator_sessions os
      JOIN operators o ON os.operator_id = o.id
      JOIN robots r ON os.robot_id = r.id
      WHERE os.id = $1 AND os.status = 'active'
    `;
        const database = (await import("../config/database.js")).default;
        const sessionResult = await database.query(sessionQuery, [session_id]);

        if (sessionResult.rows.length === 0) {
            throw new ApiError(404, "Session aktif tidak ditemukan");
        }

        const session = sessionResult.rows[0];

        // ✅ API-LEVEL VALIDATION: Check permission
        const user = await User.findById(user_id);
        const canEnd = session.operator_user_id === user_id || ["admin", "supervisor"].includes(user.role);

        if (!canEnd) {
            throw new ApiError(403, "Anda hanya bisa mengakhiri shift Anda sendiri atau Anda harus admin/supervisor");
        }

        // Get current scores
        const currentScores = GamificationService.getCurrentScores(session.robot_id);

        // Update session stats
        if (currentScores) {
            await OperatorSession.updateSessionStats(session_id, {
                total_score: currentScores.total_score,
                distance_covered: currentScores.distance_covered / 100,
                harsh_brakes: currentScores.harsh_brakes,
                collisions: currentScores.collisions,
            });
        }

        // ✅ DATABASE ATOMIC OPERATION
        const endedSession = await OperatorSession.endSession(session_id, "completed", notes, user_id);

        // Save gamification
        await GamificationService.saveSession(session.robot_id, session.operator_name);

        // Broadcast
        broadcastToAll("shift:ended", {
            session: endedSession,
            final_scores: currentScores,
            ended_by: user.full_name,
        });

        logger.info(`✅ Shift ended: ${session.operator_name} → ${session.robot_name}`);

        return endedSession;
    }

    /**
     * HEARTBEAT - Keep session alive
     */
    static async heartbeat(session_id, user_id) {
        // ✅ API-LEVEL VALIDATION: Check ownership
        const sessionQuery = `
      SELECT o.user_id as operator_user_id
      FROM operator_sessions os
      JOIN operators o ON os.operator_id = o.id
      WHERE os.id = $1 AND os.status = 'active'
    `;
        const database = (await import("../config/database.js")).default;
        const result = await database.query(sessionQuery, [session_id]);

        if (result.rows.length === 0) {
            throw new ApiError(404, "Session aktif tidak ditemukan");
        }

        if (result.rows[0].operator_user_id !== user_id) {
            throw new ApiError(403, "Bukan session Anda");
        }

        // ✅ DATABASE OPERATION
        await OperatorSession.updateHeartbeat(session_id);
        return { success: true };
    }

    /**
     * GET CURRENT OPERATOR
     */
    static async getCurrentOperator(robot_id) {
        const session = await OperatorSession.getActiveSession(robot_id);
        return session || null;
    }

    /**
     * GET ROBOT HISTORY
     */
    static async getRobotHistory(robot_id, limit = 50) {
        const OperatorSession = (await import("../models/OperatorSession.js")).default;
        return await OperatorSession.getRobotHistory(robot_id, { limit });
    }

    /**
     * GET OPERATOR HISTORY
     */
    static async getOperatorHistory(operator_id, limit = 50) {
        const OperatorSession = (await import("../models/OperatorSession.js")).default;
        return await OperatorSession.getOperatorHistory(operator_id, { limit });
    }

    /**
     * GET TODAY'S SESSIONS
     */
    static async getTodaySessions(robot_id = null) {
        const OperatorSession = (await import("../models/OperatorSession.js")).default;
        return await OperatorSession.getTodaySessions(robot_id);
    }

    /**
     * GET LEADERBOARD
     */
    static async getLeaderboard(limit = 10) {
        const OperatorSession = (await import("../models/OperatorSession.js")).default;
        return await OperatorSession.getLeaderboard(limit);
    }
}

export default ShiftService;
