import { Router } from "express";
import ShiftController from "../controllers/shiftController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { body } from "express-validator";
import { handleValidation } from "../middleware/validator.js";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/shifts/start:
 *   post:
 *     summary: Start shift
 *     description: |
 *       Start controlling a robot.
 *       - Uses database-level locking to prevent race conditions
 *       - Returns 409 if robot is already in use
 *       - Returns 409 if operator is already controlling another robot
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - operator_id
 *               - robot_id
 *             properties:
 *               operator_id:
 *                 type: integer
 *               robot_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Shift started
 *       409:
 *         description: Robot in use or operator busy
 */
router.post("/start", [body("operator_id").isInt().withMessage("Operator ID must be integer"), body("robot_id").isInt().withMessage("Robot ID must be integer"), handleValidation], ShiftController.startShift);

/**
 * @swagger
 * /api/shifts/force-takeover:
 *   post:
 *     summary: Force takeover (admin/supervisor only)
 *     description: |
 *       Supervisor can force takeover a robot from current operator.
 *       Previous session will be marked as 'interrupted' with force_takeover=true.
 *       Audit log will be created.
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 */
router.post("/force-takeover", authorize("admin", "supervisor"), [body("robot_id").isInt(), body("new_operator_id").isInt(), handleValidation], ShiftController.forceTakeover);

/**
 * @swagger
 * /api/shifts/heartbeat:
 *   post:
 *     summary: Send heartbeat
 *     description: Sessions without heartbeat for 2 minutes will be auto-ended
 *     tags: [Shifts]
 */
router.post("/heartbeat", [body("session_id").isInt(), handleValidation], ShiftController.heartbeat);

/**
 * @swagger
 * /api/shifts/end:
 *   post:
 *     summary: End shift
 *     tags: [Shifts]
 */
router.post("/end", [body("session_id").isInt(), handleValidation], ShiftController.endShift);

/**
 * @swagger
 * /api/shifts/current/{robotId}:
 *   get:
 *     summary: Get current operator
 *     tags: [Shifts]
 */
router.get("/current/:robotId", ShiftController.getCurrentOperator);

/**
 * @swagger
 * /api/shifts/robot/{robotId}/history:
 *   get:
 *     summary: Get robot history
 *     tags: [Shifts]
 */
router.get("/robot/:robotId/history", ShiftController.getRobotHistory);

/**
 * @swagger
 * /api/shifts/operator/{operatorId}/history:
 *   get:
 *     summary: Get operator history
 *     tags: [Shifts]
 */
router.get("/operator/:operatorId/history", ShiftController.getOperatorHistory);

/**
 * @swagger
 * /api/shifts/today:
 *   get:
 *     summary: Get today's sessions
 *     tags: [Shifts]
 */
router.get("/today", ShiftController.getTodaySessions);

/**
 * @swagger
 * /api/shifts/leaderboard:
 *   get:
 *     summary: Get leaderboard
 *     tags: [Shifts]
 */
router.get("/leaderboard", ShiftController.getLeaderboard);

export default router;
