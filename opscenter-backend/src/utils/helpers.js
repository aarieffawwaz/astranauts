/**
 * Calculate distance between two points
 */
export const calculateDistance = (x1, y1, x2, y2) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

/**
 * Format timestamp to readable string
 */
export const formatTimestamp = (date = new Date()) => {
    return new Date(date).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour12: false,
    });
};

/**
 * Safe JSON parse
 */
export const safeJsonParse = (str, defaultValue = {}) => {
    try {
        return JSON.parse(str);
    } catch {
        return defaultValue;
    }
};

/**
 * Delay helper
 */
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generate random ID
 */
export const generateId = (prefix = "") => {
    return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Clamp value between min and max
 */
export const clamp = (value, min, max) => {
    return Math.min(Math.max(value, min), max);
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (value, total) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
};

/**
 * Check if value is within range
 */
export const isInRange = (value, min, max) => {
    return value >= min && value <= max;
};

/**
 * Get current timestamp in milliseconds
 */
export const now = () => Date.now();

/**
 * Round to specific decimal places
 */
export const round = (value, decimals = 2) => {
    return Number(Math.round(value + "e" + decimals) + "e-" + decimals);
};

/**
 * Create pagination object
 */
export const createPagination = (page = 1, limit = 10, total = 0) => {
    const totalPages = Math.ceil(total / limit);
    return {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };
};

/**
 * Sanitize string input
 */
export const sanitizeString = (str) => {
    if (typeof str !== "string") return "";
    return str.trim().replace(/[<>]/g, "");
};

/**
 * Convert snake_case to camelCase
 */
export const toCamelCase = (str) => {
    return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
};

/**
 * Convert object keys from snake_case to camelCase
 */
export const camelizeObject = (obj) => {
    if (Array.isArray(obj)) {
        return obj.map(camelizeObject);
    }
    if (obj !== null && typeof obj === "object") {
        return Object.keys(obj).reduce((acc, key) => {
            acc[toCamelCase(key)] = camelizeObject(obj[key]);
            return acc;
        }, {});
    }
    return obj;
};
