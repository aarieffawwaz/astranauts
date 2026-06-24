import database from "../config/database.js";
import logger from "../middleware/logger.js";

class Alert {
    /**
     * Create a new alert
     */
    static async create({ robot_id, level, type, message, details = null }) {
        const query = `
      INSERT INTO alerts (robot_id, level, type, message, details)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
        const result = await database.query(query, [robot_id, level, type, message, details ? JSON.stringify(details) : null]);
        return result.rows[0];
    }

    /**
     * Get all active alerts
     */
    static async getActive({ robotId = null, level = null, limit = 50 } = {}) {
        let query = `
      SELECT a.*, r.name as robot_name 
      FROM alerts a
      JOIN robots r ON a.robot_id = r.id
      WHERE a.acknowledged = FALSE
    `;
        const params = [];
        let paramCount = 1;

        if (robotId) {
            query += ` AND a.robot_id = $${paramCount}`;
            params.push(robotId);
            paramCount++;
        }

        if (level) {
            query += ` AND a.level = $${paramCount}`;
            params.push(level);
            paramCount++;
        }

        query += ` ORDER BY a.created_at DESC LIMIT $${paramCount}`;
        params.push(limit);

        const result = await database.query(query, params);
        return result.rows;
    }

    /**
     * Get alerts history
     */
    static async getHistory({ robotId = null, acknowledged = null, startTime = null, endTime = null, limit = 100, offset = 0 } = {}) {
        let query = `
      SELECT a.*, r.name as robot_name 
      FROM alerts a
      JOIN robots r ON a.robot_id = r.id
      WHERE 1=1
    `;
        const params = [];
        let paramCount = 1;

        if (robotId) {
            query += ` AND a.robot_id = $${paramCount}`;
            params.push(robotId);
            paramCount++;
        }

        if (acknowledged !== null) {
            query += ` AND a.acknowledged = $${paramCount}`;
            params.push(acknowledged);
            paramCount++;
        }

        if (startTime) {
            query += ` AND a.created_at >= $${paramCount}`;
            params.push(startTime);
            paramCount++;
        }

        if (endTime) {
            query += ` AND a.created_at <= $${paramCount}`;
            params.push(endTime);
            paramCount++;
        }

        query += ` ORDER BY a.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await database.query(query, params);
        return result.rows;
    }

    /**
     * Acknowledge an alert
     */
    static async acknowledge(id, acknowledgedBy) {
        const query = `
      UPDATE alerts 
      SET acknowledged = TRUE, 
          acknowledged_by = $2,
          acknowledged_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
        const result = await database.query(query, [id, acknowledgedBy]);
        return result.rows[0];
    }

    /**
     * Acknowledge all alerts for a robot
     */
    static async acknowledgeAll(robotId, acknowledgedBy) {
        const query = `
      UPDATE alerts 
      SET acknowledged = TRUE, 
          acknowledged_by = $2,
          acknowledged_at = NOW()
      WHERE robot_id = $1 AND acknowledged = FALSE
      RETURNING *
    `;
        const result = await database.query(query, [robotId, acknowledgedBy]);
        return result.rows;
    }

    /**
     * Get alert statistics
     */
    static async getStatistics(hours = 24) {
        const query = `
      SELECT 
        level,
        type,
        COUNT(*) as count
      FROM alerts
      WHERE created_at >= NOW() - INTERVAL '${hours} hours'
      GROUP BY level, type
      ORDER BY count DESC
    `;
        const result = await database.query(query);
        return result.rows;
    }

    /**
     * Delete old acknowledged alerts
     */
    static async cleanup(daysToKeep = 30) {
        const query = `
      DELETE FROM alerts 
      WHERE acknowledged = TRUE 
        AND created_at < NOW() - INTERVAL '${daysToKeep} days'
    `;
        const result = await database.query(query);
        logger.info(`Cleaned up ${result.rowCount} old alerts`);
        return result.rowCount;
    }
}

export default Alert;
