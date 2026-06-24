import { broadcastToAll } from "../config/websocket.js";
import logger from "../middleware/logger.js";
import { ApiError } from "../middleware/errorHandler.js";

/**
 * Robot Lock Service
 * Mencegah multiple operator mengontrol robot yang sama
 */
class RobotLockService {
    // In-memory lock registry
    // Format: Map<robotId, { userId, operatorId, socketId, lockedAt }>
    static locks = new Map();

    /**
     * Acquire lock for a robot
     * @returns {boolean} true if lock acquired, false if already locked by others
     */
    static acquireLock(robotId, userId, operatorId, socketId) {
        const existingLock = this.locks.get(robotId);

        // Check if already locked by same user (reconnection case)
        if (existingLock && existingLock.userId === userId) {
            // Update socket ID (user reconnected)
            existingLock.socketId = socketId;
            logger.info(`Lock refreshed for robot ${robotId} by user ${userId}`);
            return true;
        }

        // Check if locked by different user
        if (existingLock) {
            logger.warn(`Lock denied for robot ${robotId}: already locked by user ${existingLock.userId}`);
            return false;
        }

        // Acquire lock
        this.locks.set(robotId, {
            userId,
            operatorId,
            socketId,
            lockedAt: new Date(),
        });

        logger.info(`🔒 Robot ${robotId} locked by user ${userId} (operator ${operatorId})`);

        // Broadcast lock acquisition
        broadcastToAll("robot:locked", {
            robotId,
            userId,
            operatorId,
            lockedAt: new Date(),
        });

        return true;
    }

    /**
     * Release lock for a robot
     */
    static releaseLock(robotId, userId) {
        const lock = this.locks.get(robotId);

        if (!lock) {
            logger.debug(`No lock to release for robot ${robotId}`);
            return true;
        }

        // Verify ownership
        if (lock.userId !== userId) {
            logger.warn(`Lock release denied for robot ${robotId}: owned by user ${lock.userId}, requested by ${userId}`);
            throw new ApiError(403, "Cannot release lock owned by another user");
        }

        this.locks.delete(robotId);
        logger.info(`🔓 Robot ${robotId} unlocked by user ${userId}`);

        // Broadcast lock release
        broadcastToAll("robot:unlocked", {
            robotId,
            userId,
            unlockedAt: new Date(),
        });

        return true;
    }

    /**
     * Force release lock (admin only)
     */
    static forceReleaseLock(robotId, reason = "admin_override") {
        const lock = this.locks.get(robotId);
        if (!lock) return null;

        this.locks.delete(robotId);
        logger.warn(`⚠️ Force released lock for robot ${robotId}: ${reason}`);

        broadcastToAll("robot:lock_force_released", {
            robotId,
            previousOwner: lock.userId,
            reason,
            releasedAt: new Date(),
        });

        return lock;
    }

    /**
     * Check if robot is locked
     */
    static isLocked(robotId) {
        return this.locks.has(robotId);
    }

    /**
     * Get lock info for a robot
     */
    static getLockInfo(robotId) {
        return this.locks.get(robotId) || null;
    }

    /**
     * Verify if user owns the lock
     */
    static verifyOwnership(robotId, userId) {
        const lock = this.locks.get(robotId);
        if (!lock) return { locked: false, owned: true };
        return {
            locked: true,
            owned: lock.userId === userId,
            owner: lock,
        };
    }

    /**
     * Get all locks (for admin dashboard)
     */
    static getAllLocks() {
        const locks = [];
        for (const [robotId, lock] of this.locks.entries()) {
            locks.push({
                robotId,
                ...lock,
            });
        }
        return locks;
    }

    /**
     * Release all locks for a user (on disconnect)
     */
    static releaseAllLocksByUser(userId) {
        const released = [];
        for (const [robotId, lock] of this.locks.entries()) {
            if (lock.userId === userId) {
                this.locks.delete(robotId);
                released.push(robotId);
                logger.info(`🔓 Auto-released lock for robot ${robotId} (user ${userId} disconnected)`);
            }
        }

        if (released.length > 0) {
            broadcastToAll("robot:locks_released", {
                userId,
                robotIds: released,
                reason: "user_disconnected",
            });
        }

        return released;
    }

    /**
     * Cleanup stale locks (older than X minutes)
     */
    static cleanupStaleLocks(maxAgeMinutes = 60) {
        const now = Date.now();
        const maxAge = maxAgeMinutes * 60 * 1000;
        const cleaned = [];

        for (const [robotId, lock] of this.locks.entries()) {
            const age = now - new Date(lock.lockedAt).getTime();
            if (age > maxAge) {
                this.locks.delete(robotId);
                cleaned.push({ robotId, owner: lock.userId, age });
                logger.warn(`🧹 Cleaned stale lock for robot ${robotId} (age: ${Math.round(age / 60000)}min)`);
            }
        }

        if (cleaned.length > 0) {
            broadcastToAll("robot:locks_cleaned", { cleaned });
        }

        return cleaned;
    }
}

// Auto cleanup every 10 minutes
setInterval(
    () => {
        RobotLockService.cleanupStaleLocks(60);
    },
    10 * 60 * 1000,
);

export default RobotLockService;
