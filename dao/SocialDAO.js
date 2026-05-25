const db = require('../config/db');

class SocialDAO {

  static async getConexion(userA, userB) {
    const [rows] = await db.execute(
      `SELECT * FROM conexiones
       WHERE (solicitante_id = ? AND receptor_id = ?)
          OR (solicitante_id = ? AND receptor_id = ?)
       LIMIT 1`,
      [userA, userB, userB, userA]
    );
    return rows[0] || null;
  }

  static async crearSolicitud(solicitanteId, receptorId) {
    const [result] = await db.execute(
      `INSERT INTO conexiones (solicitante_id, receptor_id, estado)
       VALUES (?, ?, 'pendiente')`,
      [solicitanteId, receptorId]
    );
    return result.insertId;
  }

  static async actualizarEstadoConexion(id, estado) {
    const [result] = await db.execute(
      `UPDATE conexiones SET estado = ? WHERE id = ?`,
      [estado, id]
    );
    return result.affectedRows > 0;
  }

  // Bloquear guardando quien bloqueo
  static async bloquearConexion(id, bloqueadorId) {
    const [result] = await db.execute(
      `UPDATE conexiones SET estado = 'bloqueada', bloqueador_id = ? WHERE id = ?`,
      [bloqueadorId, id]
    );
    return result.affectedRows > 0;
  }

  static async eliminarConexion(id) {
    const [result] = await db.execute(
      `DELETE FROM conexiones WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  static async getConexionesAceptadas(userId) {
    const [rows] = await db.execute(
      `SELECT
         c.id,
         c.created_at AS conectado_desde,
         IF(c.solicitante_id = ?, c.receptor_id, c.solicitante_id) AS amigo_id,
         u.nombre,
         u.apellidos,
         u.foto
       FROM conexiones c
       JOIN users u
         ON u.id = IF(c.solicitante_id = ?, c.receptor_id, c.solicitante_id)
       WHERE (c.solicitante_id = ? OR c.receptor_id = ?)
         AND c.estado = 'aceptada'
       ORDER BY u.nombre`,
      [userId, userId, userId, userId]
    );
    return rows;
  }

  static async getSolicitudesPendientesRecibidas(userId) {
    const [rows] = await db.execute(
      `SELECT c.id, c.created_at, c.solicitante_id,
              u.nombre, u.apellidos, u.foto
       FROM conexiones c
       JOIN users u ON u.id = c.solicitante_id
       WHERE c.receptor_id = ? AND c.estado = 'pendiente'
       ORDER BY c.created_at DESC`,
      [userId]
    );
    return rows;
  }

  static async getSolicitudesEnviadas(userId) {
    const [rows] = await db.execute(
      `SELECT c.id, c.created_at, c.receptor_id,
              u.nombre, u.apellidos, u.foto
       FROM conexiones c
       JOIN users u ON u.id = c.receptor_id
       WHERE c.solicitante_id = ? AND c.estado = 'pendiente'
       ORDER BY c.created_at DESC`,
      [userId]
    );
    return rows;
  }

  static async getBloqueados(userId) {
    // Solo devuelve los bloqueos donde userId es el bloqueador
    const [rows] = await db.execute(
      `SELECT c.id,
              IF(c.solicitante_id = ?, c.receptor_id, c.solicitante_id) AS bloqueado_id,
              u.nombre, u.apellidos, u.foto
       FROM conexiones c
       JOIN users u
         ON u.id = IF(c.solicitante_id = ?, c.receptor_id, c.solicitante_id)
       WHERE (c.solicitante_id = ? OR c.receptor_id = ?)
         AND c.estado = 'bloqueada'
         AND c.bloqueador_id = ?`,
      [userId, userId, userId, userId, userId]
    );
    return rows;
  }

  static async contarConexiones(userId) {
    const [rows] = await db.execute(
      `SELECT COUNT(*) AS total FROM conexiones
       WHERE (solicitante_id = ? OR receptor_id = ?)
         AND estado = 'aceptada'`,
      [userId, userId]
    );
    return rows[0].total;
  }

  static async contarPendientes(userId) {
    const [rows] = await db.execute(
      `SELECT
         (SELECT COUNT(*) FROM conexiones
          WHERE receptor_id = ? AND estado = 'pendiente') +
         (SELECT COUNT(*) FROM recomendaciones_sociales
          WHERE destinatario_id = ? AND estado = 'pendiente') AS total`,
      [userId, userId]
    );
    return rows[0].total;
  }

  static async getCategoriasRealizadas(userId, limite = 30) {
    const [rows] = await db.execute(
      `SELECT DISTINCT a.category_id
       FROM activity_logs al
       JOIN activities a ON a.id = al.activity_id
       WHERE al.user_id = ?
       ORDER BY al.created_at DESC
       LIMIT ?`,
      [userId, limite]
    );
    return rows.map(r => r.category_id);
  }

  static async getUltimasEmociones(userId, limite = 7) {
    const [rows] = await db.execute(
      `SELECT valence, intensity
       FROM emotion_logs
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [userId, limite]
    );
    return rows;
  }

  // Versiones bulk: traen datos de todos los candidatos en 1 sola query
  static async getCategoriasRealizadasBulk(userIds) {
    if (userIds.length === 0) return {};
    const placeholders = userIds.map(() => '?').join(',');
    const [rows] = await db.execute(
      `SELECT DISTINCT al.user_id, a.category_id
       FROM activity_logs al
       JOIN activities a ON a.id = al.activity_id
       WHERE al.user_id IN (${placeholders})
      `,
      userIds
    );
    const mapa = {};
    for (const r of rows) {
      if (!mapa[r.user_id]) mapa[r.user_id] = new Set();
      mapa[r.user_id].add(r.category_id);
    }
    return mapa;
  }

  static async getUltimasEmocionesBulk(userIds) {
    if (userIds.length === 0) return {};
    const placeholders = userIds.map(() => '?').join(',');
    const [rows] = await db.execute(
      `SELECT user_id, valence, intensity
       FROM emotion_logs
       WHERE user_id IN (${placeholders})
       ORDER BY user_id, created_at DESC`,
      userIds
    );
    const mapa = {};
    for (const r of rows) {
      if (!mapa[r.user_id]) mapa[r.user_id] = [];
      if (mapa[r.user_id].length < 7) {
        mapa[r.user_id].push({ valence: r.valence, intensity: r.intensity });
      }
    }
    return mapa;
  }

  static async getUsuariosCandidatos(userId) {
    const [rows] = await db.execute(
      `SELECT u.id, u.nombre, u.apellidos, u.foto
       FROM users u
       WHERE u.id <> ?
         AND u.activo = 1
         AND u.admin = 0
         AND u.id NOT IN (
           SELECT IF(bloqueador_id = solicitante_id, receptor_id, solicitante_id)
           FROM conexiones
           WHERE estado = 'bloqueada'
             AND bloqueador_id = ?
             AND (solicitante_id = ? OR receptor_id = ?)
         )
         AND u.id NOT IN (
           SELECT bloqueador_id
           FROM conexiones
           WHERE estado = 'bloqueada'
             AND bloqueador_id IS NOT NULL
             AND bloqueador_id <> ?
             AND (solicitante_id = ? OR receptor_id = ?)
         )
       ORDER BY u.nombre`,
      [userId, userId, userId, userId, userId, userId, userId]
    );
    return rows;
  }

  static async buscarUsuariosPorNombre(userId, query) {
    const like = `%${query}%`;
    const [rows] = await db.execute(
      `SELECT u.id, u.nombre, u.apellidos, u.foto,
              COALESCE(c.estado, 'ninguna') AS estado_conexion,
              c.id AS conexion_id,
              c.solicitante_id
       FROM users u
       LEFT JOIN conexiones c
         ON (c.solicitante_id = u.id AND c.receptor_id = ?)
         OR (c.receptor_id = u.id AND c.solicitante_id = ?)
       WHERE u.id <> ?
         AND u.activo = 1
         AND u.admin = 0
         AND (u.nombre LIKE ? OR u.apellidos LIKE ?)
         AND u.id NOT IN (
           -- Excluir usuarios que yo he bloqueado
           SELECT IF(solicitante_id = ?, receptor_id, solicitante_id)
           FROM conexiones
           WHERE (solicitante_id = ? OR receptor_id = ?)
             AND estado = 'bloqueada'
             AND bloqueador_id = ?
         )
         AND u.id NOT IN (
           -- Excluir usuarios que me han bloqueado (devolver el bloqueador)
           SELECT bloqueador_id
           FROM conexiones
           WHERE estado = 'bloqueada'
             AND bloqueador_id IS NOT NULL
             AND bloqueador_id <> ?
             AND (solicitante_id = ? OR receptor_id = ?)
         )
       ORDER BY u.nombre
       LIMIT 20`,
      [userId, userId, userId, like, like, userId, userId, userId, userId, userId, userId, userId]
    );
    return rows;
  }

  static async crearRecomendacionSocial(remitenteId, destinatarioId, activityId, mensaje) {
    const [result] = await db.execute(
      `INSERT INTO recomendaciones_sociales
         (remitente_id, destinatario_id, activity_id, mensaje)
       VALUES (?, ?, ?, ?)`,
      [remitenteId, destinatarioId, activityId, mensaje || null]
    );
    return result.insertId;
  }

  static async getRecomendacionesSocialesRecibidas(userId) {
    const [rows] = await db.execute(
      `SELECT rs.id, rs.mensaje, rs.estado, rs.created_at,
              u.id AS remitente_id,
              u.nombre AS remitente_nombre,
              u.apellidos AS remitente_apellidos,
              u.foto AS remitente_foto,
              a.id AS activity_id,
              a.name AS activity_nombre,
              a.description, a.duration_minutes
       FROM recomendaciones_sociales rs
       JOIN users u ON u.id = rs.remitente_id
       JOIN activities a ON a.id = rs.activity_id
       WHERE rs.destinatario_id = ? AND rs.estado = 'pendiente'
       ORDER BY rs.created_at DESC`,
      [userId]
    );
    return rows;
  }

  static async getHistorialRecomendacionesSociales(userId) {
    const [rows] = await db.execute(
      `SELECT rs.id, rs.mensaje, rs.estado, rs.created_at,
              u.nombre AS remitente_nombre,
              u.apellidos AS remitente_apellidos,
              u.foto AS remitente_foto,
              a.name AS activity_nombre
       FROM recomendaciones_sociales rs
       JOIN users u ON u.id = rs.remitente_id
       JOIN activities a ON a.id = rs.activity_id
       WHERE rs.destinatario_id = ?
       ORDER BY rs.created_at DESC`,
      [userId]
    );
    return rows;
  }

  static async actualizarEstadoRecomendacionSocial(id, destinatarioId, estado) {
    const [result] = await db.execute(
      `UPDATE recomendaciones_sociales
       SET estado = ?
       WHERE id = ? AND destinatario_id = ?`,
      [estado, id, destinatarioId]
    );
    return result.affectedRows > 0;
  }

  static async getRecomendacionSocialById(id) {
    const [rows] = await db.execute(
      `SELECT * FROM recomendaciones_sociales WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }
}

module.exports = SocialDAO;