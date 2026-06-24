import database from "../config/database.js";
import logger from "../middleware/logger.js";

class Robot {
    /**
     * Create a new robot
     */
    static async create({ name, description = null }) {
        const query = `
      INSERT INTO robots (name, description)
      VALUES ($1, $2)
      RETURNING *
    `;
        const result = await database.query(query, [name, description]);
        return result.rows[0];
    }

    /**
     * Find robot by ID
     */
    static async findById(id) {
        const query = "SELECT * FROM robots WHERE id = $1";
        const result = await database.query(query, [id]);
        return result.rows[0];
    }

    /**
     * Find robot by name
     */
    static async findByName(name) {
        const query = "SELECT * FROM robots WHERE name = $1";
        const result = await database.query(query, [name]);
        return result.rows[0];
    }

    /**
     * Get all robots
     */
    static async findAll({ status = null, limit = 100, offset = 0 } = {}) {
        let query = "SELECT * FROM robots";
        const params = [];

        if (status) {
            query += " WHERE status = $1";
            params.push(status);
        }

        query += " ORDER BY last_seen DESC LIMIT $" + (params.length + 1) + " OFFSET $" + (params.length + 2);
        params.push(limit, offset);

        const result = await database.query(query, params);
        return result.rows;
    }

    /**
     * Update robot status
     */
    static async updateStatus(id, status, batteryLevel = null) {
        let query, params;

        if (batteryLevel !== null) {
            query = `
        UPDATE robots 
        SET status = $1, battery_level = $2, last_seen = NOW()
        WHERE id = $3
        RETURNING *
      `;
            params = [status, batteryLevel, id];
        } else {
            query = `
        UPDATE robots 
        SET status = $1, last_seen = NOW()
        WHERE id = $2
        RETURNING *
      `;
            params = [status, id];
        }

        const result = await database.query(query, params);
        return result.rows[0];
    }

    /**
     * Update last seen timestamp
     */
    static async updateLastSeen(id) {
        const query = `
      UPDATE robots 
      SET last_seen = NOW(), status = 'online'
      WHERE id = $1
      RETURNING *
    `;
        const result = await database.query(query, [id]);
        return result.rows[0];
    }

    /**
     * Delete robot
     */
    static async delete(id) {
        const query = "DELETE FROM robots WHERE id = $1 RETURNING *";
        const result = await database.query(query, [id]);
        return result.rows[0];
    }

    /**
     * Get robots statistics
     */
    static async getStatistics() {
        const query = `
      SELECT 
        COUNT(*) as total_robots,
        COUNT(CASE WHEN status = 'online' THEN 1 END) as online_robots,
        COUNT(CASE WHEN status = 'offline' THEN 1 END) as offline_robots,
        COUNT(CASE WHEN status = 'charging' THEN 1 END) as charging_robots,
        COUNT(CASE WHEN status = 'error' THEN 1 END) as error_robots,
        AVG(battery_level) as avg_battery
      FROM robots
    `;
        const result = await database.query(query);
        return result.rows[0];
    }
}

export default Robot;
