import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import database from "../src/config/database.js";
import bcrypt from "bcryptjs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const initDatabase = async () => {
    try {
        console.log("🔄 Initializing database...");

        // ============================================
        // 1. CREATE SCHEMA (unified)
        // ============================================
        const schemaPath = path.join(__dirname, "../sql/schema.sql");
        const schema = await fs.readFile(schemaPath, "utf-8");

        console.log("📝 Creating tables...");
        await database.query(schema);
        console.log("✅ Tables created successfully");

        // ============================================
        // 2. INSERT SAMPLE ROBOT
        // ============================================
        console.log("\n🤖 Inserting sample robot...");
        await database.query("INSERT INTO robots (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING", ["HD-001", "Haul Truck #001 - Pilot Unit"]);
        console.log("  ✓ HD-001");

        // ============================================
        // 3. INSERT DEFAULT USERS
        // ============================================
        console.log("\n👤 Creating default users...");
        const defaultUsers = [
            { username: "admin", email: "admin@opscenter.com", password: "admin123", full_name: "System Administrator", role: "admin" },
            { username: "supervisor", email: "supervisor@opscenter.com", password: "supervisor123", full_name: "Site Supervisor", role: "supervisor" },
            { username: "operator1", email: "operator1@opscenter.com", password: "operator123", full_name: "Budi Santoso", role: "operator" },
            { username: "operator2", email: "operator2@opscenter.com", password: "operator123", full_name: "Agus Wijaya", role: "operator" },
            { username: "operator3", email: "operator3@opscenter.com", password: "operator123", full_name: "Hermawan Putra", role: "operator" },
        ];

        for (const userData of defaultUsers) {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(userData.password, salt);

            const result = await database.query(
                `INSERT INTO users (username, email, password_hash, full_name, role) 
                 VALUES ($1, $2, $3, $4, $5) 
                 ON CONFLICT (username) DO NOTHING
                 RETURNING id`,
                [userData.username, userData.email, password_hash, userData.full_name, userData.role],
            );

            if (result.rowCount > 0) {
                console.log(`  ✓ ${userData.username} (${userData.role})`);
            } else {
                console.log(`  ⚠ ${userData.username} already exists`);
            }
        }

        // ============================================
        // 4. INSERT DEFAULT OPERATORS
        // ============================================
        console.log("\n👷 Creating default operators...");
        const defaultOperators = [
            { username: "operator1", employee_id: "EMP001", specialization: "haul_truck", skill_level: "expert" },
            { username: "operator2", employee_id: "EMP002", specialization: "haul_truck", skill_level: "intermediate" },
            { username: "operator3", employee_id: "EMP003", specialization: "haul_truck", skill_level: "beginner" },
        ];

        for (const opData of defaultOperators) {
            const userResult = await database.query("SELECT id FROM users WHERE username = $1", [opData.username]);

            if (userResult.rows.length > 0) {
                const user_id = userResult.rows[0].id;

                const result = await database.query(
                    `INSERT INTO operators (user_id, employee_id, full_name, specialization, skill_level) 
                     VALUES ($1, $2, (SELECT full_name FROM users WHERE id = $1), $3, $4) 
                     ON CONFLICT (employee_id) DO NOTHING
                     RETURNING id`,
                    [user_id, opData.employee_id, opData.specialization, opData.skill_level],
                );

                if (result.rowCount > 0) {
                    console.log(`  ✓ ${opData.username} → ${opData.employee_id} (${opData.skill_level})`);
                } else {
                    console.log(`  ⚠ ${opData.username} operator already exists`);
                }
            }
        }

        // ============================================
        // SUMMARY
        // ============================================
        const stats = await database.query(`
            SELECT 
                (SELECT COUNT(*) FROM robots) as robots,
                (SELECT COUNT(*) FROM users) as users,
                (SELECT COUNT(*) FROM operators) as operators,
                (SELECT COUNT(*) FROM shift_types) as shifts
        `);

        console.log("\n✨ Database initialization complete!");
        console.log("📊 Summary:");
        console.log(`  • Robots: ${stats.rows[0].robots}`);
        console.log(`  • Users: ${stats.rows[0].users}`);
        console.log(`  • Operators: ${stats.rows[0].operators}`);
        console.log(`  • Shift Types: ${stats.rows[0].shifts}`);
        console.log("\n🔐 Default Credentials:");
        console.log("  • admin / admin123");
        console.log("  • supervisor / supervisor123");
        console.log("  • operator1 / operator123");
        console.log("  • operator2 / operator123");
        console.log("  • operator3 / operator123");

        process.exit(0);
    } catch (error) {
        console.error("❌ Database initialization failed:", error);
        process.exit(1);
    }
};

initDatabase();
