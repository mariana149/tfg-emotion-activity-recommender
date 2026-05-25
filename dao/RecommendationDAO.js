const db = require('../config/db');

class RecommendationDAO {
    
    static async saveRecommendation(user_id, activity_id, emotion_id, score, reason) {
        const [result] = await db.execute(
            `INSERT INTO recommendations
            (user_id, activity_id, emotion_id, score, reason)
            VALUES (?,?,?,?,?)`,
            [user_id, activity_id, emotion_id, score, reason]
        );

        return result.insertId;
    }

    static async getUserRecommendations(user_id) {
        const [rows] = await db.execute(
            `SELECT r.*, a.name
            FROM recommendations r
            JOIN activities a ON r.activity_id = a.id
            WHERE r.user_id = ?
            ORDER BY r.created_at DESC`,
            [user_id]
        );

        return rows;
    }

    static async countByUser(userId) {
        const [rows] = await db.execute(
            `SELECT COUNT(*) AS total FROM recommendations WHERE user_id = ?`,
            [userId]
        );
        return rows[0].total;
    }

    static async getConfig() {
        const [rows] = await db.execute(
            `SELECT param, value FROM recommendation_config`
        );
        const config = {};
        rows.forEach(r => config[r.param] = r.value);
        return config;
    }

    static async updateConfig(param, value) {
        const [result] = await db.execute(
            `UPDATE recommendation_config SET value = ? WHERE param = ?`,
            [value, param]
        );
        return result.affectedRows > 0;
    }

    static async getLastByUser(userId) {
        const [rows] = await db.execute(
            `SELECT r.*, a.name AS activity_name
            FROM recommendations r
            JOIN activities a ON r.activity_id = a.id
            WHERE r.user_id = ?
            ORDER BY r.created_at DESC
            LIMIT 1`,
            [userId]
        );
        return rows[0] || null;
    }

    static async getByUserAndActivity(userId, activityId) {
        const [rows] = await db.execute(
            `SELECT * FROM recommendations 
            WHERE user_id = ? AND activity_id = ?
            ORDER BY created_at DESC`,
            [userId, activityId]
        );
        return rows;
    }

    static async getGlobalRatingByActivity(activityId) {
        const [rows] = await db.execute(
            `SELECT AVG(rating) AS media, COUNT(*) AS total
            FROM activity_logs
            WHERE activity_id = ? AND rating IS NOT NULL`,
            [activityId]
        );
        return rows[0] || { media: null, total: 0 };
    }

    static async getCategoriasFavoritasByUser(userId) {
        const [rows] = await db.execute(
            `SELECT a.category_id, COUNT(*) AS total
            FROM activity_logs al
            JOIN activities a ON al.activity_id = a.id
            WHERE al.user_id = ?
            GROUP BY a.category_id
            ORDER BY total DESC`,
            [userId]
        );
        return rows;
    }

    static async getRatingPersonalByActivity(userId, activityId) {
        const [rows] = await db.execute(
            `SELECT AVG(rating) AS media, COUNT(*) AS total
            FROM activity_logs
            WHERE user_id = ? AND activity_id = ? AND rating IS NOT NULL`,
            [userId, activityId]
        );
        return rows[0] || { media: null, total: 0 };
    }

    static async saveRecomendaciones(userId, recomendaciones) {
        const ids = [];
        for (const rec of recomendaciones) {
            const [result] = await db.execute(
                `INSERT INTO recommendations (user_id, activity_id, emotion_id, score, reason)
                VALUES (?, ?, ?, ?, ?)`,
                [userId, rec.activity.id, rec.emotionId, rec.score, rec.reason]
            );
            ids.push(result.insertId);
        }
        return ids;
    }

    static async updateAceptada(id, aceptada) {
        const [result] = await db.execute(
            `UPDATE recommendations SET aceptada = ? WHERE id = ?`,
            [aceptada, id]
        );
        return result.affectedRows > 0;
    }

    static async getHistorialByUser(userId) {
        const [rows] = await db.execute(
            `SELECT r.*, a.name AS activity_name, a.energy_level, a.indoor, a.individual,
                    c.name AS category,
                    e.emotion AS emotion_tipo, e.valence AS emotion_valence,
                    al.emotion_before_id, al.emotion_after_id, al.rating,
                    eb.valence AS valence_before, eb.intensity AS intensity_before,
                    ea.valence AS valence_after, ea.intensity AS intensity_after
            FROM recommendations r
            JOIN activities a ON r.activity_id = a.id
            LEFT JOIN categories c ON a.category_id = c.id
            LEFT JOIN emotion_logs e ON r.emotion_id = e.id
            LEFT JOIN activity_logs al ON al.recommendation_id = r.id
            LEFT JOIN emotion_logs eb ON al.emotion_before_id = eb.id
            LEFT JOIN emotion_logs ea ON al.emotion_after_id = ea.id
            WHERE r.user_id = ?
            ORDER BY r.created_at DESC`,
            [userId]
        );
        return rows;
    }

    // Impacto personal: (valence_after * intensity_after) - (valence_before * intensity_before)
    static async getImpactoPersonalByActivity(userId, activityId) {
        const [rows] = await db.execute(
            `SELECT
                AVG((ea.valence * ea.intensity) - (eb.valence * eb.intensity)) AS impacto_medio,
                COUNT(*) AS total
            FROM activity_logs al
            JOIN emotion_logs eb ON al.emotion_before_id = eb.id
            JOIN emotion_logs ea ON al.emotion_after_id = ea.id
            WHERE al.user_id = ?
            AND al.activity_id = ?
            AND al.emotion_before_id IS NOT NULL
            AND al.emotion_after_id  IS NOT NULL`,
            [userId, activityId]
        );
        return rows[0] || { impacto_medio: null, total: 0 };
    }

    // Impacto global: (valence_after * intensity_after) - (valence_before * intensity_before)
    // Todos los usuarios que realizaron la actividad con before+after
    static async getImpactoGlobalByActivity(activityId) {
        const [rows] = await db.execute(
            `SELECT
                AVG((ea.valence * ea.intensity) - (eb.valence * eb.intensity)) AS impacto_medio,
                COUNT(*) AS total
            FROM activity_logs al
            JOIN emotion_logs eb ON al.emotion_before_id = eb.id
            JOIN emotion_logs ea ON al.emotion_after_id = ea.id
            WHERE al.activity_id = ?
            AND al.emotion_before_id IS NOT NULL
            AND al.emotion_after_id IS NOT NULL`,
            [activityId]
        );
        return rows[0] || { impacto_medio: null, total: 0 };
    }

    // Precarga todos los datos necesarios para el algoritmo en una sola query por usuario
    // Evita N queries en bucle, un mapa por actividad
    static async getRatingsPersonalesByUser(userId) {
        const [rows] = await db.execute(
            `SELECT
                al.activity_id,
                AVG((ea.valence * ea.intensity) - (eb.valence * eb.intensity)) AS impacto_medio,
                COUNT(*) AS total
            FROM activity_logs al
            JOIN emotion_logs eb ON al.emotion_before_id = eb.id
            JOIN emotion_logs ea ON al.emotion_after_id = ea.id
            WHERE al.user_id = ?
            AND al.emotion_before_id IS NOT NULL
            AND al.emotion_after_id  IS NOT NULL
            GROUP BY al.activity_id`,
            [userId]
        );
        const mapa = {};
        rows.forEach(r => { mapa[r.activity_id] = r; });
        return mapa;
    }

    static async getRatingsGlobales() {
        const [rows] = await db.execute(
            `SELECT
                al.activity_id,
                AVG((ea.valence * ea.intensity) - (eb.valence * eb.intensity)) AS impacto_medio,
                COUNT(*) AS total
            FROM activity_logs al
            JOIN emotion_logs eb ON al.emotion_before_id = eb.id
            JOIN emotion_logs ea ON al.emotion_after_id = ea.id
            WHERE al.emotion_before_id IS NOT NULL
            AND al.emotion_after_id IS NOT NULL
            GROUP BY al.activity_id`
        );
        const mapa = {};
        rows.forEach(r => { mapa[r.activity_id] = r; });
        return mapa;
    }
    
    static async getRatingsPersonalesBulk(userId) {
        const [rows] = await db.execute(
            `SELECT activity_id,
                    AVG(rating) AS media,
                    COUNT(*) AS total
            FROM activity_logs
            WHERE user_id = ? AND rating IS NOT NULL
            GROUP BY activity_id`,
            [userId]
        );
        const mapa = {};
        rows.forEach(r => { mapa[r.activity_id] = r; });
        return mapa;
    }

    static async getRatingsGlobalesBulk() {
        const [rows] = await db.execute(
            `SELECT activity_id,
                    AVG(rating) AS media,
                    COUNT(*) AS total
            FROM activity_logs
            WHERE rating IS NOT NULL
            GROUP BY activity_id`
        );
        const mapa = {};
        rows.forEach(r => { mapa[r.activity_id] = r; });
        return mapa;
    }

    static async getPendientesByUser(userId) {
        const [rows] = await db.execute(
            `SELECT r.id AS recommendation_id, r.score, r.reason, r.emotion_id,
                    e.emotion AS emotion_tipo,
                    e.intensity AS emotion_intensity,
                    e.energy_level AS emotion_energy,
                    a.id, a.name, a.description, a.category_id, a.energy_level AS act_energy_level,
                    a.duration_minutes,
                    a.indoor, a.individual, c.name AS category
            FROM recommendations r
            JOIN activities a ON r.activity_id = a.id
            LEFT JOIN categories c ON a.category_id = c.id
            LEFT JOIN emotion_logs e ON r.emotion_id = e.id
            WHERE r.user_id = ? AND r.aceptada IS NULL
            ORDER BY r.created_at DESC`,
            [userId]
        );
        return rows.map(r => ({
            recommendation_id: r.recommendation_id,
            emotion_id: r.emotion_id,
            emotion_tipo: r.emotion_tipo,
            emotion_intensity: r.emotion_intensity,
            emotion_energy: r.emotion_energy,
            score: r.score,
            reason: r.reason,
            activity: {
                id: r.id,
                name: r.name,
                description: r.description,
                category_id: r.category_id,
                energy_level: r.act_energy_level,
                duration_minutes: r.duration_minutes,
                indoor: r.indoor,
                individual: r.individual,
                category: r.category
            }
        }));
    }
}

module.exports = RecommendationDAO;