export const ROBOT_STATUS = {
    ONLINE: "online",
    OFFLINE: "offline",
    CHARGING: "charging",
    ERROR: "error",
};

export const ALERT_LEVELS = {
    CRITICAL: "critical",
    WARNING: "warning",
    INFO: "info",
};

export const ALERT_TYPES = {
    OBSTACLE: "obstacle",
    LOW_BATTERY: "low_battery",
    HIGH_TILT: "high_tilt",
    SPEED_EXCEEDED: "speed_exceeded",
    SIGNAL_LOST: "signal_lost",
    MOTOR_OVERHEAT: "motor_overheat",
    COLLISION: "collision",
};

export const ROBOT_COMMANDS = {
    FORWARD: "forward",
    BACKWARD: "backward",
    LEFT: "left",
    RIGHT: "right",
    STOP: "stop",
    AUTO_MODE: "auto_mode",
    MANUAL_MODE: "manual_mode",
};

export const THRESHOLDS = {
    OBSTACLE_DANGER: 10, // cm
    OBSTACLE_WARNING: 20, // cm
    LOW_BATTERY: 20, // %
    CRITICAL_BATTERY: 10, // %
    MAX_SPEED: 25, // cm/s
    MAX_TILT: 30, // degrees
    MOTOR_OVERHEAT: 70, // Celsius
    SIGNAL_WEAK: -70, // dBm
};

export const SCORING = {
    SPEED_WEIGHT: 0.25,
    SAFETY_WEIGHT: 0.25,
    ENERGY_WEIGHT: 0.25,
    ROUTE_WEIGHT: 0.25,
    OPTIMAL_SPEED_MIN: 15, // cm/s
    OPTIMAL_SPEED_MAX: 20, // cm/s
    MAX_SCORE: 100,
};

export const RANKS = {
    MASTER: { min: 900, max: 1000, badge: "🏆", color: "purple" },
    EXPERT: { min: 800, max: 899, badge: "🥇", color: "blue" },
    COMPETENT: { min: 700, max: 799, badge: "🥈", color: "green" },
    BEGINNER: { min: 600, max: 699, badge: "🥉", color: "yellow" },
    NEEDS_COACHING: { min: 0, max: 599, badge: "⚠️", color: "red" },
};

export const getRank = (score) => {
    if (score >= RANKS.MASTER.min) return { ...RANKS.MASTER, name: "Master" };
    if (score >= RANKS.EXPERT.min) return { ...RANKS.EXPERT, name: "Expert" };
    if (score >= RANKS.COMPETENT.min) return { ...RANKS.COMPETENT, name: "Competent" };
    if (score >= RANKS.BEGINNER.min) return { ...RANKS.BEGINNER, name: "Beginner" };
    return { ...RANKS.NEEDS_COACHING, name: "Needs Coaching" };
};
