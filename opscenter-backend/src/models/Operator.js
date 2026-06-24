import database from "../config/database.js";
import logger from "../middleware/logger.js";

class Operator {
    /**
     * Create a new operator
     */
    static async create({ user_id, employee_id, full_name, specialization, skill_level = "beginner" }) {
        const query = `
      INSERT INTO operators (user_id, employee_id, full_name, specialization, skill_level)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
        const result = await database.query(query, [user_id, employee_id, full_name, specialization, skill_level]);
        return result.rows[0];
    }

    /**
     * Find operator by ID
     */
    static async findById(id) {
        const query = `
      SELECT o.*, u.username, u.email
      FROM operators o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `;
        const result = await database.query(query, [id]);
        return result.rows[0];
    }

    /**
     * Find operator by employee ID
     */
    static async findByEmployeeId(employee_id) {
        const query = `
      SELECT o.*, u.username, u.email
      FROM operators o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.employee_id = $1
    `;
        const result = await database.query(query, [employee_id]);
        return result.rows[0];
    }

    /**
     * Find operator by user ID
     */
    static async findByUserId(user_id) {
        const query = `
      SELECT o.*, u.username, u.email
      FROM operators o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.user_id = $1
    `;
        const result = await database.query(query, [user_id]);
        return result.rows[0];
    }

    /**
     * Get all operators
     */
    static async findAll({ is_active = true, limit = 100, offset = 0 } = {}) {
        const query = `
      SELECT o.*, u.username, u.email
      FROM operators o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.is_active = $1
      ORDER BY o.full_name
      LIMIT $2 OFFSET $3
    `;
        const result = await database.query(query, [is_active, limit, offset]);
        return result.rows;
    }

    /**
     * Update operator
     */
    static async update(id, { specialization, skill_level, is_active }) {
        const query = `
      UPDATE operators
      SET 
        specialization = COALESCE($2, specialization),
        skill_level = COALESCE($3, skill_level),
        is_active = COALESCE($4, is_active)
      WHERE id = $1
      RETURNING *
    `;
        const result = await database.query(query, [id, specialization, skill_level, is_active]);
        return result.rows[0];
    }

    /**
     * Delete operator
     */
    static async delete(id) {
        const query = "DELETE FROM operators WHERE id = $1 RETURNING *";
        const result = await database.query(query, [id]);
        return result.rows[0];
    }
}

export default Operator;
