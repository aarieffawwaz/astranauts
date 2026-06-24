import { Router } from "express";
import TelemetryController from "../controllers/telemetryController.js";
import { validateTelemetryCreate, validatePagination } from "../middleware/validator.js";

const router = Router();

/**
 * @swagger
 * /api/telemetry/latest:
 *   get:
 *     summary: Get all robots latest telemetry
 *     description: Retrieve the most recent telemetry data for all robots
 *     tags: [Telemetry]
 *     responses:
 *       200:
 *         description: Latest telemetry data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Telemetry'
 *       500:
 *         description: Server error
 */
router.get("/latest", TelemetryController.getAllLatest);

/**
 * @swagger
 * /api/telemetry:
 *   post:
 *     summary: Create telemetry record
 *     description: Record new telemetry data from a robot
 *     tags: [Telemetry]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - robot_id
 *               - x_position
 *               - y_position
 *             properties:
 *               robot_id:
 *                 type: integer
 *                 example: 1
 *                 description: ID of the robot
 *               latitude:
 *                 type: number
 *                 format: float
 *                 example: -2.123456
 *                 description: GPS latitude
 *               longitude:
 *                 type: number
 *                 format: float
 *                 example: 117.123456
 *                 description: GPS longitude
 *               x_position:
 *                 type: number
 *                 format: float
 *                 example: 10.5
 *                 description: X coordinate
 *               y_position:
 *                 type: number
 *                 format: float
 *                 example: 20.3
 *                 description: Y coordinate
 *               speed:
 *                 type: number
 *                 format: float
 *                 example: 15.2
 *                 description: Speed in cm/s
 *               pitch:
 *                 type: number
 *                 format: float
 *                 example: 2.5
 *                 description: Pitch angle from IMU (degrees)
 *               roll:
 *                 type: number
 *                 format: float
 *                 example: 0.8
 *                 description: Roll angle from IMU (degrees)
 *               distance_to_obstacle:
 *                 type: number
 *                 format: float
 *                 example: 45.0
 *                 description: Distance to nearest obstacle in cm
 *               collision_alert:
 *                 type: boolean
 *                 example: false
 *                 description: Collision alert status
 *               battery_level:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 85
 *                 description: Battery level percentage
 *               network_latency_ms:
 *                 type: integer
 *                 example: 24
 *                 description: Network latency in milliseconds
 *               status:
 *                 type: string
 *                 enum: [idle, moving, charging, error]
 *                 example: moving
 *                 description: Robot operational status
 *     responses:
 *       201:
 *         description: Telemetry recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Telemetry recorded
 *                 data:
 *                   $ref: '#/components/schemas/Telemetry'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post("/", validateTelemetryCreate, TelemetryController.create);

/**
 * @swagger
 * /api/telemetry/{robotId}/latest:
 *   get:
 *     summary: Get latest telemetry for a robot
 *     description: Retrieve the most recent telemetry data for a specific robot
 *     tags: [Telemetry]
 *     parameters:
 *       - in: path
 *         name: robotId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Robot ID
 *     responses:
 *       200:
 *         description: Latest telemetry retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Telemetry'
 *       404:
 *         description: No telemetry found
 *       500:
 *         description: Server error
 */
router.get("/:robotId/latest", TelemetryController.getLatest);

/**
 * @swagger
 * /api/telemetry/{robotId}/history:
 *   get:
 *     summary: Get telemetry history
 *     description: Retrieve historical telemetry data for a robot
 *     tags: [Telemetry]
 *     parameters:
 *       - in: path
 *         name: robotId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Robot ID
 *       - in: query
 *         name: start_time
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start time for history range
 *       - in: query
 *         name: end_time
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End time for history range
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of records
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of records to skip
 *     responses:
 *       200:
 *         description: Telemetry history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 100
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Telemetry'
 *       500:
 *         description: Server error
 */
router.get("/:robotId/history", validatePagination, TelemetryController.getHistory);

/**
 * @swagger
 * /api/telemetry/{robotId}/statistics:
 *   get:
 *     summary: Get telemetry statistics
 *     description: Get aggregated statistics for a robot's telemetry data
 *     tags: [Telemetry]
 *     parameters:
 *       - in: path
 *         name: robotId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Robot ID
 *       - in: query
 *         name: hours
 *         schema:
 *           type: integer
 *           default: 24
 *         description: Time range in hours
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_records:
 *                       type: integer
 *                       example: 1000
 *                     avg_speed:
 *                       type: number
 *                       format: float
 *                       example: 15.5
 *                     max_speed:
 *                       type: number
 *                       format: float
 *                       example: 25.0
 *                     avg_battery:
 *                       type: number
 *                       format: float
 *                       example: 85.5
 *                     avg_latency:
 *                       type: number
 *                       format: float
 *                       example: 24.5
 *                     collision_count:
 *                       type: integer
 *                       example: 0
 *       500:
 *         description: Server error
 */
router.get("/:robotId/statistics", TelemetryController.getStatistics);

export default router;
