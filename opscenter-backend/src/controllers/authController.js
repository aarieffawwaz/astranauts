import AuthService from "../services/authService.js";
import { asyncHandler } from "../middleware/errorHandler.js";

class AuthController {
    /**
     * Login
     * POST /api/auth/login
     */
    static login = asyncHandler(async (req, res) => {
        const { username, password } = req.body;
        const result = await AuthService.login(username, password);

        res.json({
            success: true,
            message: "Login successful",
            data: result,
        });
    });

    /**
     * Register
     * POST /api/auth/register
     */
    static register = asyncHandler(async (req, res) => {
        const user = await AuthService.register(req.body);

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: user,
        });
    });

    /**
     * Get current user
     * GET /api/auth/me
     */
    static getMe = asyncHandler(async (req, res) => {
        res.json({
            success: true,
            data: req.user,
        });
    });

    /**
     * Change password
     * POST /api/auth/change-password
     */
    static changePassword = asyncHandler(async (req, res) => {
        const { old_password, new_password } = req.body;
        const result = await AuthService.changePassword(req.user.id, old_password, new_password);

        res.json({
            success: true,
            ...result,
        });
    });
}

export default AuthController;
