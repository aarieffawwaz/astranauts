import { Router } from "express";
import AuthController from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";
import { body } from "express-validator";
import { handleValidation } from "../middleware/validator.js";

const router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     description: |
 *       Login untuk mendapatkan JWT token.
 *       **Endpoint ini PUBLIC - tidak perlu token untuk akses.**
 *     tags: [Authentication]
 *     security: []  # ✅ Override global security - endpoint ini tidak perlu auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/login", [body("username").notEmpty().withMessage("Username is required"), body("password").notEmpty().withMessage("Password is required"), handleValidation], AuthController.login);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register new user
 *     description: |
 *       Register user baru.
 *       **Endpoint ini PUBLIC - tidak perlu token untuk akses.**
 *     tags: [Authentication]
 *     security: []  # ✅ Override global security - endpoint ini tidak perlu auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     full_name:
 *                       type: string
 *                     role:
 *                       type: string
 *       409:
 *         description: Username or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
    "/register",
    [
        body("username").notEmpty().isLength({ min: 3 }).withMessage("Username must be at least 3 characters"),
        body("email").isEmail().withMessage("Invalid email"),
        body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
        body("full_name").notEmpty().withMessage("Full name is required"),
        handleValidation,
    ],
    AuthController.register,
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user
 *     description: |
 *       Get informasi user yang sedang login.
 *       **Endpoint ini PROTECTED - memerlukan JWT token.**
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []  # ✅ Endpoint ini perlu auth
 *     responses:
 *       200:
 *         description: Current user data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     full_name:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/me", authenticate, AuthController.getMe);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change password
 *     description: |
 *       Ubah password user yang sedang login.
 *       **Endpoint ini PROTECTED - memerlukan JWT token.**
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []  # ✅ Endpoint ini perlu auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - old_password
 *               - new_password
 *             properties:
 *               old_password:
 *                 type: string
 *                 description: Password lama
 *               new_password:
 *                 type: string
 *                 description: Password baru (min 6 karakter)
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Invalid old password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
    "/change-password",
    authenticate,
    [body("old_password").notEmpty().withMessage("Old password is required"), body("new_password").isLength({ min: 6 }).withMessage("New password must be at least 6 characters"), handleValidation],
    AuthController.changePassword,
);

export default router;
