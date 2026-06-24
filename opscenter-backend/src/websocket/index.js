import { initializeSocket } from "../config/websocket.js";
import setupSocketHandlers from "./handler.js";

/**
 * Initialize WebSocket server
 */
export const initWebSocket = (server) => {
    const io = initializeSocket(server);
    setupSocketHandlers(io);
    return io;
};

export default initWebSocket;
