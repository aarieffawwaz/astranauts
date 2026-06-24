import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import configurations
import { testOllamaConnection } from "./config/ollama.js";
import database from "./config/database.js";
import initWebSocket from "./websocket/index.js";
import { setupSwagger } from "./config/swagger.js";

// Import routes
import robotRoutes from "./routes/robotRoutes.js";
import telemetryRoutes from "./routes/telemetryRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import ragRoutes from "./routes/ragRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import shiftRoutes from "./routes/shiftRoutes.js";

// Import middleware
import logger from "./middleware/logger.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

// Import services
import RobotService from "./services/robotService.js";

// ============================================
// APP INITIALIZATION
// ============================================
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(
    morgan("combined", {
        stream: {
            write: (message) => logger.info(message.trim()),
        },
    }),
);

// ✅ SETUP SWAGGER (TARUH DI SINI, SEBELUM ROUTES)
setupSwagger(app);

// ============================================
// HEALTH CHECK
// ============================================
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: |
 *       Check status server.
 *       **Endpoint ini PUBLIC - tidak perlu token untuk akses.**
 *     tags: [System]
 *     security: []  # ✅ Override - endpoint ini tidak perlu auth
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   example: 123.45
 *                   description: Server uptime in seconds
 *                 environment:
 *                   type: string
 *                   example: development
 */
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
    });
});

// ============================================
// API ROUTES
// ============================================
app.use("/api/robots", robotRoutes);
app.use("/api/telemetry", telemetryRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/rag", ragRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/shifts", shiftRoutes);

// ============================================
// ERROR HANDLING
// ============================================
app.use(notFoundHandler);
app.use(errorHandler);

// ============================================
// INITIALIZATION
// ============================================
const startServer = async () => {
    try {
        // Test database connection
        logger.info("Testing database connection...");
        const client = await database.getClient();
        client.release();
        logger.info("✅ Database connection successful");

        // Ollama not used — skip connection test
        // logger.info("Testing Ollama connection...");
        // await testOllamaConnection();

        // Initialize WebSocket
        logger.info("Initializing WebSocket...");
        initWebSocket(server);
        logger.info("✅ WebSocket initialized");

        // Start offline robot checker
        setInterval(async () => {
            await RobotService.checkOfflineRobots();
        }, 30000); // Check every 30 seconds

        // Start server
        server.listen(PORT, () => {
            logger.info(`
╔═══════════════════════════════════════════════════════╗
║  🚀 OpsCenter Backend Server                          ║
║  ═══════════════════════════════════════════════════  ║
║  Port:       ${PORT}                                    ║
║  Environment: ${process.env.NODE_ENV || "development"}           ║
║  API:        http://localhost:${PORT}/api              ║
║  Health:     http://localhost:${PORT}/health           ║
║  WebSocket:  ws://localhost:${PORT}                    ║
║  Swagger:    http://localhost:${PORT}/api-docs         ║
╚═══════════════════════════════════════════════════════╝
      `);
        });
    } catch (error) {
        logger.error("Failed to start server:", error);
        process.exit(1);
    }
};

// Graceful shutdown
process.on("SIGTERM", async () => {
    logger.info("SIGTERM received. Shutting down gracefully...");
    await database.closePool();
    server.close(() => {
        logger.info("Server closed");
        process.exit(0);
    });
});

process.on("SIGINT", async () => {
    logger.info("SIGINT received. Shutting down gracefully...");
    await database.closePool();
    server.close(() => {
        logger.info("Server closed");
        process.exit(0);
    });
});

// Start the server
startServer();
