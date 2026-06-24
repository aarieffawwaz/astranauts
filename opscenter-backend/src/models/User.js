import database from "../config/database.js";
import bcrypt from "bcryptjs";
import logger from "../middleware/logger.js";

class User {
    /**
     * Create a new user
     */
    static async create({ username, email, password, full_name, role = "operator" }) {
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const query = `
      INSERT INTO users (username, email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, full_name, role, is_active, created_at
    `;

        const result = await database.query(query, [username, email, password_hash, full_name, role]);

        return result.rows[0];
    }

    /**
     * Find user by ID
     */
    static async findById(id) {
        const query = `
      SELECT id, username, email, full_name, role, is_active, last_login, created_at
      FROM users 
      WHERE id = $1
    `;
        const result = await database.query(query, [id]);
        return result.rows[0];
    }

    /**
     * Find user by username
     */
    static async findByUsername(username) {
        const query = `
      SELECT id, username, email, password_hash, full_name, role, is_active, last_login
      FROM users 
      WHERE username = $1
    `;
        const result = await database.query(query, [username]);
        return result.rows[0];
    }

    /**
     * Find user by email
     */
    static async findByEmail(email) {
        const query = `
      SELECT id, username, email, password_hash, full_name, role, is_active, last_login
      FROM users 
      WHERE email = $1
    `;
        const result = await database.query(query, [email]);
        return result.rows[0];
    }

    /**
     * Verify password
     */
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    /**
     * Update last login
     */
    static async updateLastLogin(id) {
        const query = `
      UPDATE users 
      SET last_login = NOW()
      WHERE id = $1
      RETURNING id, username, last_login
    `;
        const result = await database.query(query, [id]);
        return result.rows[0];
    }

    /**
     * Get all users
     */
    static async findAll({ role = null, is_active = null, limit = 100, offset = 0 } = {}) {
        let query = `
      SELECT id, username, email, full_name, role, is_active, last_login, created_at
      FROM users
      WHERE 1=1
    `;
        const params = [];
        let paramCount = 1;

        if (role) {
            query += ` AND role = $${paramCount}`;
            params.push(role);
            paramCount++;
        }

        if (is_active !== null) {
            query += ` AND is_active = $${paramCount}`;
            params.push(is_active);
            paramCount++;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await database.query(query, params);
        return result.rows;
    }

    /**
     * Update user
     */
    static async update(id, { full_name, email, role, is_active }) {
        const query = `
      UPDATE users
      SET 
        full_name = COALESCE($2, full_name),
        email = COALESCE($3, email),
        role = COALESCE($4, role),
        is_active = COALESCE($5, is_active)
      WHERE id = $1
      RETURNING id, username, email, full_name, role, is_active, updated_at
    `;
        const result = await database.query(query, [id, full_name, email, role, is_active]);
        return result.rows[0];
    }

    /**
     * Change password
     */
    static async changePassword(id, newPassword) {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(newPassword, salt);

        const query = `
      UPDATE users
      SET password_hash = $2
      WHERE id = $1
      RETURNING id, username
    `;
        const result = await database.query(query, [id, password_hash]);
        return result.rows[0];
    }

    /**
     * Delete user
     */
    static async delete(id) {
        const query = "DELETE FROM users WHERE id = $1 RETURNING id, username";
        const result = await database.query(query, [id]);
        return result.rows[0];
    }
}

export default User;
