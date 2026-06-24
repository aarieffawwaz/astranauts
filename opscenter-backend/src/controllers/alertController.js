import AlertService from "../services/alertService.js";
import { asyncHandler } from "../middleware/errorHandler.js";

class AlertController {
    /**
     * Get active alerts
     * GET /api/alerts/active
     */
    static getActive = asyncHandler(async (req, res) => {
        const filters = {
            robotId: req.query.robot_id ? parseInt(req.query.robot_id) : null,
            level: req.query.level,
        };
        const alerts = await AlertService.getActiveAlerts(filters);
        res.json({
            success: true,
            count: alerts.length,
            data: alerts,
        });
    });

    /**
     * Get alert history
     * GET /api/alerts/history
     */
    static getHistory = asyncHandler(async (req, res) => {
        const filters = {
            robotId: req.query.robot_id ? parseInt(req.query.robot_id) : null,
            acknowledged: req.query.acknowledged === "true" ? true : req.query.acknowledged === "false" ? false : null,
            startTime: req.query.start_time,
            endTime: req.query.end_time,
            limit: parseInt(req.query.limit) || 100,
            offset: parseInt(req.query.offset) || 0,
        };
        const alerts = await AlertService.getAlertHistory(filters);
        res.json({
            success: true,
            count: alerts.length,
            data: alerts,
        });
    });

    /**
     * Acknowledge an alert
     * POST /api/alerts/:id/acknowledge
     */
    static acknowledge = asyncHandler(async (req, res) => {
        const { acknowledged_by } = req.body;
        const alert = await AlertService.acknowledgeAlert(parseInt(req.params.id), acknowledged_by || "anonymous");
        res.json({
            success: true,
            message: "Alert acknowledged",
            data: alert,
        });
    });

    /**
     * Acknowledge all alerts for a robot
     * POST /api/alerts/acknowledge-all/:robotId
     */
    static acknowledgeAll = asyncHandler(async (req, res) => {
        const { acknowledged_by } = req.body;
        const alerts = await AlertService.acknowledgeAllAlerts(parseInt(req.params.robotId), acknowledged_by || "anonymous");
        res.json({
            success: true,
            message: `${alerts.length} alerts acknowledged`,
            count: alerts.length,
            data: alerts,
        });
    });

    /**
     * Get alert statistics
     * GET /api/alerts/statistics
     */
    static getStatistics = asyncHandler(async (req, res) => {
        const hours = parseInt(req.query.hours) || 24;
        const stats = await AlertService.getStatistics(hours);
        res.json({
            success: true,
            data: stats,
        });
    });
}

export default AlertController;
