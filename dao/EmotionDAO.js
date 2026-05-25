const db = require('../config/db');

class EmotionDAO {

  static async addEmotion(user_id, emotion, intensity, energy_level, valence, notes) {

    const [result] = await db.execute(
      `INSERT INTO emotion_logs
      (user_id, emotion, intensity, energy_level, notes, valence)
      VALUES (?,?,?,?,?,?)`,
      [user_id, emotion, intensity, energy_level, notes, valence]
    );

    return result.insertId;
  }

  static async getLastEmotion(user_id) {

    const [rows] = await db.execute(
      `SELECT *
       FROM emotion_logs
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [user_id]
    );

    return rows[0] || null;
  }

  static async getEmotionsByUserId(userId){

    const [rows] = await db.execute(
        `SELECT *
        FROM emotion_logs
        WHERE user_id=?
        ORDER BY created_at DESC`,
        [userId]
    );

    return rows;
  }

  static async getEmotionById(id){

      const [rows] = await db.execute(
          `SELECT *
          FROM emotion_logs
          WHERE id=?`,
          [id]
      );

      return rows[0] || null;
  }

  // Para calcular historial y ajustar scores
  static async getEmotionsByUserIdAndDateRange(userId, from, to) {
      const [rows] = await db.execute(
          `SELECT * FROM emotion_logs
          WHERE user_id = ? AND created_at BETWEEN ? AND ?
          ORDER BY created_at DESC`,
          [userId, from, to]
      );
      return rows;
  }

  static async getEmotionEvolution(userId) {
      const [rows] = await db.execute(
          `SELECT 
              created_at AS date,
              valence,
              intensity
          FROM emotion_logs
          WHERE user_id = ?
            AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          ORDER BY created_at`,
          [userId]
      );
      return rows;
  }

  static async getEmotionDistribution(userId) {

    const [rows] = await db.execute(
      `SELECT 
        emotion,
        COUNT(*) AS total
      FROM emotion_logs
      WHERE user_id = ?
      GROUP BY emotion`,
      [userId]
    );

    return rows;
  }

  static async countByUser(userId) {
    const [rows] = await db.execute(
      `SELECT COUNT(*) AS total FROM emotion_logs WHERE user_id = ?`,
      [userId]
    );
    return rows[0].total;
  }
}

module.exports = EmotionDAO;