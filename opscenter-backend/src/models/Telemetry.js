import database from "../config/database.js";
import logger from "../middleware/logger.js";

class Telemetry {
    /**
     * Create telemetry record
     */
    static async create(data) {
        const query = `
      INSERT INTO telemetry (
        robot_id,
        -- GPS
        latitude, longitude, altitude, gps_accuracy,
        -- Position
        x_position, y_position,
        -- Movement
        speed, heading,
        -- IMU
        pitch, roll, yaw,
        -- Obstacle
        distance_to_obstacle, collision_alert, obstacle_direction,
        -- System
        battery_level, power_draw, motor_temp, 
        signal_strength, network_latency_ms,
        -- Status
        status
      )
      VALUES (
        $1,
        $2, $3, $4, $5,
        $6, $7,
        $8, $9,
        $10, $11, $12,
        $13, $14, $15,
        $16, $17, $18, $19, $20,
        $21
      )
      RETURNING *
    `;

        const params = [
            data.robot_id,
            // GPS
            data.latitude || null,
            data.longitude || null,
            data.altitude || null,
            data.gps_accuracy || null,
            // Position
            data.x_position || null,
            data.y_position || null,
            // Movement
            data.speed || 0,
            data.heading || null,
            // IMU
            data.pitch || 0,
            data.roll || 0,
            data.yaw || 0,
            // Obstacle
            data.distance_to_obstacle || null,
            data.collision_alert || false,
            data.obstacle_direction || null,
            // System
            data.battery_level || null,
            data.power_draw || null,
            data.motor_temp || null,
            data.signal_strength || null,
            data.network_latency_ms || null,
            // Status
            data.status || "idle",
        ];

        const result = await database.query(query, params);
        return result.rows[0];
    }

    /**
     * Get latest telemetry for a robot
     */
    static async getLatest(robotId) {
        const query = `
      SELECT * FROM telemetry 
      WHERE robot_id = $1 
      ORDER BY timestamp DESC 
      LIMIT 1
    `;
        const result = await database.query(query, [robotId]);
        return result.rows[0];
    }

    /**
     * Get telemetry history
     */
    static async getHistory(robotId, { startTime = null, endTime = null, limit = 100, offset = 0 } = {}) {
        let query = "SELECT * FROM telemetry WHERE robot_id = $1";
        const params = [robotId];
        let paramCount = 2;

        if (startTime) {
            query += ` AND timestamp >= $${paramCount}`;
            params.push(startTime);
            paramCount++;
        }

        if (endTime) {
            query += ` AND timestamp <= $${paramCount}`;
            params.push(endTime);
            paramCount++;
        }

        query += ` ORDER BY timestamp DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await database.query(query, params);
        return result.rows;
    }

    /**
     * Get all robots latest telemetry
     */
    static async getAllLatest() {
        const query = `
      SELECT DISTINCT ON (robot_id) 
        t.*, r.name as robot_name, r.status as robot_status
      FROM telemetry t
      JOIN robots r ON t.robot_id = r.id
      ORDER BY robot_id, timestamp DESC
    `;
        const result = await database.query(query);
        return result.rows;
    }

    /**
     * Get telemetry statistics for a robot
     */
    static async getStatistics(robotId, hours = 24) {
        const query = `
      SELECT 
        COUNT(*) as total_records,
        AVG(speed) as avg_speed,
        MAX(speed) as max_speed,
        MIN(speed) as min_speed,
        AVG(distance_to_obstacle) as avg_obstacle_distance,
        AVG(pitch) as avg_pitch,
        AVG(roll) as avg_roll,
        AVG(battery_level) as avg_battery,
        AVG(network_latency_ms) as avg_latency,
        COUNT(CASE WHEN collision_alert = TRUE THEN 1 END) as collision_count
      FROM telemetry
      WHERE robot_id = $1 
        AND timestamp >= NOW() - INTERVAL '${hours} hours'
    `;
        const result = await database.query(query, [robotId]);
        return result.rows[0];
    }

    /**
     * Get GPS path for a robot
     */
    static async getGPSPath(robotId, limit = 1000) {
        const query = `
      SELECT 
        latitude, 
        longitude, 
        speed, 
        heading,
        timestamp
      FROM telemetry
      WHERE robot_id = $1 
        AND latitude IS NOT NULL 
        AND longitude IS NOT NULL
      ORDER BY timestamp DESC
      LIMIT $2
    `;
        const result = await database.query(query, [robotId, limit]);
        return result.rows.reverse(); // Reverse to get chronological order
    }

    /**
     * Get collision alerts history
     */
    static async getCollisionAlerts(robotId = null, limit = 100) {
        let query = `
      SELECT t.*, r.name as robot_name
      FROM telemetry t
      JOIN robots r ON t.robot_id = r.id
      WHERE t.collision_alert = TRUE
    `;
        const params = [];

        if (robotId) {
            query += " AND t.robot_id = $1";
            params.push(robotId);
        }

        query += ` ORDER BY t.timestamp DESC LIMIT $${params.length + 1}`;
        params.push(limit);

        const result = await database.query(query, params);
        return result.rows;
    }

    /**
     * Delete old telemetry records
     */
    static async cleanup(daysToKeep = 7) {
        const query = `
      DELETE FROM telemetry 
      WHERE timestamp < NOW() - INTERVAL '${daysToKeep} days'
    `;
        const result = await database.query(query);
        logger.info(`Cleaned up ${result.rowCount} old telemetry records`);
        return result.rowCount;
    }
}

export default Telemetry;
