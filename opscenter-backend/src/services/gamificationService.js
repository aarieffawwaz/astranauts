import database from "../config/database.js";
import { SCORING, getRank } from "../utils/constants.js";
import { broadcastToAll } from "../config/websocket.js";
import logger from "../middleware/logger.js";

class GamificationService {
    // In-memory cache for current session scores
    static sessionScores = new Map();

    /**
     * Update operator score based on telemetry
     */
    static async updateScore(telemetry) {
        const robotId = telemetry.robot_id;

        // Initialize session if not exists
        if (!this.sessionScores.has(robotId)) {
            this.sessionScores.set(robotId, {
                speed_samples: [],
                safety_issues: 0,
                harsh_brakes: 0,
                collisions: 0,
                energy_samples: [],
                route_deviations: 0,
                distance_covered: 0,
                session_start: Date.now(),
                last_x: telemetry.x_position,
                last_y: telemetry.y_position,
            });
        }

        const session = this.sessionScores.get(robotId);

        // Collect speed samples
        if (telemetry.speed > 0) {
            session.speed_samples.push(telemetry.speed);
        }

        // Collect energy samples
        if (telemetry.power_draw) {
            session.energy_samples.push(telemetry.power_draw);
        }

        // Detect harsh braking (speed dropped significantly)
        if (session.last_speed && telemetry.speed < session.last_speed * 0.5) {
            session.harsh_brakes++;
        }

        // Update distance covered
        if (session.last_x !== null) {
            const distance = Math.sqrt(Math.pow(telemetry.x_position - session.last_x, 2) + Math.pow(telemetry.y_position - session.last_y, 2));
            session.distance_covered += distance;
        }

        session.last_x = telemetry.x_position;
        session.last_y = telemetry.y_position;
        session.last_speed = telemetry.speed;

        // Calculate scores
        const scores = this.calculateScores(session);

        // Broadcast score update
        broadcastToAll("score:update", {
            robot_id: robotId,
            scores,
            rank: getRank(scores.total_score),
        });

        return scores;
    }

    /**
     * Calculate individual scores
     */
    static calculateScores(session) {
        // Speed Score: Optimal range 15-20 cm/s
        let speedScore = 0;
        if (session.speed_samples.length > 0) {
            const avgSpeed = session.speed_samples.reduce((a, b) => a + b, 0) / session.speed_samples.length;
            if (avgSpeed >= 15 && avgSpeed <= 20) {
                speedScore = 100;
            } else if (avgSpeed >= 10 && avgSpeed < 15) {
                speedScore = 70;
            } else if (avgSpeed > 20) {
                speedScore = 50;
            } else {
                speedScore = 30;
            }
        }

        // Safety Score
        const safetyIssues = session.harsh_brakes + session.collisions;
        const safetyScore = Math.max(0, 100 - safetyIssues * 10);

        // Energy Score: Lower power draw = better score
        let energyScore = 100;
        if (session.energy_samples.length > 0) {
            const avgPower = session.energy_samples.reduce((a, b) => a + b, 0) / session.energy_samples.length;
            if (avgPower > 150) energyScore = 50;
            else if (avgPower > 120) energyScore = 70;
            else if (avgPower > 100) energyScore = 85;
        }

        // Route Score
        const routeScore = Math.max(0, 100 - session.route_deviations * 5);

        // Total Score (weighted)
        const totalScore = Math.round(speedScore * SCORING.SPEED_WEIGHT + safetyScore * SCORING.SAFETY_WEIGHT + energyScore * SCORING.ENERGY_WEIGHT + routeScore * SCORING.ROUTE_WEIGHT);

        return {
            speed_score: Math.round(speedScore),
            safety_score: Math.round(safetyScore),
            energy_score: Math.round(energyScore),
            route_score: Math.round(routeScore),
            total_score: totalScore,
        };
    }

    /**
     * Get current scores for a robot
     */
    static getCurrentScores(robotId) {
        const session = this.sessionScores.get(robotId);
        if (!session) {
            return null;
        }

        const scores = this.calculateScores(session);
        return {
            ...scores,
            rank: getRank(scores.total_score),
            session_duration: Date.now() - session.session_start,
            distance_covered: Math.round(session.distance_covered),
            harsh_brakes: session.harsh_brakes,
            collisions: session.collisions,
        };
    }

    /**
     * Get leaderboard
     */
    static getLeaderboard() {
        const leaderboard = [];

        for (const [robotId, session] of this.sessionScores.entries()) {
            const scores = this.calculateScores(session);
            leaderboard.push({
                robot_id: robotId,
                ...scores,
                rank: getRank(scores.total_score),
                session_duration: Date.now() - session.session_start,
            });
        }

        return leaderboard.sort((a, b) => b.total_score - a.total_score);
    }

    /**
     * Reset session for a robot
     */
    static resetSession(robotId) {
        this.sessionScores.delete(robotId);
        logger.info(`Session reset for robot ${robotId}`);
        broadcastToAll("score:reset", { robot_id: robotId });
    }

    /**
     * Save session to database
     */
    static async saveSession(robotId, operatorName = null) {
        const session = this.sessionScores.get(robotId);
        if (!session) return null;

        const scores = this.calculateScores(session);

        const query = `
      INSERT INTO operator_scores (
        robot_id, operator_name,
        speed_score, safety_score, energy_score, route_score, total_score,
        session_duration, distance_covered, harsh_brakes, collisions
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

        const params = [
            robotId,
            operatorName,
            scores.speed_score,
            scores.safety_score,
            scores.energy_score,
            scores.route_score,
            scores.total_score,
            Date.now() - session.session_start,
            Math.round(session.distance_covered),
            session.harsh_brakes,
            session.collisions,
        ];

        const result = await database.query(query, params);
        return result.rows[0];
    }
}

export default GamificationService;
