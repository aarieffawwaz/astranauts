import { Router } from "express";
import AlertController from "../controllers/alertController.js";
import { validatePagination } from "../middleware/validator.js";

const router = Router();

/**
 * @swagger
 * /api/alerts/active:
 *   get:
 *     summary: Get active alerts
 *     description: Retrieve all unacknowledged alerts
 *     tags: [Alerts]
 *     parameters:
 *       - in: query
 *         name: robot_id
 *         schema:
 *           type: integer
 *         description: Filter by robot ID
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [critical, warning, info]
 *         description: Filter by alert level
 *     responses:
 *       200:
 *         description: Active alerts retrieved successfully
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
 *                     $ref: '#/components/schemas/Alert'
 *       500:
 *         description: Server error
 */
router.get("/active", AlertController.getActive);

/**
 * @swagger
 * /api/alerts/history:
 *   get:
 *     summary: Get alert history
 *     description: Retrieve historical alert data
 *     tags: [Alerts]
 *     parameters:
 *       - in: query
 *         name: robot_id
 *         schema:
 *           type: integer
 *         description: Filter by robot ID
 *       - in: query
 *         name: acknowledged
 *         schema:
 *           type: boolean
 *         description: Filter by acknowledged status
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
 *         description: Alert history retrieved successfully
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
 *                     $ref: '#/components/schemas/Alert'
 *       500:
 *         description: Server error
 */
router.get("/history", validatePagination, AlertController.getHistory);

/**
 * @swagger
 * /api/alerts/statistics:
 *   get:
 *     summary: Get alert statistics
 *     description: Get aggregated alert statistics
 *     tags: [Alerts]
 *     parameters:
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       level:
 *                         type: string
 *                         example: critical
 *                       type:
 *                         type: string
 *                         example: obstacle
 *                       count:
 *                         type: integer
 *                         example: 5
 *       500:
 *         description: Server error
 */
router.get("/statistics", AlertController.getStatistics);

/**
 * @swagger
 * /api/alerts/{id}/acknowledge:
 *   post:
 *     summary: Acknowledge an alert
 *     description: Mark an alert as acknowledged
 *     tags: [Alerts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Alert ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               acknowledged_by:
 *                 type: string
 *                 example: supervisor
 *                 description: User who acknowledged the alert
 *     responses:
 *       200:
 *         description: Alert acknowledged successfully
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
 *                   example: Alert acknowledged
 *                 data:
 *                   $ref: '#/components/schemas/Alert'
 *       404:
 *         description: Alert not found
 *       500:
 *         description: Server error
 */
router.post("/:id/acknowledge", AlertController.acknowledge);

/**
 * @swagger
 * /api/alerts/acknowledge-all/{robotId}:
 *   post:
 *     summary: Acknowledge all alerts for a robot
 *     description: Mark all unacknowledged alerts for a specific robot as acknowledged
 *     tags: [Alerts]
 *     parameters:
 *       - in: path
 *         name: robotId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Robot ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               acknowledged_by:
 *                 type: string
 *                 example: supervisor
 *                 description: User who acknowledged the alerts
 *     responses:
 *       200:
 *         description: Alerts acknowledged successfully
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
 *                   example: 3 alerts acknowledged
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Alert'
 *       500:
 *         description: Server error
 */
router.post("/acknowledge-all/:robotId", AlertController.acknowledgeAll);

export default router;
