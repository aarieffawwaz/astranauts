import Robot from "../models/Robot.js";
import { ApiError } from "../middleware/errorHandler.js";
import logger from "../middleware/logger.js";
import { broadcastToAll } from "../config/websocket.js";

class RobotService {
    /**
     * Create a new robot
     */
    static async createRobot(data) {
        // Check if name already exists
        const existing = await Robot.findByName(data.name);
        if (existing) {
            throw new ApiError(409, `Robot with name ${data.name} already exists`);
        }

        const robot = await Robot.create(data);
        logger.info(`Robot created: ${robot.name}`);
        return robot;
    }

    /**
     * Get robot by ID
     */
    static async getRobotById(id) {
        const robot = await Robot.findById(id);
        if (!robot) {
            throw new ApiError(404, `Robot with ID ${id} not found`);
        }
        return robot;
    }

    /**
     * Get all robots
     */
    static async getAllRobots(filters = {}) {
        return await Robot.findAll(filters);
    }

    /**
     * Update robot status
     */
    static async updateRobotStatus(id, status, batteryLevel = null) {
        const robot = await Robot.findById(id);
        if (!robot) {
            throw new ApiError(404, `Robot with ID ${id} not found`);
        }

        const updated = await Robot.updateStatus(id, status, batteryLevel);

        // Broadcast status update
        broadcastToAll("robot:status", { robot: updated });

        logger.info(`Robot ${robot.name} status updated to ${status}`);
        return updated;
    }

    /**
     * Mark robot as online (called when heartbeat received)
     */
    static async markAsOnline(id) {
        const robot = await Robot.updateLastSeen(id);
        if (!robot) {
            throw new ApiError(404, `Robot with ID ${id} not found`);
        }
        return robot;
    }

    /**
     * Delete robot
     */
    static async deleteRobot(id) {
        const robot = await Robot.findById(id);
        if (!robot) {
            throw new ApiError(404, `Robot with ID ${id} not found`);
        }

        const deleted = await Robot.delete(id);
        logger.info(`Robot deleted: ${robot.name}`);

        // Broadcast deletion
        broadcastToAll("robot:deleted", { robotId: id });

        return deleted;
    }

    /**
     * Get robots statistics
     */
    static async getStatistics() {
        return await Robot.getStatistics();
    }

    /**
     * Check for offline robots (haven't sent heartbeat in last 30s)
     */
    static async checkOfflineRobots() {
        const query = `
      UPDATE robots 
      SET status = 'offline'
      WHERE status = 'online' 
        AND last_seen < NOW() - INTERVAL '30 seconds'
      RETURNING *
    `;
        const result = await (await import("../config/database.js")).default.query(query);

        if (result.rowCount > 0) {
            logger.warn(`${result.rowCount} robots marked as offline`);
            result.rows.forEach((robot) => {
                broadcastToAll("robot:offline", { robot });
            });
        }

        return result.rows;
    }
}

export default RobotService;
