const db = require('../config/db');

class ActivityDAO {

  static async getAll() {
      const [rows] = await db.execute(`
          SELECT a.*, c.name AS category,
                u.nombre AS created_by_nombre,
                u.email  AS created_by_email
          FROM activities a
          LEFT JOIN categories c ON a.category_id = c.id
          LEFT JOIN users u ON a.created_by = u.id
          WHERE a.estado = 'publicada'
          ORDER BY a.name
      `);
      return rows;
  }

  static async getById(id) {
    const [rows] = await db.execute(`
      SELECT a.*, c.name AS category
      FROM activities a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.id = ?
    `, [id]);

    return rows[0] || null;
  }
  
  static async createActivity(name, description, category_id, energy_level, duration_minutes, indoor, individual, userId, estado = 'propuesta') {
      const [result] = await db.execute(
          `INSERT INTO activities
          (name, description, category_id, energy_level, duration_minutes, indoor, individual, created_by, estado)
          VALUES (?,?,?,?,?,?,?,?,?)`,
          [name, description, category_id, energy_level, duration_minutes, indoor, individual, userId, estado]
      );
      return result.insertId;
  }

  static async updateActivity(id, name, description) {
    const [result] = await db.execute(
      `UPDATE activities
      SET name = ?, description = ?
      WHERE id = ?`,
      [name, description, id]
    );

    return result.affectedRows > 0;
  }

 static async deleteActivity(id){

    const [result] = await db.execute(
      `UPDATE activities
      SET activo = 0
      WHERE id = ?`,
      [id]
    );

    return result.affectedRows > 0;
  }
  static async getNotSavedByUser(userId) {

    const [rows] = await db.execute(
      `SELECT a.*
      FROM activities a
      WHERE a.id NOT IN (
          SELECT activity_id
          FROM saved_activities
          WHERE user_id = ?
      )
      AND a.activo = 1
      ORDER BY a.name`,
      [userId]
    );

    return rows;
  }

  static async activateActivity(id) {
      const [result] = await db.execute(
          `UPDATE activities SET activo = 1 WHERE id = ?`,
          [id]
      );
      return result.affectedRows > 0;
  }

  static async getByUser(userId) {
    const [rows] = await db.execute(
        `SELECT a.*, c.name AS category
         FROM activities a
         LEFT JOIN categories c ON a.category_id = c.id
         WHERE a.created_by = ?
         ORDER BY a.created_at DESC`,
        [userId]
    );
    return rows;
}

  static async createByUser(userId, name, description, category_id, energy_level, duration_minutes, indoor, individual) {
      const [result] = await db.execute(
          `INSERT INTO activities (name, description, category_id, energy_level, duration_minutes, indoor, individual, estado, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'borrador', ?)`,
          [name, description, category_id, energy_level, duration_minutes, indoor, individual, userId]
      );
      return result.insertId;
  }

  static async updateEstado(id, estado) {
      const [result] = await db.execute(
          `UPDATE activities SET estado = ? WHERE id = ?`,
          [estado, id]
      );
      return result.affectedRows > 0;
  }

  static async getByEstado(estado) {
      const [rows] = await db.execute(
          `SELECT a.*, c.name AS category,
                  u.nombre AS created_by_nombre,
                  u.email  AS created_by_email
          FROM activities a
          LEFT JOIN categories c ON a.category_id = c.id
          LEFT JOIN users u ON a.created_by = u.id
          WHERE a.estado = ?
          ORDER BY a.created_at DESC`,
          [estado]
      );
      return rows;
  }
  
  static async getAllPublicadas() {
    const [rows] = await db.execute(`
        SELECT a.*, c.name AS category
        FROM activities a
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.estado = 'publicada' AND a.activo = 1
        ORDER BY a.name
    `);
    return rows;
  }

  static async deleteById(id) {
      const [result] = await db.execute(
          `DELETE FROM activities WHERE id = ?`,
          [id]
      );
      return result.affectedRows > 0;
  }
}

module.exports = ActivityDAO;