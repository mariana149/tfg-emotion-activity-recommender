const db = require('../config/db');

class AdminDAO {

    static async getTotalUsuarios() {
        const [rows] = await db.execute(
            `SELECT COUNT(*) AS total, SUM(activo) AS activos FROM users WHERE admin = 0`
        );
        return rows[0];
    }

    static async getTotalActividades() {
        const [rows] = await db.execute(
            `SELECT COUNT(*) AS total, SUM(activo) AS activas FROM activities`
        );
        return rows[0];
    }

    static async getValoracionMedia() {
        const [rows] = await db.execute(
            `SELECT ROUND(AVG(rating), 1) AS media FROM activity_logs WHERE rating IS NOT NULL`
        );
        return rows[0].media || 0;
    }

    static async getMejorActividad() {
        const [rows] = await db.execute(
            `SELECT a.name, ROUND(AVG(al.rating), 1) AS media
             FROM activity_logs al
             JOIN activities a ON al.activity_id = a.id
             WHERE al.rating IS NOT NULL
             GROUP BY al.activity_id
             ORDER BY media DESC
             LIMIT 1`
        );
        return rows[0] || null;
    }

    static async getTotalEmociones() {
        const [rows] = await db.execute(
            `SELECT COUNT(*) AS total FROM emotion_logs`
        );
        return rows[0].total;
    }

    static async getEmocionMasFrecuente() {
        const [rows] = await db.execute(
            `SELECT emotion, COUNT(*) AS total
             FROM emotion_logs
             GROUP BY emotion
             ORDER BY total DESC
             LIMIT 1`
        );
        return rows[0] || null;
    }

    static async getTotalRecomendaciones() {
        const [rows] = await db.execute(
            `SELECT COUNT(*) AS total FROM recommendations`
        );
        return rows[0].total;
    }

    static async getTotalActividadesRealizadas() {
        const [rows] = await db.execute(
            `SELECT COUNT(*) AS total FROM activity_logs`
        );
        return rows[0].total;
    }

    static async getImpactoPositivo() {
        const [rows] = await db.execute(
            `SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN (ea.valence * ea.intensity) > (eb.valence * eb.intensity) THEN 1 ELSE 0 END) AS positivo
            FROM activity_logs al 
            JOIN emotion_logs eb ON al.emotion_before_id = eb.id
            JOIN emotion_logs ea ON al.emotion_after_id = ea.id
            WHERE al.emotion_before_id IS NOT NULL 
            AND al.emotion_after_id IS NOT NULL`
        );
        const { total, positivo } = rows[0];
        if (!total) return 0;
        return Math.round((positivo / total) * 100);
    }

    static async getEvolucionEmocional(limit = 30) {
        const [rows] = await db.execute(
            `SELECT * FROM (
                SELECT valence, created_at
                FROM emotion_logs
                ORDER BY created_at DESC
                LIMIT ?
            ) AS ultimas
            ORDER BY created_at ASC`,
            [limit]
        );
        return rows;
    }

    static async getDistribucionEmociones() {
        const [rows] = await db.execute(
            `SELECT emotion, COUNT(*) AS total
             FROM emotion_logs
             GROUP BY emotion
             ORDER BY total DESC`
        );
        return rows;
    }

    static async getImpactoActividades() {
        const [rows] = await db.execute(
            `SELECT 
                a.name,
                ROUND(AVG(eb.valence), 2) AS antes,
                ROUND(AVG(ea.valence), 2) AS despues
             FROM activity_logs al
             JOIN activities a ON al.activity_id = a.id
             JOIN emotion_logs eb ON al.emotion_before_id = eb.id
             JOIN emotion_logs ea ON al.emotion_after_id = ea.id
             WHERE al.emotion_before_id IS NOT NULL
             AND al.emotion_after_id IS NOT NULL
             GROUP BY al.activity_id
             ORDER BY (AVG(ea.valence) - AVG(eb.valence)) DESC
             LIMIT 5`
        );
        return rows;
    }

    static async getAllUsuarios() {
        const [rows] = await db.execute(
            `SELECT id, nombre, apellidos, pais, ciudad, email, activo, admin, created_at
             FROM users
             WHERE admin = 0
             ORDER BY created_at DESC`
        );
        return rows;
    }

    static async activarUsuario(id) {
        const [result] = await db.execute(
            `UPDATE users SET activo = 1 WHERE id = ?`, [id]
        );
        return result.affectedRows > 0;
    }

    static async desactivarUsuario(id) {
        const [result] = await db.execute(
            `UPDATE users SET activo = 0 WHERE id = ?`, [id]
        );
        return result.affectedRows > 0;
    }

    static async getStatsUsuario(userId) {
        const [[emociones], [actividades], [valoracion], [exito]] = await Promise.all([
            db.execute(`SELECT COUNT(*) AS total FROM emotion_logs WHERE user_id = ?`, [userId]),
            db.execute(`SELECT COUNT(*) AS total FROM activity_logs WHERE user_id = ?`, [userId]),
            db.execute(`SELECT ROUND(AVG(rating), 1) AS media FROM activity_logs WHERE user_id = ? AND rating IS NOT NULL`, [userId]),
            db.execute(`SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN (ea.valence * ea.intensity) > (eb.valence * eb.intensity) THEN 1 ELSE 0 END) AS positivo
                FROM activity_logs al
                JOIN emotion_logs eb ON al.emotion_before_id = eb.id
                JOIN emotion_logs ea ON al.emotion_after_id = ea.id
                WHERE al.user_id = ?
                AND al.emotion_before_id IS NOT NULL
                AND al.emotion_after_id IS NOT NULL`, [userId])
        ]);
        return {
            emociones: emociones[0].total,
            actividades: actividades[0].total,
            valoracion: valoracion[0].media || 0,
            exito: exito[0].total ? Math.round((exito[0].positivo / exito[0].total) * 100) : 0
        };
    }

    static async getStatsActividad(activityId) {
        const [[realizadas], [valoracion], [exito], [emocion]] = await Promise.all([
            db.execute(`SELECT COUNT(*) AS total, COUNT(DISTINCT user_id) AS usuarios FROM activity_logs WHERE activity_id = ?`, [activityId]),
            db.execute(`SELECT ROUND(AVG(rating), 1) AS media FROM activity_logs WHERE activity_id = ? AND rating IS NOT NULL`, [activityId]),
            db.execute(`SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN (ea.valence * ea.intensity) > (eb.valence * eb.intensity) THEN 1 ELSE 0 END) AS positivo
                FROM activity_logs al
                JOIN emotion_logs eb ON al.emotion_before_id = eb.id
                JOIN emotion_logs ea ON al.emotion_after_id = ea.id
                WHERE al.activity_id = ?
                AND al.emotion_before_id IS NOT NULL
                AND al.emotion_after_id IS NOT NULL`, [activityId]),
            db.execute(`SELECT emotion, COUNT(*) AS total
                FROM activity_logs al
                JOIN emotion_logs e ON al.emotion_before_id = e.id
                WHERE al.activity_id = ?
                GROUP BY emotion
                ORDER BY total DESC
                LIMIT 1`, [activityId])
        ]);
        return {
            realizadas: realizadas[0].total,
            usuarios: realizadas[0].usuarios,
            valoracion: valoracion[0].media || 0,
            exito: exito[0].total ? Math.round((exito[0].positivo / exito[0].total) * 100) : 0,
            emocionFrecuente: emocion[0] ? emocion[0].emotion : null
        };
    }

    static async getUsuarioById(id) {
        const [rows] = await db.execute(
            `SELECT id, nombre, apellidos, pais, ciudad, email, activo, admin, foto
            FROM users WHERE id = ?`,
            [id]
        );
        return rows[0] || null;
    }

    static async getResumenGeneral() {
        const [rows] = await db.execute(
            `SELECT
                (SELECT COUNT(*) FROM users WHERE activo = 1 AND admin = 0) AS total_usuarios,
                (SELECT COUNT(*) FROM activities WHERE activo = 1 AND estado = 'publicada') AS total_actividades,
                (SELECT COUNT(*) FROM activity_logs) AS total_realizaciones,
                (SELECT COUNT(*) FROM emotion_logs) AS total_emociones,
                (SELECT COUNT(*) FROM recommendations) AS total_recomendaciones,
                (SELECT COUNT(*) FROM conexiones WHERE estado = 'aceptada') AS total_conexiones,
                (SELECT ROUND(AVG(rating), 1) FROM activity_logs WHERE rating IS NOT NULL) AS valoracion_global,
                (SELECT COUNT(*) FROM emotion_logs
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS emociones_30d,
                (SELECT COUNT(*) FROM emotion_logs WHERE emotion IN (1,2)) AS emociones_positivas,
                (SELECT COUNT(*) FROM emotion_logs WHERE emotion IN (4,5,6)) AS emociones_negativas`
        );
        return rows[0];
    }

    static async getUsuariosPorEmocionPredominante() {
        const [rows] = await db.execute(
            `SELECT
                u.id, u.nombre, u.apellidos,
                el.emotion,
                COUNT(*) AS total
            FROM users u
            JOIN emotion_logs el ON el.user_id = u.id
            WHERE u.activo = 1 AND u.admin = 0
            GROUP BY u.id, el.emotion
            ORDER BY u.id, total DESC`
        );

        const mapa = new Map();
        rows.forEach(r => {
            if (!mapa.has(r.id)) {
                mapa.set(r.id, { id: r.id, nombre: r.nombre, apellidos: r.apellidos, emotion: r.emotion, total: r.total });
            }
        });
        return [...mapa.values()];
    }

    static async getUsuariosEmocionesNegativas() {
        const [rows] = await db.execute(
            `SELECT
                u.id, u.nombre, u.apellidos,
                COUNT(*) AS total_emociones,
                SUM(CASE WHEN el.emotion IN (4,5,6) THEN 1 ELSE 0 END) AS negativas,
                ROUND(SUM(CASE WHEN el.emotion IN (4,5,6) THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS pct_negativas
            FROM users u
            JOIN emotion_logs el ON el.user_id = u.id
            WHERE u.activo = 1 AND u.admin = 0
            AND el.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY u.id
            HAVING pct_negativas > 50
            ORDER BY pct_negativas DESC`
        );
        return rows;
    }

    static async getUsuariosValenciaBaja() {
        const [rows] = await db.execute(
            `SELECT
                u.id, u.nombre, u.apellidos,
                ROUND(AVG(el.valence), 2) AS valencia_media,
                COUNT(*) AS total_emociones
            FROM users u
            JOIN emotion_logs el ON el.user_id = u.id
            WHERE u.activo = 1 AND u.admin = 0
            AND el.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY u.id
            HAVING valencia_media < -0.5
            ORDER BY valencia_media ASC`
        );
        return rows;
    }

    static async getMediaSemanalPorUsuario() {
        const [rows] = await db.execute(
            `SELECT
                u.id, u.nombre, u.apellidos,
                ROUND(AVG(CASE WHEN el.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                            THEN el.valence END), 2) AS media_esta_semana,
                ROUND(AVG(CASE WHEN el.created_at BETWEEN DATE_SUB(NOW(), INTERVAL 14 DAY)
                                                AND DATE_SUB(NOW(), INTERVAL 7 DAY)
                            THEN el.valence END), 2) AS media_semana_anterior
            FROM users u
            JOIN emotion_logs el ON el.user_id = u.id
            WHERE u.activo = 1 AND u.admin = 0
            AND el.created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
            GROUP BY u.id`
        );

        return rows.filter(u =>
            u.media_esta_semana !== null &&
            u.media_semana_anterior !== null &&
            u.media_esta_semana < u.media_semana_anterior
        );
    }

    static async getUsuariosMasActivos(limit = 10) {
        const [rows] = await db.execute(
            `SELECT
                u.id, u.nombre, u.apellidos,
                COUNT(al.id) AS actividades_realizadas,
                COUNT(DISTINCT al.activity_id) AS actividades_distintas,
                ROUND(AVG(al.rating), 1) AS valoracion_media
            FROM users u
            JOIN activity_logs al ON al.user_id = u.id
            WHERE u.activo = 1 AND u.admin = 0
            GROUP BY u.id
            ORDER BY actividades_realizadas DESC
            LIMIT ?`,
            [limit]
        );
        return rows;
    }

    static async getImpactoEmocionalActividades() {
        const [rows] = await db.execute(
            `SELECT
                a.name,
                COUNT(*) AS total,
                ROUND(AVG((ea.valence * ea.intensity) - (eb.valence * eb.intensity)), 2) AS mejora_media,
                ROUND(AVG(al.rating), 1) AS rating_medio,
                ROUND(SUM(CASE WHEN (ea.valence * ea.intensity) > (eb.valence * eb.intensity) THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS pct_mejora
            FROM activity_logs al
            JOIN activities a ON al.activity_id = a.id
            JOIN emotion_logs eb ON al.emotion_before_id = eb.id
            JOIN emotion_logs ea ON al.emotion_after_id = ea.id
            WHERE al.emotion_before_id IS NOT NULL
            AND al.emotion_after_id IS NOT NULL
            GROUP BY a.id
            ORDER BY mejora_media DESC`
        );
        return rows;
    }

    static async getEfectividadRecomendaciones() {
        const [rows] = await db.execute(
            `SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN aceptada = 1 THEN 1 ELSE 0 END) AS aceptadas,
                SUM(CASE WHEN aceptada = 0 THEN 1 ELSE 0 END) AS rechazadas,
                SUM(CASE WHEN aceptada IS NULL THEN 1 ELSE 0 END) AS pendientes,
                ROUND(SUM(CASE WHEN aceptada = 1 THEN 1 ELSE 0 END) * 100.0 /
                    NULLIF(SUM(CASE WHEN aceptada IS NOT NULL THEN 1 ELSE 0 END), 0), 1) AS pct_aceptacion
            FROM recommendations`
        );
        return rows[0];
    }

    static async getEngagement() {
        const [rows] = await db.execute(
            `SELECT
                u.id, u.nombre, u.apellidos,
                GREATEST(
                    COALESCE(MAX(al.created_at), '1970-01-01'),
                    COALESCE(MAX(el.created_at), '1970-01-01')
                ) AS last_activity
            FROM users u
            LEFT JOIN activity_logs al ON al.user_id = u.id
            LEFT JOIN emotion_logs  el ON el.user_id = u.id
            WHERE u.activo = 1 AND u.admin = 0
            GROUP BY u.id`
        );

        const ahora = new Date();
        const activos = [], inactivos = [], abandonados = [], sinUso = [];

        rows.forEach(u => {
            const last = new Date(u.last_activity);
            const dias = (ahora - last) / (1000 * 60 * 60 * 24);
            if (u.last_activity === '1970-01-01T00:00:00.000Z' || isNaN(dias)) {
                sinUso.push(u);
            } else if (dias <= 7) {
                activos.push(u);
            } else if (dias <= 30) {
                inactivos.push(u);
            } else {
                abandonados.push(u);
            }
        });

        return { activos, inactivos, abandonados, sinUso, total: rows.length };
    }
}

module.exports = AdminDAO;