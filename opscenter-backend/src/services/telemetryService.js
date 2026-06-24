import Telemetry from "../models/Telemetry.js";
import Robot from "../models/Robot.js";
import AlertService from "./alertService.js";
import GamificationService from "./gamificationService.js";
import { broadcastToAll } from "../config/websocket.js";
import logger from "../middleware/logger.js";
import { THRESHOLDS } from "../utils/constants.js";

class TelemetryService {
    /**
     * Process incoming telemetry data
     */
    static async processTelemetry(data) {
        // Validate robot exists
        const robot = await Robot.findById(data.robot_id);
        if (!robot) {
            throw new Error(`Robot ${data.robot_id} not found`);
        }

        // Update robot last seen
        await Robot.updateLastSeen(data.robot_id);

        // Create telemetry record
        const telemetry = await Telemetry.create(data);

        // Check for alerts
        await this.checkForAlerts(data, robot);

        // Update gamification score
        await GamificationService.updateScore(data);

        // Broadcast telemetry update
        broadcastToAll("telemetry:update", {
            robot: robot.name,
            telemetry,
        });

        return telemetry;
    }

    /**
     * Check telemetry data for alert conditions
     */
    static async checkForAlerts(data, robot) {
        // Check obstacle distance
        if (data.distance_to_obstacle !== null && data.distance_to_obstacle !== undefined) {
            if (data.distance_to_obstacle < THRESHOLDS.OBSTACLE_DANGER) {
                await AlertService.createAlert({
                    robot_id: data.robot_id,
                    level: "critical",
                    type: "obstacle",
                    message: `Obstacle detected at ${data.distance_to_obstacle}cm - DANGER`,
                    details: { distance: data.distance_to_obstacle },
                });
            } else if (data.distance_to_obstacle < THRESHOLDS.OBSTACLE_WARNING) {
                await AlertService.createAlert({
                    robot_id: data.robot_id,
                    level: "warning",
                    type: "obstacle",
                    message: `Obstacle detected at ${data.distance_to_obstacle}cm`,
                    details: { distance: data.distance_to_obstacle },
                });
            }
        }

        // Check battery level
        if (data.battery_level !== null && data.battery_level !== undefined) {
            if (data.battery_level < THRESHOLDS.CRITICAL_BATTERY) {
                await AlertService.createAlert({
                    robot_id: data.robot_id,
                    level: "critical",
                    type: "low_battery",
                    message: `Critical battery level: ${data.battery_level}%`,
                    details: { battery_level: data.battery_level },
                });
            } else if (data.battery_level < THRESHOLDS.LOW_BATTERY) {
                await AlertService.createAlert({
                    robot_id: data.robot_id,
                    level: "warning",
                    type: "low_battery",
                    message: `Low battery level: ${data.battery_level}%`,
                    details: { battery_level: data.battery_level },
                });
            }
        }

        // Check tilt angle
        if (data.tilt_angle !== null && data.tilt_angle !== undefined) {
            if (Math.abs(data.tilt_angle) > THRESHOLDS.MAX_TILT) {
                await AlertService.createAlert({
                    robot_id: data.robot_id,
                    level: "critical",
                    type: "high_tilt",
                    message: `High tilt angle detected: ${data.tilt_angle}°`,
                    details: { tilt_angle: data.tilt_angle },
                });
            }
        }

        // Check speed
        if (data.speed !== null && data.speed !== undefined) {
            if (data.speed > THRESHOLDS.MAX_SPEED) {
                await AlertService.createAlert({
                    robot_id: data.robot_id,
                    level: "warning",
                    type: "speed_exceeded",
                    message: `Speed limit exceeded: ${data.speed} cm/s`,
                    details: { speed: data.speed, max: THRESHOLDS.MAX_SPEED },
                });
            }
        }

        // Check motor temperature
        if (data.motor_temp !== null && data.motor_temp !== undefined) {
            if (data.motor_temp > THRESHOLDS.MOTOR_OVERHEAT) {
                await AlertService.createAlert({
                    robot_id: data.robot_id,
                    level: "critical",
                    type: "motor_overheat",
                    message: `Motor overheating: ${data.motor_temp}°C`,
                    details: { motor_temp: data.motor_temp },
                });
            }
        }
    }

    /**
     * Get latest telemetry for a robot
     */
    static async getLatestTelemetry(robotId) {
        return await Telemetry.getLatest(robotId);
    }

    /**
     * Get telemetry history
     */
    static async getTelemetryHistory(robotId, options = {}) {
        return await Telemetry.getHistory(robotId, options);
    }

    /**
     * Get all robots latest telemetry
     */
    static async getAllLatestTelemetry() {
        return await Telemetry.getAllLatest();
    }

    /**
     * Get telemetry statistics
     */
    static async getStatistics(robotId, hours = 24) {
        return await Telemetry.getStatistics(robotId, hours);
    }
}

export default TelemetryService;
