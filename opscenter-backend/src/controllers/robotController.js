import RobotService from "../services/robotService.js";
import { asyncHandler } from "../middleware/errorHandler.js";

class RobotController {
    /**
     * Create a new robot
     * POST /api/robots
     */
    static create = asyncHandler(async (req, res) => {
        const robot = await RobotService.createRobot(req.body);
        res.status(201).json({
            success: true,
            message: "Robot created successfully",
            data: robot,
        });
    });

    /**
     * Get all robots
     * GET /api/robots
     */
    static getAll = asyncHandler(async (req, res) => {
        const filters = {
            status: req.query.status,
            limit: parseInt(req.query.limit) || 100,
            offset: parseInt(req.query.offset) || 0,
        };
        const robots = await RobotService.getAllRobots(filters);
        res.json({
            success: true,
            count: robots.length,
            data: robots,
        });
    });

    /**
     * Get robot by ID
     * GET /api/robots/:id
     */
    static getById = asyncHandler(async (req, res) => {
        const robot = await RobotService.getRobotById(parseInt(req.params.id));
        res.json({
            success: true,
            data: robot,
        });
    });

    /**
     * Update robot status
     * PATCH /api/robots/:id/status
     */
    static updateStatus = asyncHandler(async (req, res) => {
        const { status, battery_level } = req.body;
        const robot = await RobotService.updateRobotStatus(parseInt(req.params.id), status, battery_level);
        res.json({
            success: true,
            message: "Robot status updated",
            data: robot,
        });
    });

    /**
     * Delete robot
     * DELETE /api/robots/:id
     */
    static delete = asyncHandler(async (req, res) => {
        const robot = await RobotService.deleteRobot(parseInt(req.params.id));
        res.json({
            success: true,
            message: "Robot deleted successfully",
            data: robot,
        });
    });

    /**
     * Get robot statistics
     * GET /api/robots/statistics
     */
    static getStatistics = asyncHandler(async (req, res) => {
        const stats = await RobotService.getStatistics();
        res.json({
            success: true,
            data: stats,
        });
    });
}

export default RobotController;
