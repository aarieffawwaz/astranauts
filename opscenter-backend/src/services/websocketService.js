import RobotService from "./robotService.js";
import TelemetryService from "./telemetryService.js";
import GamificationService from "./gamificationService.js";
import { broadcastToAll } from "../config/websocket.js";
import logger from "../middleware/logger.js";

class WebSocketService {
    static io = null;

    /**
     * Initialize WebSocket service
     */
    static initialize(io) {
        this.io = io;
        logger.info("WebSocket service initialized");
    }

    /**
     * Send command to robot
     */
    static async sendCommand(robotId, command, parameters = {}, issuedBy = null) {
        const robot = await RobotService.getRobotById(robotId);

        // Find robot's socket connection
        const robotSocketId = this.findRobotSocket(robot.name);

        if (!robotSocketId) {
            throw new Error(`Robot ${robot.name} is not connected`);
        }

        // Send command
        this.io.to(robotSocketId).emit("robot:command", {
            command,
            parameters,
            timestamp: Date.now(),
        });

        // Log command
        const database = (await import("../config/database.js")).default;
        await database.query(
            `INSERT INTO commands_log (robot_id, command, parameters, issued_by)
       VALUES ($1, $2, $3, $4)`,
            [robotId, command, JSON.stringify(parameters), issuedBy],
        );

        logger.info(`Command sent to ${robot.name}: ${command}`);

        // Broadcast command to all clients
        broadcastToAll("robot:command_sent", {
            robot: robot.name,
            command,
            parameters,
            issued_by: issuedBy,
        });

        return { success: true, robot: robot.name, command };
    }

    /**
     * Find socket ID for a robot
     */
    static findRobotSocket(robotName) {
        const sockets = this.io.sockets.sockets;
        for (const [socketId, socket] of sockets) {
            if (socket.data && socket.data.type === "robot" && socket.data.name === robotName) {
                return socketId;
            }
        }
        return null;
    }

    /**
     * Handle robot connection
     */
    static async handleRobotConnection(socket, robotName) {
        socket.data = { type: "robot", name: robotName };

        const robot = await RobotService.getAllRobots().then((robots) => robots.find((r) => r.name === robotName));

        if (robot) {
            await RobotService.markAsOnline(robot.id);
            logger.info(`Robot ${robotName} connected (ID: ${robot.id})`);
        }

        broadcastToAll("robot:connected", { name: robotName });
    }

    /**
     * Handle robot disconnection
     */
    static async handleRobotDisconnection(socket) {
        if (socket.data?.type === "robot") {
            const robotName = socket.data.name;
            logger.info(`Robot ${robotName} disconnected`);

            const robots = await RobotService.getAllRobots();
            const robot = robots.find((r) => r.name === robotName);

            if (robot) {
                await RobotService.updateRobotStatus(robot.id, "offline");
            }

            broadcastToAll("robot:disconnected", { name: robotName });
        }
    }

    /**
     * Handle incoming telemetry
     */
    static async handleTelemetry(data) {
        try {
            await TelemetryService.processTelemetry(data);
        } catch (error) {
            logger.error("Failed to process telemetry:", error);
        }
    }

    /**
     * Get connected clients statistics
     */
    static getStatistics() {
        const sockets = this.io?.sockets?.sockets || new Map();
        let robots = 0;
        let dashboards = 0;

        for (const [socketId, socket] of sockets) {
            if (socket.data?.type === "robot") robots++;
            else dashboards++;
        }

        return { robots, dashboards, total: robots + dashboards };
    }
}

export default WebSocketService;
