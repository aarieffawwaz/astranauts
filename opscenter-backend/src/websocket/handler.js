import WebSocketService from "../services/websocketService.js";
import OperatorSession from "../models/OperatorSession.js";
import AuthService from "../services/authService.js";
import logger from "../middleware/logger.js";

// Track connected clients
const connectedClients = new Map();

export const setupSocketHandlers = (io) => {
    WebSocketService.initialize(io);

    io.on("connection", (socket) => {
        logger.info(`🔌 Client connected: ${socket.id}`);

        // ============================================
        // AUTHENTICATION
        // ============================================
        socket.on("auth:login", async (data) => {
            try {
                const decoded = AuthService.verifyToken(data.token);

                socket.data = {
                    type: "dashboard",
                    user: decoded,
                    authenticated: true,
                };

                connectedClients.set(socket.id, {
                    user: decoded,
                    active_sessions: new Set(),
                });

                socket.emit("auth:success", { user: decoded });
                logger.info(`✅ Socket authenticated: ${socket.id} → ${decoded.username}`);
            } catch (error) {
                socket.emit("auth:error", { message: "Invalid token" });
                socket.disconnect();
            }
        });

        // ============================================
        // SHIFT MANAGEMENT
        // ============================================
        socket.on("shift:start", async (data, callback) => {
            try {
                if (!socket.data?.authenticated) {
                    throw new Error("Not authenticated");
                }

                const ShiftService = (await import("../services/shiftService.js")).default;
                const session = await ShiftService.startShift(data.operator_id, data.robot_id, socket.data.user.id, socket.id);

                // Track active session
                connectedClients.get(socket.id)?.active_sessions.add(session.id);

                // Join robot room
                socket.join(`robot:${data.robot_id}`);

                callback?.({
                    success: true,
                    session: {
                        ...session,
                        // Don't expose control_token in callback, only via private channel
                    },
                });

                // Send control_token privately
                socket.emit("session:control_token", {
                    session_id: session.id,
                    control_token: session.control_token,
                });
            } catch (error) {
                logger.error("❌ Shift start failed:", error);
                callback?.({
                    success: false,
                    error: error.message,
                    code: error.code || "UNKNOWN",
                    details: error.details,
                });
            }
        });

        socket.on("shift:end", async (data, callback) => {
            try {
                if (!socket.data?.authenticated) {
                    throw new Error("Not authenticated");
                }

                const ShiftService = (await import("../services/shiftService.js")).default;
                const session = await ShiftService.endShift(data.session_id, socket.data.user.id, data.notes);

                // Remove from tracking
                connectedClients.get(socket.id)?.active_sessions.delete(data.session_id);

                callback?.({ success: true, session });
            } catch (error) {
                callback?.({ success: false, error: error.message });
            }
        });

        socket.on("shift:heartbeat", async (data) => {
            try {
                if (!socket.data?.authenticated) return;

                const ShiftService = (await import("../services/shiftService.js")).default;
                await ShiftService.heartbeat(data.session_id, socket.data.user.id);
            } catch (error) {
                // Silent fail
            }
        });

        // ============================================
        // ROBOT COMMANDS - WITH AUTHORIZATION
        // ============================================
        socket.on("robot:command", async (data, callback) => {
            try {
                if (!socket.data?.authenticated) {
                    throw new Error("Not authenticated");
                }

                // ✅ CRITICAL: Validate authorization
                const validation = await OperatorSession.validateCommand(data.robot_id, socket.data.user.id, data.control_token);

                if (!validation.authorized) {
                    logger.warn(`🚫 Unauthorized command: user=${socket.data.user.username}, robot=${data.robot_id}, reason=${validation.reason}`);
                    throw new Error(`Unauthorized: ${validation.reason}`);
                }

                // Update heartbeat
                await OperatorSession.updateHeartbeat(validation.session.id);

                // Send command
                await WebSocketService.sendCommand(data.robot_id, data.command, data.parameters || {}, socket.data.user.username);

                callback?.({ success: true });
            } catch (error) {
                logger.error("❌ Command failed:", error);
                callback?.({ success: false, error: error.message });
            }
        });

        // ============================================
        // ROBOT CONNECTIONS
        // ============================================
        socket.on("robot:register", async (data) => {
            try {
                socket.data = { type: "robot", name: data.name };
                await WebSocketService.handleRobotConnection(socket, data.name);
                socket.emit("robot:registered", { success: true });
            } catch (error) {
                socket.emit("error", { message: error.message });
            }
        });

        socket.on("robot:telemetry", async (data) => {
            await WebSocketService.handleTelemetry(data);
        });

        // ============================================
        // DISCONNECTION - Auto-end sessions
        // ============================================
        socket.on("disconnect", async () => {
            logger.info(`🔌 Client disconnected: ${socket.id}`);

            const clientInfo = connectedClients.get(socket.id);

            if (clientInfo && clientInfo.active_sessions.size > 0) {
                logger.warn(`⚠️ Operator disconnected with ${clientInfo.active_sessions.size} active session(s). Auto-ending...`);

                const ShiftService = (await import("../services/shiftService.js")).default;

                for (const session_id of clientInfo.active_sessions) {
                    try {
                        await ShiftService.endShift(session_id, clientInfo.user.id, "Auto-ended: operator disconnected");
                    } catch (error) {
                        logger.error(`Failed to auto-end session ${session_id}:`, error);
                    }
                }
            }

            connectedClients.delete(socket.id);
            await WebSocketService.handleRobotDisconnection(socket);
        });
    });
};

// ============================================
// PERIODIC CLEANUP: Stale Sessions (every 60s)
// ============================================
setInterval(async () => {
    try {
        const stale = await OperatorSession.cleanupStaleSessions(2);

        if (stale.length > 0) {
            const { broadcastToAll } = await import("../config/websocket.js");

            for (const session of stale) {
                broadcastToAll("shift:stale_ended", {
                    session_id: session.id,
                    robot_id: session.robot_id,
                    robot_name: session.robot_name,
                    operator_name: session.operator_name,
                    reason: "No heartbeat for 2 minutes",
                });
            }
        }
    } catch (error) {
        logger.error("Stale session cleanup failed:", error);
    }
}, 60000);

export default setupSocketHandlers;
