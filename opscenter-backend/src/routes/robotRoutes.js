import { Router } from "express";
import RobotController from "../controllers/robotController.js";
import { validateRobotId, validateRobotCreate } from "../middleware/validator.js";

const router = Router();

/**
 * @swagger
 * /api/robots:
 *   get:
 *     summary: Get all robots
 *     description: |
 *       Retrieve a list of all robots with optional filtering.
 *       **Endpoint ini PROTECTED - memerlukan JWT token.**
 *     tags: [Robots]
 *     security:
 *       - bearerAuth: []  # ✅ Perlu auth
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [online, offline, charging, error]
 *         description: Filter robots by status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of robots to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of robots to skip
 *     responses:
 *       200:
 *         description: List of robots retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Robot'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/", RobotController.getAll);

/**
 * @swagger
 * /api/robots/statistics:
 *   get:
 *     summary: Get robot statistics
 *     description: |
 *       Get aggregated statistics for all robots.
 *       **Endpoint ini PROTECTED - memerlukan JWT token.**
 *     tags: [Robots]
 *     security:
 *       - bearerAuth: []  # ✅ Perlu auth
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_robots:
 *                       type: integer
 *                     online_robots:
 *                       type: integer
 *                     offline_robots:
 *                       type: integer
 *                     avg_battery:
 *                       type: number
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/statistics", RobotController.getStatistics);

/**
 * @swagger
 * /api/robots:
 *   post:
 *     summary: Create a new robot
 *     description: |
 *       Register a new robot in the system.
 *       **Endpoint ini PROTECTED - memerlukan JWT token (admin/supervisor only).**
 *     tags: [Robots]
 *     security:
 *       - bearerAuth: []  # ✅ Perlu auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: HD-001
 *                 description: Unique name for the robot
 *               description:
 *                 type: string
 *                 example: Haul Truck #001
 *                 description: Optional description
 *     responses:
 *       201:
 *         description: Robot created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Robot'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       409:
 *         description: Robot with this name already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/", validateRobotCreate, RobotController.create);

/**
 * @swagger
 * /api/robots/{id}:
 *   get:
 *     summary: Get robot by ID
 *     description: |
 *       Retrieve detailed information about a specific robot.
 *       **Endpoint ini PROTECTED - memerlukan JWT token.**
 *     tags: [Robots]
 *     security:
 *       - bearerAuth: []  # ✅ Perlu auth
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Robot ID
 *     responses:
 *       200:
 *         description: Robot details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Robot'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:id", validateRobotId, RobotController.getById);

/**
 * @swagger
 * /api/robots/{id}/status:
 *   patch:
 *     summary: Update robot status
 *     description: |
 *       Update the status and optionally battery level of a robot.
 *       **Endpoint ini PROTECTED - memerlukan JWT token.**
 *     tags: [Robots]
 *     security:
 *       - bearerAuth: []  # ✅ Perlu auth
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Robot ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [online, offline, charging, error]
 *                 example: online
 *               battery_level:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 85
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Robot'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch("/:id/status", validateRobotId, RobotController.updateStatus);

/**
 * @swagger
 * /api/robots/{id}:
 *   delete:
 *     summary: Delete robot
 *     description: |
 *       Remove a robot from the system.
 *       **Endpoint ini PROTECTED - memerlukan JWT token (admin only).**
 *     tags: [Robots]
 *     security:
 *       - bearerAuth: []  # ✅ Perlu auth
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Robot ID
 *     responses:
 *       200:
 *         description: Robot deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Robot'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete("/:id", validateRobotId, RobotController.delete);

export default router;
