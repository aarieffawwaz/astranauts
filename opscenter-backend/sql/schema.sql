-- ============================================
-- OPSCENTER DATABASE SCHEMA
-- Unified schema - All-in-one
-- Version: 1.0.0
-- ============================================

-- ============================================
-- 1. EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. ROBOTS TABLE (Base entity)
-- ============================================
CREATE TABLE IF NOT EXISTS robots (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'offline',
    battery_level INTEGER DEFAULT 100,
    last_seen TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT valid_robot_status CHECK (status IN ('online', 'offline', 'charging', 'error'))
);

CREATE INDEX IF NOT EXISTS idx_robots_status ON robots(status);
CREATE INDEX IF NOT EXISTS idx_robots_last_seen ON robots(last_seen);

-- ============================================
-- 3. USERS TABLE (Authentication)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'operator',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT valid_user_role CHECK (role IN ('admin', 'supervisor', 'operator'))
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- 4. OPERATORS TABLE (Driver profiles)
-- ============================================
CREATE TABLE IF NOT EXISTS operators (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    specialization VARCHAR(50), -- 'haul_truck', 'excavator', 'dozer', dll
    skill_level VARCHAR(20) DEFAULT 'beginner',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT valid_skill_level CHECK (skill_level IN ('beginner', 'intermediate', 'expert', 'master'))
);

CREATE INDEX IF NOT EXISTS idx_operators_employee_id ON operators(employee_id);
CREATE INDEX IF NOT EXISTS idx_operators_user_id ON operators(user_id);

-- ============================================
-- 5. TELEMETRY TABLE (Sensor data)
-- ============================================
CREATE TABLE IF NOT EXISTS telemetry (
    id SERIAL PRIMARY KEY,
    robot_id INTEGER REFERENCES robots(id) ON DELETE CASCADE,
    
    -- GPS Data
    latitude FLOAT,
    longitude FLOAT,
    altitude FLOAT,
    gps_accuracy FLOAT,
    
    -- Position (local coordinates)
    x_position FLOAT,
    y_position FLOAT,
    
    -- Movement
    speed FLOAT DEFAULT 0,
    heading FLOAT, -- Direction in degrees (0-360)
    
    -- IMU Data (MPU6050)
    pitch FLOAT DEFAULT 0, -- Tilt forward/backward
    roll FLOAT DEFAULT 0,  -- Tilt left/right
    yaw FLOAT DEFAULT 0,   -- Rotation
    
    -- Obstacle Detection (LiDAR/Ultrasonic)
    distance_to_obstacle FLOAT,
    collision_alert BOOLEAN DEFAULT FALSE,
    obstacle_direction VARCHAR(20), -- 'front', 'left', 'right', 'back'
    
    -- System Status
    battery_level INTEGER,
    power_draw FLOAT,
    motor_temp FLOAT,
    signal_strength INTEGER,
    network_latency_ms INTEGER,
    
    -- Operational Status
    status VARCHAR(20) DEFAULT 'idle',
    
    timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_robot ON telemetry(robot_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON telemetry(timestamp);
CREATE INDEX IF NOT EXISTS idx_telemetry_robot_timestamp ON telemetry(robot_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_gps ON telemetry(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_telemetry_collision ON telemetry(collision_alert) WHERE collision_alert = TRUE;

-- ============================================
-- 6. ALERTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    robot_id INTEGER REFERENCES robots(id) ON DELETE CASCADE,
    level VARCHAR(20) NOT NULL,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by VARCHAR(100),
    acknowledged_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_robot ON alerts(robot_id);
CREATE INDEX IF NOT EXISTS idx_alerts_level ON alerts(level);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);

-- ============================================
-- 7. OPERATOR SESSIONS TABLE (Shift tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS operator_sessions (
    id SERIAL PRIMARY KEY,
    operator_id INTEGER REFERENCES operators(id) ON DELETE CASCADE,
    robot_id INTEGER REFERENCES robots(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL DEFAULT NOW(),
    end_time TIMESTAMP,
    
    -- Control & Security
    control_token VARCHAR(255),
    socket_id VARCHAR(100),
    last_heartbeat TIMESTAMP DEFAULT NOW(),
    
    -- Force takeover tracking
    force_takeover BOOLEAN DEFAULT FALSE,
    taken_over_by INTEGER REFERENCES operators(id),
    
    -- Performance stats
    total_score INTEGER DEFAULT 0,
    distance_covered FLOAT DEFAULT 0,
    harsh_brakes INTEGER DEFAULT 0,
    collisions INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    
    CONSTRAINT valid_session_status CHECK (status IN ('active', 'completed', 'interrupted'))
);

-- ✅ CRITICAL: Unique constraints untuk concurrency
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_session_per_robot 
    ON operator_sessions(robot_id) 
    WHERE status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_session_per_operator 
    ON operator_sessions(operator_id) 
    WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_sessions_operator ON operator_sessions(operator_id);
CREATE INDEX IF NOT EXISTS idx_sessions_robot ON operator_sessions(robot_id);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON operator_sessions(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON operator_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_heartbeat ON operator_sessions(last_heartbeat) WHERE status = 'active';

-- ============================================
-- 8. SHIFT TYPES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS shift_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- ============================================
-- 9. OPERATOR SCORES TABLE (Gamification history)
-- ============================================
CREATE TABLE IF NOT EXISTS operator_scores (
    id SERIAL PRIMARY KEY,
    robot_id INTEGER REFERENCES robots(id) ON DELETE CASCADE,
    operator_name VARCHAR(100),
    speed_score INTEGER DEFAULT 0,
    safety_score INTEGER DEFAULT 0,
    energy_score INTEGER DEFAULT 0,
    route_score INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    session_duration INTEGER DEFAULT 0,
    distance_covered FLOAT DEFAULT 0,
    harsh_brakes INTEGER DEFAULT 0,
    collisions INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scores_robot ON operator_scores(robot_id);
CREATE INDEX IF NOT EXISTS idx_scores_total ON operator_scores(total_score DESC);

-- ============================================
-- 10. KNOWLEDGE BASE TABLE (RAG)
-- ============================================
CREATE TABLE IF NOT EXISTS knowledge_base (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    source VARCHAR(255),
    chunk_index INTEGER,
    embedding vector(768),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_source ON knowledge_base(source);
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding ON knowledge_base 
    USING ivfflat (embedding vector_cosine_ops) 
    WITH (lists = 100);

-- ============================================
-- 11. COMMANDS LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS commands_log (
    id SERIAL PRIMARY KEY,
    robot_id INTEGER REFERENCES robots(id) ON DELETE CASCADE,
    command VARCHAR(50) NOT NULL,
    parameters JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'sent',
    response_time_ms INTEGER,
    issued_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commands_robot ON commands_log(robot_id);
CREATE INDEX IF NOT EXISTS idx_commands_created ON commands_log(created_at);

-- ============================================
-- 12. SESSION AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS session_audit_logs (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES operator_sessions(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'start', 'end', 'force_takeover', 'stale_cleanup'
    actor_user_id INTEGER REFERENCES users(id),
    target_operator_id INTEGER REFERENCES operators(id),
    target_robot_id INTEGER REFERENCES robots(id),
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_session ON session_audit_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON session_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON session_audit_logs(created_at DESC);

-- ============================================
-- 13. TRIGGERS - Auto update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers first (idempotent)
DROP TRIGGER IF EXISTS update_robots_updated_at ON robots;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_operators_updated_at ON operators;
DROP TRIGGER IF EXISTS update_scores_updated_at ON operator_scores;

CREATE TRIGGER update_robots_updated_at BEFORE UPDATE ON robots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operators_updated_at BEFORE UPDATE ON operators
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scores_updated_at BEFORE UPDATE ON operator_scores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 14. DEFAULT DATA - Shift Types
-- ============================================
INSERT INTO shift_types (name, start_time, end_time, description) VALUES
    ('Morning', '06:00:00', '14:00:00', 'Morning shift (06:00 - 14:00)'),
    ('Afternoon', '14:00:00', '22:00:00', 'Afternoon shift (14:00 - 22:00)'),
    ('Night', '22:00:00', '06:00:00', 'Night shift (22:00 - 06:00)')
ON CONFLICT (name) DO NOTHING;