# 🏭 OpsCenter Backend

**Smart Mining Fleet Management System** dengan **Physical Digital Twin** untuk PT Pamapersada Nusantara (PAMA).

Backend server untuk sistem monitoring dan kontrol armada tambang secara real-time, dilengkapi dengan AI-powered decision support (RAG), gamification operator, dan remote control capabilities.

---

## 📋 Table of Contents

- [✨ Fitur Utama](#-fitur-utama)
- [🏗️ Arsitektur](#-arsitektur)
- [🛠️ Tech Stack](#-tech-stack)
- [📋 Prerequisites](#-prerequisites)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Configuration](#-configuration)
- [🗄️ Database Setup](#-database-setup)
- [🏃 Running the App](#-running-the-app)
- [📚 API Documentation](#-api-documentation)
- [🔌 WebSocket Guide](#-websocket-guide)
- [🔐 Authentication](#-authentication)
- [🧪 Testing](#-testing)
- [📁 Project Structure](#-project-structure)
- [🐛 Troubleshooting](#-troubleshooting)
- [👥 Team](#-team)

---

## ✨ Fitur Utama

### 🤖 Fleet Management
- ✅ Real-time monitoring armada (GPS, IMU, LiDAR)
- ✅ Telemetry streaming via WebSocket (200ms interval)
- ✅ Remote control dengan low latency (<100ms)
- ✅ Collision avoidance & safety alerts
- ✅ Battery & motor health monitoring

### 👥 Multi-User & Shift Management
- ✅ JWT-based authentication
- ✅ Role-based access (Admin, Supervisor, Operator)
- ✅ Shift management dengan database locking
- ✅ Auto-end session on disconnect
- ✅ Force takeover oleh supervisor
- ✅ Audit trail untuk semua perubahan session

### 🎮 Gamification
- ✅ Real-time operator scoring
- ✅ Leaderboard dengan ranking
- ✅ Performance tracking (speed, safety, energy, route)
- ✅ Coaching recommendations
- ✅ Session-based score history

### 🤖 AI-Powered Decision Support (RAG)
- ✅ Local LLM (Llama 3 via Ollama)
- ✅ Vector search dengan pgvector
- ✅ Context-aware answers (dokumen + real-time data)
- ✅ Natural language queries
- ✅ SOP & mine plan integration

### 🔒 Security & Concurrency
- ✅ Database-level locking (prevent race conditions)
- ✅ Control token validation per command
- ✅ Heartbeat system (auto-cleanup stale sessions)
- ✅ Unique constraints (1 active session per robot/operator)
- ✅ Audit logging

---

## 🏗️ Arsitektur

```markdown
┌─────────────────────────────────────────────────────────────┐
│                    PHYSICAL LAYER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  ESP32 Robot │  │  ESP32 Robot │  │  ESP32 Robot │     │
│  │  (HD-001)    │  │  (HD-002)    │  │  (HD-003)    │     │
│  │  GPS+IMU+LiDAR│ │  GPS+IMU+LiDAR│ │  GPS+IMU+LiDAR│    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │ WebSocket        │ WebSocket        │ WebSocket
          └──────────────────┼──────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    BACKEND (Node.js + Express)               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  WebSocket Server (Socket.IO)                        │  │
│  │  REST API (Express)                                  │  │
│  │  RAG Pipeline (Ollama + pgvector)                    │  │
│  │  Gamification Engine                                 │  │
│  │  Shift Management (with DB locking)                  │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    DATABASE (PostgreSQL 15+)                 │
│  • robots, users, operators, operator_sessions             │
│  • telemetry, alerts, commands_log                          │
│  • knowledge_base (vector embeddings)                       │
│  • session_audit_logs                                       │
└─────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    FRONTEND (Dashboard)                      │
│  • Supervisor Dashboard (God-mode view)                    │
│  • Operator Cockpit (Camera feed + controls)               │
│  • Operator Navigator (Tactical map + telemetry)           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js 18+ (ES Modules)
- **Framework:** Express.js
- **WebSocket:** Socket.IO
- **Database:** PostgreSQL 15+ with pgvector extension
- **ORM:** Native pg driver (no ORM overhead)
- **Validation:** express-validator
- **Authentication:** JWT (jsonwebtoken) + bcryptjs
- **Logging:** Winston

### AI / RAG
- **LLM:** Ollama (Llama 3)
- **Embeddings:** Ollama (nomic-embed-text)
- **Vector Search:** pgvector (PostgreSQL extension)
- **Text Splitting:** @langchain/textsplitters

### Documentation
- **API Docs:** Swagger/OpenAPI 3.0
- **UI:** swagger-ui-express

---

## 📋 Prerequisites

Sebelum memulai, pastikan Anda sudah menginstall:

### 1. Node.js (v18+)
```bash
node --version  # Harus v18+
npm --version
```

### 2. PostgreSQL 15+ dengan pgvector
```bash
# macOS
brew install postgresql@15
brew services start postgresql@15

# Install pgvector
brew install pgvector

# Linux (Ubuntu)
sudo apt install postgresql-15 postgresql-15-pgvector
```

### 3. Ollama (Local LLM Server)
```bash
# Download dari https://ollama.ai
# Install, lalu pull models:
ollama pull llama3
ollama pull nomic-embed-text

# Verify
ollama list
```

### 4. ESP32 (Optional - untuk robot physical)
- Arduino IDE dengan ESP32 board support
- Library: WiFi, WebSocketsClient, ArduinoJson, MPU6050

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies
```bash
git clone <your-repo-url>
cd opscenter-backend
npm install
```

### 2. Setup Database
```bash
# Create database
createdb opscenter

# Enable pgvector extension
psql -U postgres -d opscenter -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Initialize schema & seed data
npm run init-db
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env dengan konfigurasi Anda (lihat section Configuration)
```

### 4. Ingest Documents (RAG Knowledge Base)
```bash
npm run ingest-docs
```

### 5. Start Server
```bash
# Development (dengan auto-reload)
npm run dev

# Production
npm start
```

### 6. Access
- **API:** http://localhost:3000/api
- **Swagger Docs:** http://localhost:3000/api-docs
- **Health Check:** http://localhost:3000/health
- **WebSocket:** ws://localhost:3000

---

## ⚙️ Configuration

File `.env`:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=opscenter
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DATABASE_URL=postgresql://postgres:your_postgres_password@localhost:5432/opscenter

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_LLM_MODEL=llama3
OLLAMA_EMBEDDING_MODEL=nomic-embed-text

# RAG Configuration
RAG_CHUNK_SIZE=500
RAG_CHUNK_OVERLAP=50
RAG_TOP_K=3

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=24h

# Logging
LOG_LEVEL=info
```

---

## 🗄️ Database Setup

### Reset Database (Clean Install)
```bash
# One-liner command
dropdb opscenter 2>/dev/null; createdb opscenter && \
psql -U postgres -d opscenter -c "CREATE EXTENSION IF NOT EXISTS vector;" && \
npm run init-db && \
npm run ingest-docs
```

### Schema Overview
Database memiliki 12 tabel utama:

| Table | Purpose |
|-------|---------|
| `robots` | Master data alat berat |
| `users` | User authentication |
| `operators` | Operator profiles |
| `telemetry` | Sensor data (GPS, IMU, LiDAR) |
| `alerts` | Safety & operational alerts |
| `operator_sessions` | Shift tracking dengan locking |
| `operator_scores` | Gamification history |
| `shift_types` | Konfigurasi shift |
| `knowledge_base` | RAG documents + embeddings |
| `commands_log` | Audit log commands |
| `session_audit_logs` | Audit trail sessions |

### Default Data
Setelah `npm run init-db`, database akan memiliki:
- 1 Robot (HD-001)
- 5 Users (1 admin, 1 supervisor, 3 operators)
- 3 Operators (linked ke users)
- 3 Shift Types (Morning, Afternoon, Night)

---

## 🏃 Running the App

### Development Mode
```bash
npm run dev
```
Server akan auto-reload saat ada perubahan file.

### Production Mode
```bash
npm start
```

### Expected Output
```
[nodemon] starting `node src/app.js`
Testing database connection...
✅ Database connected successfully
Testing Ollama connection...
✅ Ollama LLM connected successfully
Initializing WebSocket...
✅ WebSocket initialized
📚 Swagger docs available at: http://localhost:3000/api-docs
🔐 Click "Authorize" button to add JWT token

╔═══════════════════════════════════════════════════════╗
║  🚀 OpsCenter Backend Server                          ║
║  ═══════════════════════════════════════════════════  ║
║  Port:       3000                                     ║
║  Environment: development                             ║
║  API:        http://localhost:3000/api                ║
║  Health:     http://localhost:3000/health             ║
║  WebSocket:  ws://localhost:3000                      ║
║  Swagger:    http://localhost:3000/api-docs           ║
╚═══════════════════════════════════════════════════════╝
```

---

## 📚 API Documentation

### Swagger UI
Akses dokumentasi API interaktif di:
```
http://localhost:3000/api-docs
```

### Public Endpoints (Tidak Perlu Login)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/auth/login` | Login untuk dapat token |
| POST | `/api/auth/register` | Register user baru |

### Protected Endpoints (Perlu JWT Token)

#### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/change-password` | Change password |

#### Robots
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/robots` | Get all robots |
| GET | `/api/robots/:id` | Get robot by ID |
| POST | `/api/robots` | Create robot |
| PATCH | `/api/robots/:id/status` | Update status |
| DELETE | `/api/robots/:id` | Delete robot |
| GET | `/api/robots/statistics` | Get statistics |

#### Telemetry
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/telemetry/latest` | Get all latest telemetry |
| GET | `/api/telemetry/:robotId/latest` | Get latest for robot |
| GET | `/api/telemetry/:robotId/history` | Get history |
| GET | `/api/telemetry/:robotId/statistics` | Get statistics |
| POST | `/api/telemetry` | Create telemetry |

#### Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts/active` | Get active alerts |
| GET | `/api/alerts/history` | Get alert history |
| GET | `/api/alerts/statistics` | Get statistics |
| POST | `/api/alerts/:id/acknowledge` | Acknowledge alert |
| POST | `/api/alerts/acknowledge-all/:robotId` | Acknowledge all |

#### Shifts
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/shifts/start` | Start shift |
| POST | `/api/shifts/end` | End shift |
| POST | `/api/shifts/force-takeover` | Force takeover (admin/supervisor) |
| POST | `/api/shifts/heartbeat` | Send heartbeat |
| GET | `/api/shifts/current/:robotId` | Get current operator |
| GET | `/api/shifts/robot/:robotId/history` | Get robot history |
| GET | `/api/shifts/operator/:operatorId/history` | Get operator history |
| GET | `/api/shifts/today` | Get today's sessions |
| GET | `/api/shifts/leaderboard` | Get leaderboard |

#### RAG (AI Assistant)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rag/query` | Query with RAG |
| POST | `/api/rag/ingest` | Ingest document |
| POST | `/api/rag/ingest-directory` | Ingest directory |
| GET | `/api/rag/documents` | Get all documents |
| GET | `/api/rag/statistics` | Get KB statistics |
| DELETE | `/api/rag/documents/:id` | Delete document |
| DELETE | `/api/rag/clear` | Clear knowledge base |

---

## 🔌 WebSocket Guide

### Connection Flow
```
1. Connect to ws://localhost:3000
2. Authenticate: {"event": "auth:login", "data": {"token": "JWT"}}
3. Register robot: {"event": "robot:register", "data": {"name": "HD-001"}}
4. Start shift: {"event": "shift:start", "data": {"operator_id": 1, "robot_id": 1}}
5. Receive control_token: {"event": "session:control_token", "data": {...}}
6. Send telemetry every 200ms: {"event": "robot:telemetry", "data": {...}}
7. Send heartbeat every 30s: {"event": "shift:heartbeat", "data": {"session_id": 1}}
8. Listen for commands: {"event": "robot:command", "data": {"command": "forward", ...}}
```

### Events dari Robot → Backend
| Event | Frequency | Purpose |
|-------|-----------|---------|
| `auth:login` | 1x | Authenticate |
| `robot:register` | 1x | Register robot |
| `shift:start` | 1x | Start session |
| `robot:telemetry` | Every 200ms | Send sensor data |
| `shift:heartbeat` | Every 30s | Keep session alive |
| `shift:end` | 1x | End session |

### Events dari Backend → Robot
| Event | Trigger | Purpose |
|-------|---------|---------|
| `auth:success` | After login | Confirm auth |
| `robot:registered` | After register | Confirm registration |
| `session:control_token` | After start shift | Give control token |
| `robot:command` | From dashboard | Control robot |
| `shift:force_taken_over` | Supervisor takeover | Notify robot |
| `shift:stale_ended` | No heartbeat | Session expired |

### Example: Send Telemetry
```json
{
  "event": "robot:telemetry",
  "data": {
    "robot_id": 1,
    "latitude": -2.123456,
    "longitude": 117.123456,
    "speed": 15.5,
    "pitch": 2.5,
    "roll": 0.8,
    "yaw": 12.3,
    "distance_to_obstacle": 45.2,
    "collision_alert": false,
    "battery_level": 85,
    "network_latency_ms": 24,
    "status": "moving"
  }
}
```

### Example: Receive Command
```json
{
  "event": "robot:command",
  "data": {
    "robot_id": 1,
    "command": "forward",
    "control_token": "a1b2c3d4e5f6...",
    "parameters": {}
  }
}
```

### ESP32 Code Example
Lihat file `esp32_robot.ino` di repository untuk implementasi lengkap robot ESP32.

---

## 🔐 Authentication

### JWT Bearer Token
Semua protected endpoint memerlukan JWT token di header:
```
Authorization: Bearer <your_token>
```

### Login Flow
```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {...}
  }
}

# 2. Gunakan token untuk protected endpoints
curl -X GET http://localhost:3000/api/robots \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Swagger Authorization
1. Login via `POST /api/auth/login` di Swagger
2. Copy token dari response
3. Klik tombol **Authorize** 🔒 di kanan atas
4. Paste token (dengan atau tanpa prefix `Bearer`)
5. Klik **Authorize** → **Close**
6. Semua protected endpoint sekarang bisa diakses

---

## 🧪 Testing

### Test Health Check
```bash
curl http://localhost:3000/health
```

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### Test Shift Flow
```bash
# Login sebagai operator1
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "operator1", "password": "operator123"}' | jq -r '.data.token')

# Start shift
curl -X POST http://localhost:3000/api/shifts/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"operator_id": 1, "robot_id": 1}'

# Get current operator
curl http://localhost:3000/api/shifts/current/1 \
  -H "Authorization: Bearer $TOKEN"

# End shift
curl -X POST http://localhost:3000/api/shifts/end \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"session_id": 1, "notes": "Test complete"}'
```

### Test RAG Query
```bash
curl -X POST http://localhost:3000/api/rag/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Apa SOP jika kemiringan tebing >30°?",
    "top_k": 3,
    "include_realtime": true
  }'
```

### Test WebSocket
Gunakan file `test-websocket.js` atau WebSocket testing tool seperti Postman/WebSocket King.

---

## 📁 Project Structure

```
opscenter-backend/
├── src/
│   ├── app.js                    # Entry point
│   ├── config/
│   │   ├── database.js           # PostgreSQL config
│   │   ├── ollama.js             # Ollama LLM config
│   │   ├── websocket.js          # Socket.IO config
│   │   └── swagger.js            # Swagger config
│   ├── controllers/              # HTTP request handlers
│   │   ├── authController.js
│   │   ├── robotController.js
│   │   ├── telemetryController.js
│   │   ├── alertController.js
│   │   ├── shiftController.js
│   │   └── ragController.js
│   ├── models/                   # Database models
│   │   ├── User.js
│   │   ├── Robot.js
│   │   ├── Operator.js
│   │   ├── OperatorSession.js
│   │   ├── Telemetry.js
│   │   ├── Alert.js
│   │   └── KnowledgeBase.js
│   ├── routes/                   # API routes
│   │   ├── authRoutes.js
│   │   ├── robotRoutes.js
│   │   ├── telemetryRoutes.js
│   │   ├── alertRoutes.js
│   │   ├── shiftRoutes.js
│   │   └── ragRoutes.js
│   ├── services/                 # Business logic
│   │   ├── authService.js
│   │   ├── robotService.js
│   │   ├── telemetryService.js
│   │   ├── alertService.js
│   │   ├── shiftService.js
│   │   ├── ragService.js
│   │   ├── gamificationService.js
│   │   └── websocketService.js
│   ├── middleware/               # Express middleware
│   │   ├── auth.js               # JWT authentication
│   │   ├── errorHandler.js
│   │   ├── logger.js
│   │   └── validator.js
│   ├── utils/                    # Utilities
│   │   ├── constants.js
│   │   └── helpers.js
│   └── websocket/                # WebSocket handlers
│       ├── index.js
│       └── handler.js
├── scripts/
│   ├── init-db.js                # Initialize database
│   └── ingest-docs.js            # Ingest RAG documents
├── docs/                         # Knowledge base documents
│   ├── sop-safety.md
│   ├── mine-plan.md
│   └── equipment-manual.md
├── sql/
│   └── schema.sql                # Unified database schema
├── logs/                         # Log files (auto-created)
├── .env                          # Environment variables
├── .env.example                  # Environment template
├── .gitignore
├── package.json
└── README.md
```

---

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
brew services list  # macOS
# atau
systemctl status postgresql  # Linux

# Check database exists
psql -U postgres -l | grep opscenter

# Recreate database
dropdb opscenter && createdb opscenter
```

### Ollama Connection Error
```bash
# Check Ollama is running
ollama list

# Pull models if not exists
ollama pull llama3
ollama pull nomic-embed-text

# Test Ollama
curl http://localhost:11434/api/generate -d '{"model":"llama3","prompt":"Hello"}'
```

### Port Already in Use
```bash
# Change PORT in .env file
PORT=3001
```

### pgvector Extension Not Found
```bash
# Install pgvector
# macOS
brew install pgvector

# Linux
sudo apt install postgresql-15-pgvector

# Enable extension
psql -U postgres -d opscenter -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### WebSocket Connection Failed
- Pastikan server berjalan di port 3000
- Check firewall tidak block WebSocket
- Test dengan: `curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Host: localhost:3000" http://localhost:3000/`

### JWT Token Expired
- Default expiry: 24 jam
- Login ulang untuk dapat token baru
- Atau ubah `JWT_EXPIRES_IN` di `.env`

### Swagger Lock Icon Tidak Berfungsi
- Pastikan sudah login via `POST /api/auth/login`
- Copy token dari response
- Klik Authorize 🔒 → paste token → Authorize → Close
- Hard refresh browser: `Ctrl+Shift+R` (Windows/Linux) atau `Cmd+Shift+R` (Mac)

---

## 👥 Team

- **Aarief Lutfi** - Backend Developer
- **Ridhwan** - Hardware Engineer
- **Hansel** - Hardware Engineer
- **Aarief Anggi** - UI/UX & Documentation

---

## 📄 License

MIT License

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 Support

Untuk pertanyaan dan support:
- **Documentation:** http://localhost:3000/api-docs
- **Email:** team@opscenter.com

---

**Made with ❤️ for PT Pamapersada Nusantara**

*"From Physical Digital Twin to Production-Ready Smart Mining"*
```

---

## 📝 Cara Menggunakan README Ini

1. **Copy seluruh teks di atas** (antara ```markdown dan ```)
2. **Save sebagai `README.md`** di root folder project Anda
3. **Commit ke Git:**
   ```bash
   git add README.md
   git commit -m "docs: update README with latest features"
   git push
   ```

---

## ✅ Fitur yang Tercakup di README

| Section | Status |
|---------|--------|
| ✅ Overview & Features | Complete |
| ✅ Architecture diagram | Complete |
| ✅ Tech stack | Complete |
| ✅ Prerequisites | Complete |
| ✅ Quick start guide | Complete |
| ✅ Configuration (.env) | Complete |
| ✅ Database setup | Complete |
| ✅ Running instructions | Complete |
| ✅ API documentation | Complete (all endpoints) |
| ✅ WebSocket guide | Complete (with examples) |
| ✅ Authentication flow | Complete |
| ✅ Testing guide | Complete |
| ✅ Project structure | Complete |
| ✅ Troubleshooting | Complete |
| ✅ Team info | Complete |