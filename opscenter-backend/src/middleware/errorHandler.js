import logger from "./logger.js";

/**
 * Custom API Error class
 */
export class ApiError extends Error {
    constructor(statusCode, message, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req, res, next) => {
    const error = new ApiError(404, `Route not found: ${req.originalUrl}`);
    next(error);
};

/**
 * Global error handler
 */
export const errorHandler = (err, req, res, next) => {
    // Default values
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    let details = err.details || null;

    // Handle specific error types
    if (err.name === "ValidationError") {
        statusCode = 400;
        message = "Validation Error";
        details = err.errors;
    } else if (err.name === "CastError") {
        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`;
    } else if (err.code === "23505") {
        // PostgreSQL unique violation
        statusCode = 409;
        message = "Duplicate entry";
        details = err.detail;
    } else if (err.code === "23503") {
        // PostgreSQL foreign key violation
        statusCode = 400;
        message = "Foreign key constraint violation";
    }

    // Log error (stack trace hanya di log, tidak di response)
    const errorLog = {
        message: err.message,
        statusCode,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get("user-agent"),
    };

    if (statusCode >= 500) {
        logger.error("Server Error:", { ...errorLog, stack: err.stack });
    } else {
        logger.warn("Client Error:", errorLog);
    }

    // ✅ Send response WITHOUT stack trace
    const response = {
        success: false,
        message,
        ...(details && { details }),
        // ❌ HAPUS: stack trace tidak ditampilkan ke user
        // ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    };

    res.status(statusCode).json(response);
};

/**
 * Async handler wrapper to catch errors
 */
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

export default {
    ApiError,
    notFoundHandler,
    errorHandler,
    asyncHandler,
};
