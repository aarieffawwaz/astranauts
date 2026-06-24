import { Server } from "socket.io";
import logger from "../middleware/logger.js";

let io;

/**
 * Initialize Socket.IO
 * @param {Object} server - HTTP server instance
 */
export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
        pingTimeout: 60000,
        pingInterval: 25000,
    });

    logger.info("✅ Socket.IO initialized");
    return io;
};

/**
 * Get Socket.IO instance
 */
export const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO not initialized");
    }
    return io;
};

/**
 * Emit event to all clients
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
export const broadcastToAll = (event, data) => {
    if (io) {
        io.emit(event, data);
    }
};

/**
 * Emit event to specific room
 * @param {string} room - Room name
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
export const broadcastToRoom = (room, event, data) => {
    if (io) {
        io.to(room).emit(event, data);
    }
};

export default {
    initializeSocket,
    getIO,
    broadcastToAll,
    broadcastToRoom,
};
