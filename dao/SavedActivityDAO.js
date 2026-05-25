const db = require('../config/db');

class SavedActivityDAO {

  static async saveActivity(userId, activityId, recommendationId = null) {

    const [result] = await db.execute(
      `INSERT INTO saved_activities (user_id, activity_id, recommendation_id)
       VALUES (?, ?, ?)`,
      [userId, activityId, recommendationId]
    );

    return result.insertId;
  }

  static async getSavedByUser(userId) {
      const [rows] = await db.execute(
          `SELECT sa.id AS saved_id, sa.created_at AS saved_at, a.*
          FROM saved_activities sa
          JOIN activities a ON sa.activity_id = a.id
          WHERE sa.user_id = ?
          ORDER BY sa.created_at DESC`,
          [userId]
      );
      return rows;
  }

  static async exists(userId, activityId) {

    const [rows] = await db.execute(
      `SELECT id
       FROM saved_activities
       WHERE user_id = ? AND activity_id = ?`,
      [userId, activityId]
    );

    return rows[0] || null;
  }

  static async removeSaved(userId, activityId) {

    const [result] = await db.execute(
      `DELETE FROM saved_activities
       WHERE user_id = ? AND activity_id = ?`,
      [userId, activityId]
    );

    return result.affectedRows > 0;
  }
  static async countByUser(userId) {
    const [rows] = await db.execute(
      `SELECT COUNT(*) AS total FROM saved_activities WHERE user_id = ?`,
      [userId]
    );
    return rows[0].total;
  }
}

module.exports = SavedActivityDAO;