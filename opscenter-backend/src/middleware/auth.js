import AuthService from "../services/authService.js";
import { ApiError } from "./errorHandler.js";

/**
 * Authenticate JWT token
 */
export const authenticate = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new ApiError(401, "Access token required");
        }

        const token = authHeader.substring(7); // Remove 'Bearer '

        // Verify token
        const decoded = AuthService.verifyToken(token);

        // Attach user to request
        req.user = decoded;

        next();
    } catch (error) {
        if (error instanceof ApiError) {
            next(error);
        } else {
            next(new ApiError(401, "Invalid token"));
        }
    }
};

/**
 * Authorize by role
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ApiError(401, "Authentication required"));
        }

        if (!roles.includes(req.user.role)) {
            return next(new ApiError(403, "Insufficient permissions"));
        }

        next();
    };
};

/**
 * Optional authentication (doesn't fail if no token)
 */
export const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.substring(7);
            const decoded = AuthService.verifyToken(token);
            req.user = decoded;
        }

        next();
    } catch (error) {
        // Don't fail, just continue without user
        next();
    }
};
