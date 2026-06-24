import pg from "pg";
import dotenv from "dotenv";
import logger from "../middleware/logger.js";

dotenv.config();

const { Pool } = pg;

// Database connection pool
const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || "opscenter",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test connection
pool.on("connect", () => {
    logger.info("✅ Database connected successfully");
});

pool.on("error", (err) => {
    logger.error("❌ Database connection error:", err);
    process.exit(-1);
});

/**
 * Execute a query with parameters
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
export const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        logger.debug(`Query executed in ${duration}ms`, {
            text: text.substring(0, 50),
            rowCount: result.rowCount,
        });
        return result;
    } catch (error) {
        logger.error("Query execution failed:", {
            text: text.substring(0, 50),
            error: error.message,
        });
        throw error;
    }
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise<Object>} Database client
 */
export const getClient = async () => {
    const client = await pool.connect();
    const originalQuery = client.query;
    const originalRelease = client.release;

    const timeout = setTimeout(() => {
        logger.error("Client was checked out for more than 5 seconds");
    }, 5000);

    // ✅ FIXED: Gunakan regular function dengan rest parameter
    client.query = (...args) => {
        return originalQuery.apply(client, args);
    };

    // ✅ FIXED: Gunakan regular function dengan rest parameter
    client.release = (...args) => {
        clearTimeout(timeout);
        return originalRelease.apply(client, args);
    };

    return client;
};

/**
 * Close the pool
 */
export const closePool = async () => {
    await pool.end();
    logger.info("Database pool closed");
};

export default {
    pool,
    query,
    getClient,
    closePool,
};
