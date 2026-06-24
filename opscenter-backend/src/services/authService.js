import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Operator from "../models/Operator.js";
import { ApiError } from "../middleware/errorHandler.js";
import logger from "../middleware/logger.js";

class AuthService {
    /**
     * Login user
     */
    static async login(username, password) {
        // Find user
        const user = await User.findByUsername(username);
        if (!user) {
            throw new ApiError(401, "Invalid username or password");
        }

        // Check if active
        if (!user.is_active) {
            throw new ApiError(403, "Account is deactivated");
        }

        // Verify password
        const isValid = await User.verifyPassword(password, user.password_hash);
        if (!isValid) {
            throw new ApiError(401, "Invalid username or password");
        }

        // Update last login
        await User.updateLastLogin(user.id);

        // Get operator profile if exists
        const operator = await Operator.findByUserId(user.id);

        // Generate JWT token
        const token = this.generateToken({
            id: user.id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            operator_id: operator?.id || null,
        });

        logger.info(`User logged in: ${user.username} (${user.role})`);

        return {
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                operator: operator || null,
            },
        };
    }

    /**
     * Generate JWT token
     */
    static generateToken(payload) {
        return jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "24h",
        });
    }

    /**
     * Verify JWT token
     */
    static verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            throw new ApiError(401, "Invalid or expired token");
        }
    }

    /**
     * Register new user
     */
    static async register({ username, email, password, full_name, role = "operator" }) {
        // Check if username exists
        const existingUser = await User.findByUsername(username);
        if (existingUser) {
            throw new ApiError(409, "Username already exists");
        }

        // Check if email exists
        const existingEmail = await User.findByEmail(email);
        if (existingEmail) {
            throw new ApiError(409, "Email already exists");
        }

        // Create user
        const user = await User.create({
            username,
            email,
            password,
            full_name,
            role,
        });

        logger.info(`New user registered: ${user.username} (${user.role})`);

        return user;
    }

    /**
     * Change password
     */
    static async changePassword(userId, oldPassword, newPassword) {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        // Verify old password
        const isValid = await User.verifyPassword(oldPassword, user.password_hash);
        if (!isValid) {
            throw new ApiError(401, "Invalid old password");
        }

        // Change password
        await User.changePassword(userId, newPassword);

        logger.info(`Password changed for user: ${user.username}`);

        return { message: "Password changed successfully" };
    }
}

export default AuthService;
