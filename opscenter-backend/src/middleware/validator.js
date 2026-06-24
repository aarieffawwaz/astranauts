import { body, param, query, validationResult } from "express-validator";
import { ApiError } from "./errorHandler.js";

/**
 * Handle validation result
 */
export const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((err) => ({
            field: err.path,
            message: err.msg,
        }));
        throw new ApiError(400, "Validation failed", errorMessages);
    }
    next();
};

// ============================================
// ROBOT VALIDATORS
// ============================================
export const validateRobotId = [param("id").isInt({ min: 1 }).withMessage("Robot ID must be a positive integer"), handleValidation];

export const validateRobotCreate = [
    body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 50 }).withMessage("Name must be less than 50 characters"),
    body("description").optional().isString().withMessage("Description must be a string"),
    handleValidation,
];

// ============================================
// TELEMETRY VALIDATORS
// ============================================
export const validateTelemetryCreate = [
    body("robot_id").isInt({ min: 1 }).withMessage("Robot ID must be a positive integer"),
    body("x_position").isFloat().withMessage("X position must be a number"),
    body("y_position").isFloat().withMessage("Y position must be a number"),
    body("speed").optional().isFloat({ min: 0 }).withMessage("Speed must be a positive number"),
    body("distance_to_obstacle").optional().isFloat({ min: 0 }).withMessage("Distance must be a positive number"),
    body("tilt_angle").optional().isFloat({ min: -90, max: 90 }).withMessage("Tilt angle must be between -90 and 90 degrees"),
    body("battery_level").optional().isInt({ min: 0, max: 100 }).withMessage("Battery level must be between 0 and 100"),
    handleValidation,
];

// ============================================
// COMMAND VALIDATORS
// ============================================
export const validateCommand = [
    body("robot_id").isInt({ min: 1 }).withMessage("Robot ID must be a positive integer"),
    body("command").isIn(["forward", "backward", "left", "right", "stop", "auto_mode", "manual_mode"]).withMessage("Invalid command"),
    body("parameters").optional().isObject().withMessage("Parameters must be an object"),
    handleValidation,
];

// ============================================
// RAG VALIDATORS
// ============================================
export const validateRagQuery = [
    body("question").trim().notEmpty().withMessage("Question is required").isLength({ min: 3, max: 500 }).withMessage("Question must be between 3 and 500 characters"),
    body("top_k").optional().isInt({ min: 1, max: 10 }).withMessage("Top K must be between 1 and 10"),
    handleValidation,
];

// ============================================
// PAGINATION VALIDATORS
// ============================================
export const validatePagination = [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer").toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100").toInt(),
    handleValidation,
];

export default {
    handleValidation,
    validateRobotId,
    validateRobotCreate,
    validateTelemetryCreate,
    validateCommand,
    validateRagQuery,
    validatePagination,
};
