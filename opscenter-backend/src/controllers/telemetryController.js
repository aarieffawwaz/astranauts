import TelemetryService from "../services/telemetryService.js";
import { asyncHandler } from "../middleware/errorHandler.js";

class TelemetryController {
    /**
     * Create telemetry record
     * POST /api/telemetry
     */
    static create = asyncHandler(async (req, res) => {
        const telemetry = await TelemetryService.processTelemetry(req.body);
        res.status(201).json({
            success: true,
            message: "Telemetry recorded",
            data: telemetry,
        });
    });

    /**
     * Get latest telemetry for a robot
     * GET /api/telemetry/:robotId/latest
     */
    static getLatest = asyncHandler(async (req, res) => {
        const telemetry = await TelemetryService.getLatestTelemetry(parseInt(req.params.robotId));
        res.json({
            success: true,
            data: telemetry,
        });
    });

    /**
     * Get telemetry history
     * GET /api/telemetry/:robotId/history
     */
    static getHistory = asyncHandler(async (req, res) => {
        const options = {
            startTime: req.query.start_time,
            endTime: req.query.end_time,
            limit: parseInt(req.query.limit) || 100,
            offset: parseInt(req.query.offset) || 0,
        };
        const telemetry = await TelemetryService.getTelemetryHistory(parseInt(req.params.robotId), options);
        res.json({
            success: true,
            count: telemetry.length,
            data: telemetry,
        });
    });

    /**
     * Get all robots latest telemetry
     * GET /api/telemetry/latest
     */
    static getAllLatest = asyncHandler(async (req, res) => {
        const telemetry = await TelemetryService.getAllLatestTelemetry();
        res.json({
            success: true,
            count: telemetry.length,
            data: telemetry,
        });
    });

    /**
     * Get telemetry statistics
     * GET /api/telemetry/:robotId/statistics
     */
    static getStatistics = asyncHandler(async (req, res) => {
        const hours = parseInt(req.query.hours) || 24;
        const stats = await TelemetryService.getStatistics(parseInt(req.params.robotId), hours);
        res.json({
            success: true,
            data: stats,
        });
    });
}

export default TelemetryController;
