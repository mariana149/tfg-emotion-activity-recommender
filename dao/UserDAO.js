const db = require('../config/db');

class UserDAO {

  static async addUser(nombre, apellidos, pais, ciudad, email, password, admin = 0, activo = 1, foto=null) {
    const [result] = await db.execute(
      `INSERT INTO users 
      (nombre, apellidos, pais, ciudad, email, password, admin, activo, foto) 
      VALUES (?,?,?,?,?,?,?,?,?)`,
      [nombre, apellidos, pais, ciudad, email, password, admin, activo, foto]
    );

    return result.insertId;
  }

  static async findByEmail(email) {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE email=?',
      [email]
    );

    return rows[0] || null;
  }

  static async getUserById(id) {
    const [rows] = await db.execute(
      `SELECT id, nombre, apellidos, pais, ciudad, email, admin, activo, foto
      FROM users 
      WHERE id=?`,
      [id]
    );

    return rows[0] || null;
  }

  static async updatePassword(id, newPassword) {
    await db.execute(
      'UPDATE users SET password=? WHERE id=?',
      [newPassword, id]
    );

    return true;
  }

  static async deleteUser(id) {
    await db.execute(
      'UPDATE users SET activo=0 WHERE id=?',
      [id]
    );

    return true;
  }

  static async updateUser(id, nombre, apellidos, pais, ciudad, email) {
    const [result] = await db.execute(
      `UPDATE users
      SET nombre = ?, apellidos = ?, pais = ?, ciudad = ?, email = ?
      WHERE id = ?`,
      [nombre, apellidos, pais, ciudad, email, id]
    );
    return result.affectedRows > 0;
  }

  static async getAllUsers() {
    const [rows] = await db.execute(
      `SELECT id, nombre, apellidos, pais, ciudad, email, admin, activo, created_at
      FROM users
      ORDER BY nombre ASC`
    );

    return rows;
  }

  static async updateFoto(id, foto) {
    const [result] = await db.execute(
        `UPDATE users SET foto = ? WHERE id = ?`,
        [foto, id]
    );
    return result.affectedRows > 0;
  }
  static async updateEmail(id, email) {
      const [result] = await db.execute(
          `UPDATE users SET email = ? WHERE id = ?`,
          [email, id]
      );
      return result.affectedRows > 0;
  }
}

module.exports = UserDAO;