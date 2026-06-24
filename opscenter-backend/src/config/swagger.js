import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "OpsCenter API - Smart Mining Fleet Management",
            version: "1.0.0",
            description: `
## 🚀 OpsCenter Backend API

API documentation for **OpsCenter - Physical Digital Twin** untuk Smart Mining Operations PT Pamapersada Nusantara.

### 🔐 Authentication
API ini menggunakan **JWT Bearer Token** untuk autentikasi user.

**Cara menggunakan:**
1. Login via \`POST /api/auth/login\` (tidak perlu token) untuk mendapatkan token
2. Klik tombol **"Authorize"** 🔒 di kanan atas
3. Masukkan token JWT (bisa dengan atau tanpa prefix \`Bearer\`)
4. Klik **Authorize** → **Close**
5. Semua endpoint yang dilindungi sekarang bisa diakses

### 📝 Public Endpoints (Tidak Perlu Login)
- \`POST /api/auth/login\` - Login untuk dapat token
- \`POST /api/auth/register\` - Register user baru
- \`GET /health\` - Health check

### 🔒 Protected Endpoints (Perlu Login)
Semua endpoint lain memerlukan JWT token.

### Quick Start:
\`\`\`bash
# 1. Login untuk dapat token
curl -X POST http://localhost:3000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username": "admin", "password": "admin123"}'

# 2. Copy token dari response, lalu klik Authorize di Swagger

# 3. Test protected endpoint
curl -X GET http://localhost:3000/api/robots \\
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`

### Default Credentials:
| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |
| supervisor | supervisor123 | Supervisor |
| operator1 | operator123 | Operator |
| operator2 | operator123 | Operator |
| operator3 | operator123 | Operator |
      `,
            contact: {
                name: "OpsCenter Team",
                email: "team@opscenter.com",
            },
            license: {
                name: "MIT",
                url: "https://opensource.org/licenses/MIT",
            },
        },
        servers: [
            {
                url: "http://localhost:3000",
                description: "Development server",
            },
        ],

        // ❌ HAPUS: Global security (ini yang bikin semua endpoint butuh login)
        // security: [
        //   {
        //     bearerAuth: [],
        //   },
        // ],

        tags: [
            {
                name: "System",
                description: "System endpoints (health check)",
            },
            {
                name: "Authentication",
                description: "User authentication & authorization",
            },
            {
                name: "Robots",
                description: "Robot management endpoints",
            },
            {
                name: "Telemetry",
                description: "Telemetry data endpoints (GPS, IMU, LiDAR)",
            },
            {
                name: "Alerts",
                description: "Alert management endpoints",
            },
            {
                name: "Shifts",
                description: "Operator shift & session management",
            },
            {
                name: "RAG - AI Assistant",
                description: "AI-powered decision support endpoints",
            },
        ],

        components: {
            // ✅ Security Schemes (hanya Bearer Auth, tidak ada API Key)
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "JWT Bearer Token. Dapatkan token dari POST /api/auth/login",
                },
            },

            schemas: {
                // ============================================
                // AUTH SCHEMAS
                // ============================================
                LoginRequest: {
                    type: "object",
                    required: ["username", "password"],
                    properties: {
                        username: {
                            type: "string",
                            example: "admin",
                            description: "Username untuk login",
                        },
                        password: {
                            type: "string",
                            format: "password",
                            example: "admin123",
                            description: "Password user",
                        },
                    },
                },
                LoginResponse: {
                    type: "object",
                    properties: {
                        success: { type: "boolean", example: true },
                        message: { type: "string", example: "Login successful" },
                        data: {
                            type: "object",
                            properties: {
                                token: {
                                    type: "string",
                                    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                                    description: "JWT Token untuk autentikasi",
                                },
                                user: {
                                    type: "object",
                                    properties: {
                                        id: { type: "integer", example: 1 },
                                        username: { type: "string", example: "admin" },
                                        email: { type: "string", example: "admin@opscenter.com" },
                                        full_name: { type: "string", example: "System Administrator" },
                                        role: { type: "string", enum: ["admin", "supervisor", "operator"] },
                                        operator: {
                                            type: "object",
                                            nullable: true,
                                            description: "Operator profile (null jika bukan operator)",
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                RegisterRequest: {
                    type: "object",
                    required: ["username", "email", "password", "full_name"],
                    properties: {
                        username: {
                            type: "string",
                            example: "newuser",
                            minLength: 3,
                        },
                        email: {
                            type: "string",
                            format: "email",
                            example: "newuser@opscenter.com",
                        },
                        password: {
                            type: "string",
                            format: "password",
                            example: "password123",
                            minLength: 6,
                        },
                        full_name: {
                            type: "string",
                            example: "New User",
                        },
                        role: {
                            type: "string",
                            enum: ["admin", "supervisor", "operator"],
                            default: "operator",
                        },
                    },
                },

                // ============================================
                // ROBOT SCHEMAS
                // ============================================
                Robot: {
                    type: "object",
                    properties: {
                        id: { type: "integer", example: 1 },
                        name: { type: "string", example: "HD-001" },
                        description: { type: "string", example: "Haul Truck #001 - Pilot Unit" },
                        status: {
                            type: "string",
                            enum: ["online", "offline", "charging", "error"],
                            example: "online",
                        },
                        battery_level: { type: "integer", example: 85, minimum: 0, maximum: 100 },
                        last_seen: { type: "string", format: "date-time" },
                        created_at: { type: "string", format: "date-time" },
                        updated_at: { type: "string", format: "date-time" },
                    },
                },

                // ============================================
                // TELEMETRY SCHEMAS
                // ============================================
                Telemetry: {
                    type: "object",
                    properties: {
                        id: { type: "integer", example: 1 },
                        robot_id: { type: "integer", example: 1 },
                        latitude: { type: "number", format: "float", example: -2.123456 },
                        longitude: { type: "number", format: "float", example: 117.123456 },
                        altitude: { type: "number", format: "float", example: 150.5 },
                        speed: { type: "number", format: "float", example: 15.5, description: "cm/s" },
                        heading: { type: "number", format: "float", example: 45.0, description: "degrees (0-360)" },
                        pitch: { type: "number", format: "float", example: 2.5, description: "IMU pitch (degrees)" },
                        roll: { type: "number", format: "float", example: 0.8, description: "IMU roll (degrees)" },
                        yaw: { type: "number", format: "float", example: 12.3, description: "IMU yaw (degrees)" },
                        distance_to_obstacle: { type: "number", format: "float", example: 45.2, description: "cm" },
                        collision_alert: { type: "boolean", example: false },
                        obstacle_direction: {
                            type: "string",
                            enum: ["front", "left", "right", "back"],
                            example: "front",
                        },
                        battery_level: { type: "integer", example: 85 },
                        power_draw: { type: "number", format: "float", example: 120.5 },
                        motor_temp: { type: "number", format: "float", example: 45.0 },
                        signal_strength: { type: "integer", example: -45 },
                        network_latency_ms: { type: "integer", example: 24 },
                        status: {
                            type: "string",
                            enum: ["idle", "moving", "charging", "error"],
                            example: "moving",
                        },
                        timestamp: { type: "string", format: "date-time" },
                    },
                },

                // ============================================
                // ALERT SCHEMAS
                // ============================================
                Alert: {
                    type: "object",
                    properties: {
                        id: { type: "integer", example: 1 },
                        robot_id: { type: "integer", example: 1 },
                        level: {
                            type: "string",
                            enum: ["critical", "warning", "info"],
                            example: "critical",
                        },
                        type: { type: "string", example: "obstacle" },
                        message: { type: "string", example: "Obstacle detected at 8cm - DANGER" },
                        details: { type: "object" },
                        acknowledged: { type: "boolean", example: false },
                        acknowledged_by: { type: "string", example: "supervisor" },
                        acknowledged_at: { type: "string", format: "date-time" },
                        created_at: { type: "string", format: "date-time" },
                    },
                },

                // ============================================
                // SHIFT SCHEMAS
                // ============================================
                StartShiftRequest: {
                    type: "object",
                    required: ["operator_id", "robot_id"],
                    properties: {
                        operator_id: {
                            type: "integer",
                            example: 1,
                            description: "ID operator yang akan memulai shift",
                        },
                        robot_id: {
                            type: "integer",
                            example: 1,
                            description: "ID robot yang akan dikontrol",
                        },
                    },
                },
                OperatorSession: {
                    type: "object",
                    properties: {
                        id: { type: "integer", example: 1 },
                        operator_id: { type: "integer", example: 1 },
                        robot_id: { type: "integer", example: 1 },
                        start_time: { type: "string", format: "date-time" },
                        end_time: { type: "string", format: "date-time", nullable: true },
                        control_token: {
                            type: "string",
                            example: "a1b2c3d4...",
                            description: "Token untuk authorize command ke robot",
                        },
                        socket_id: { type: "string", nullable: true },
                        last_heartbeat: { type: "string", format: "date-time" },
                        total_score: { type: "integer", example: 850 },
                        distance_covered: { type: "number", format: "float", example: 450.5 },
                        harsh_brakes: { type: "integer", example: 0 },
                        collisions: { type: "integer", example: 0 },
                        status: {
                            type: "string",
                            enum: ["active", "completed", "interrupted"],
                            example: "active",
                        },
                        notes: { type: "string", nullable: true },
                    },
                },
                ForceTakeoverRequest: {
                    type: "object",
                    required: ["robot_id", "new_operator_id"],
                    properties: {
                        robot_id: {
                            type: "integer",
                            example: 1,
                            description: "ID robot yang akan di-takeover",
                        },
                        new_operator_id: {
                            type: "integer",
                            example: 2,
                            description: "ID operator baru yang akan mengambil alih",
                        },
                    },
                },

                // ============================================
                // RAG SCHEMAS
                // ============================================
                RAGQuery: {
                    type: "object",
                    required: ["question"],
                    properties: {
                        question: {
                            type: "string",
                            example: "Apa SOP jika kemiringan tebing >30°?",
                            minLength: 3,
                            maxLength: 500,
                        },
                        top_k: {
                            type: "integer",
                            example: 3,
                            minimum: 1,
                            maximum: 10,
                            default: 3,
                        },
                        include_realtime: {
                            type: "boolean",
                            example: true,
                            default: true,
                        },
                    },
                },
                RAGResponse: {
                    type: "object",
                    properties: {
                        answer: {
                            type: "string",
                            description: "AI-generated answer",
                        },
                        sources: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    source: { type: "string" },
                                    similarity: { type: "number" },
                                    content: { type: "string" },
                                },
                            },
                        },
                        context_used: {
                            type: "object",
                            properties: {
                                document_count: { type: "integer" },
                                has_realtime: { type: "boolean" },
                            },
                        },
                    },
                },

                // ============================================
                // GENERIC SCHEMAS
                // ============================================
                SuccessResponse: {
                    type: "object",
                    properties: {
                        success: { type: "boolean", example: true },
                        message: { type: "string", example: "Operation successful" },
                        data: { type: "object" },
                    },
                },
                ErrorResponse: {
                    type: "object",
                    properties: {
                        success: { type: "boolean", example: false },
                        message: { type: "string", example: "Error message" },
                        details: { type: "object", nullable: true },
                    },
                },
                UnauthorizedError: {
                    type: "object",
                    properties: {
                        success: { type: "boolean", example: false },
                        message: { type: "string", example: "Access token required" },
                    },
                },
                ForbiddenError: {
                    type: "object",
                    properties: {
                        success: { type: "boolean", example: false },
                        message: { type: "string", example: "Insufficient permissions" },
                    },
                },
                ConflictError: {
                    type: "object",
                    properties: {
                        success: { type: "boolean", example: false },
                        message: {
                            type: "string",
                            example: "Robot HD-001 sedang dikontrol oleh Budi Santoso (EMP001)",
                        },
                        details: {
                            type: "object",
                            properties: {
                                existing_session: {
                                    type: "object",
                                    properties: {
                                        id: { type: "integer" },
                                        operator_id: { type: "integer" },
                                        operator_name: { type: "string" },
                                        employee_id: { type: "string" },
                                    },
                                },
                            },
                        },
                    },
                },
            },

            // ✅ Reusable responses
            responses: {
                Unauthorized: {
                    description: "Authentication required",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/UnauthorizedError" },
                        },
                    },
                },
                Forbidden: {
                    description: "Insufficient permissions",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ForbiddenError" },
                        },
                    },
                },
                NotFound: {
                    description: "Resource not found",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ErrorResponse" },
                        },
                    },
                },
                Conflict: {
                    description: "Resource conflict (e.g., robot already in use)",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ConflictError" },
                        },
                    },
                },
                ValidationError: {
                    description: "Validation failed",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ErrorResponse" },
                        },
                    },
                },
                ServerError: {
                    description: "Internal server error",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ErrorResponse" },
                        },
                    },
                },
            },
        },
    },
    apis: ["./src/routes/*.js", "./src/app.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app) => {
    app.use(
        "/api-docs",
        swaggerUi.serve,
        swaggerUi.setup(swaggerSpec, {
            customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info { margin: 20px 0 }
        .swagger-ui .authorization__btn { fill: #4CAF50 }
      `,
            customSiteTitle: "OpsCenter API Documentation",
            customfavIcon: "https://swagger.io/swagger-ui/favicon-32x32.png",
            swaggerOptions: {
                persistAuthorization: true,
                docExpansion: "list",
                filter: true,
                showRequestDuration: true,
                displayRequestDuration: true,
                tryItOutEnabled: true,
            },
        }),
    );

    app.get("/api-docs.json", (req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.send(swaggerSpec);
    });

    console.log("📚 Swagger docs available at: http://localhost:3000/api-docs");
    console.log('🔐 Click "Authorize" button to add JWT token');
};

export default swaggerSpec;
