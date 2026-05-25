const db = require('../config/db');

class ActivityLogDAO {

  static async startActivity(user_id, activity_id, recommendation_id = null, emotion_before_id = null, emotion_after_id = null, rating = null) {
      const [result] = await db.execute(
          `INSERT INTO activity_logs
          (user_id, activity_id, recommendation_id, emotion_before_id, emotion_after_id, rating)
          VALUES (?,?,?,?,?,?)`,
          [user_id, activity_id, recommendation_id, emotion_before_id, emotion_after_id, rating]
      );
      return result.insertId;
  }

  static async setEmotionBefore(log_id, emotion_id) {

    const [result] = await db.execute(
      `UPDATE activity_logs
       SET emotion_before_id = ?
       WHERE id = ?`,
      [emotion_id, log_id]
    );
    return result.affectedRows > 0;
  }

  static async setEmotionAfter(log_id, emotion_id) {

   const [result] = await db.execute(
      `UPDATE activity_logs
       SET emotion_after_id = ?
       WHERE id = ?`,
      [emotion_id, log_id]
    );
    return result.affectedRows > 0;
  }

  static async getActivitiesByUser(userId) {

    const [rows] = await db.execute(
        `SELECT 
            al.id,
            al.activity_id,
            al.recommendation_id,
            al.emotion_before_id,
            al.emotion_after_id,
            al.created_at,
            a.name
         FROM activity_logs al
         JOIN activities a ON al.activity_id = a.id
         WHERE al.user_id = ?
         ORDER BY al.created_at DESC`,
        [userId]
    );

    return rows;
  }

  static async getLogById(id) {

    const [rows] = await db.execute(
        `SELECT *
         FROM activity_logs
         WHERE id = ?`,
        [id]
    );

    return rows[0] || null;
  }

  static async countByUser(userId) {
    const [rows] = await db.execute(
      `SELECT COUNT(*) AS total FROM activity_logs WHERE user_id = ?`,
      [userId]
    );
    return rows[0].total;
  }
  
  static async setRating(logId, rating) {
    const [result] = await db.execute(
        `UPDATE activity_logs SET rating = ? WHERE id = ?`,
        [rating, logId]
    );
    return result.affectedRows > 0;
  }
    static async getRealizadasSinRecomendacion(userId) {
      const [rows] = await db.execute(
          `SELECT al.*, a.name AS activity_name, a.energy_level, a.indoor, a.individual,
                  c.name AS category, al.rating,
                  eb.valence AS valence_before, eb.intensity AS intensity_before,
                  ea.valence AS valence_after, ea.intensity AS intensity_after
          FROM activity_logs al
          JOIN activities a ON al.activity_id = a.id
          LEFT JOIN categories c ON a.category_id = c.id
          LEFT JOIN emotion_logs eb ON al.emotion_before_id = eb.id
          LEFT JOIN emotion_logs ea ON al.emotion_after_id = ea.id
          WHERE al.user_id = ? AND al.recommendation_id IS NULL
          ORDER BY al.created_at DESC`,
          [userId]
      );
      return rows;
  }
}

module.exports = ActivityLogDAO;