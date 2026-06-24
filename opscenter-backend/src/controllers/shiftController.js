import ShiftService from "../services/shiftService.js";
import { asyncHandler } from "../middleware/errorHandler.js";

class ShiftController {
    static startShift = asyncHandler(async (req, res) => {
        const { operator_id, robot_id } = req.body;
        const session = await ShiftService.startShift(operator_id, robot_id, req.user.id, req.headers["x-socket-id"] || null);

        res.status(201).json({
            success: true,
            message: "Shift started successfully",
            data: {
                ...session,
                // Hide control_token from REST response
                control_token: undefined,
            },
        });
    });

    static forceTakeover = asyncHandler(async (req, res) => {
        const { robot_id, new_operator_id } = req.body;
        const result = await ShiftService.forceTakeover(robot_id, new_operator_id, req.user.id);

        res.json({
            success: true,
            message: "Force takeover successful",
            data: result,
        });
    });

    static heartbeat = asyncHandler(async (req, res) => {
        const { session_id } = req.body;
        const result = await ShiftService.heartbeat(session_id, req.user.id);

        res.json({
            success: true,
            ...result,
        });
    });

    static endShift = asyncHandler(async (req, res) => {
        const { session_id, notes } = req.body;
        const session = await ShiftService.endShift(session_id, req.user.id, notes);

        res.json({
            success: true,
            message: "Shift ended successfully",
            data: session,
        });
    });

    static getCurrentOperator = asyncHandler(async (req, res) => {
        const session = await ShiftService.getCurrentOperator(parseInt(req.params.robotId));

        res.json({
            success: true,
            data: session,
        });
    });

    static getRobotHistory = asyncHandler(async (req, res) => {
        const limit = parseInt(req.query.limit) || 50;
        const history = await ShiftService.getRobotHistory(parseInt(req.params.robotId), limit);

        res.json({
            success: true,
            count: history.length,
            data: history,
        });
    });

    static getOperatorHistory = asyncHandler(async (req, res) => {
        const limit = parseInt(req.query.limit) || 50;
        const history = await ShiftService.getOperatorHistory(parseInt(req.params.operatorId), limit);

        res.json({
            success: true,
            count: history.length,
            data: history,
        });
    });

    static getTodaySessions = asyncHandler(async (req, res) => {
        const robot_id = req.query.robot_id ? parseInt(req.query.robot_id) : null;
        const sessions = await ShiftService.getTodaySessions(robot_id);

        res.json({
            success: true,
            count: sessions.length,
            data: sessions,
        });
    });

    static getLeaderboard = asyncHandler(async (req, res) => {
        const limit = parseInt(req.query.limit) || 10;
        const leaderboard = await ShiftService.getLeaderboard(limit);

        res.json({
            success: true,
            count: leaderboard.length,
            data: leaderboard,
        });
    });
}

export default ShiftController;
