import Alert from "../models/Alert.js";
import { broadcastToAll } from "../config/websocket.js";
import logger from "../middleware/logger.js";

class AlertService {
    // In-memory cache to prevent duplicate alerts within time window
    static alertCache = new Map();
    static CACHE_TTL = 60000; // 1 minute

    /**
     * Create a new alert (with deduplication)
     */
    static async createAlert(data) {
        // Check for duplicate alert within time window
        const cacheKey = `${data.robot_id}:${data.type}`;
        const cached = this.alertCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            logger.debug(`Duplicate alert suppressed: ${data.type} for robot ${data.robot_id}`);
            return cached.alert;
        }

        // Create alert
        const alert = await Alert.create(data);

        // Cache the alert
        this.alertCache.set(cacheKey, {
            alert,
            timestamp: Date.now(),
        });

        // Broadcast alert
        broadcastToAll("alert:new", { alert });

        logger.warn(`Alert created: [${data.level.toUpperCase()}] ${data.type} - ${data.message}`);
        return alert;
    }

    /**
     * Get active alerts
     */
    static async getActiveAlerts(filters = {}) {
        return await Alert.getActive(filters);
    }

    /**
     * Get alert history
     */
    static async getAlertHistory(filters = {}) {
        return await Alert.getHistory(filters);
    }

    /**
     * Acknowledge an alert
     */
    static async acknowledgeAlert(id, acknowledgedBy) {
        const alert = await Alert.acknowledge(id, acknowledgedBy);

        if (alert) {
            broadcastToAll("alert:acknowledged", { alert });
            logger.info(`Alert ${id} acknowledged by ${acknowledgedBy}`);
        }

        return alert;
    }

    /**
     * Acknowledge all alerts for a robot
     */
    static async acknowledgeAllAlerts(robotId, acknowledgedBy) {
        const alerts = await Alert.acknowledgeAll(robotId, acknowledgedBy);

        if (alerts.length > 0) {
            broadcastToAll("alert:all_acknowledged", { robotId, count: alerts.length });
            logger.info(`${alerts.length} alerts acknowledged for robot ${robotId}`);
        }

        return alerts;
    }

    /**
     * Get alert statistics
     */
    static async getStatistics(hours = 24) {
        return await Alert.getStatistics(hours);
    }

    /**
     * Clean up alert cache periodically
     */
    static cleanupCache() {
        const now = Date.now();
        for (const [key, value] of this.alertCache.entries()) {
            if (now - value.timestamp > this.CACHE_TTL) {
                this.alertCache.delete(key);
            }
        }
    }
}

// Cleanup cache every 5 minutes
setInterval(() => AlertService.cleanupCache(), 300000);

export default AlertService;
