const SocialDAO = require('../dao/SocialDAO');
const SavedActivityDAO = require('../dao/SavedActivityDAO');

class SocialService {

  static async enviarSolicitud(solicitanteId, receptorId) {
    if (solicitanteId === receptorId) throw new Error('SELF_CONNECTION');
    const existente = await SocialDAO.getConexion(solicitanteId, receptorId);
    if (existente) {
      if (existente.estado === 'aceptada')  throw new Error('ALREADY_CONNECTED');
      if (existente.estado === 'pendiente') throw new Error('PENDING_REQUEST');
      if (existente.estado === 'bloqueada') throw new Error('BLOCKED');
    }
    return SocialDAO.crearSolicitud(solicitanteId, receptorId);
  }

  static async aceptarSolicitud(conexionId, receptorId) {
    const pendientes = await SocialDAO.getSolicitudesPendientesRecibidas(receptorId);
    const solicitud  = pendientes.find(s => s.id === parseInt(conexionId));
    if (!solicitud) throw new Error('REQUEST_NOT_FOUND');
    return SocialDAO.actualizarEstadoConexion(conexionId, 'aceptada');
  }

  static async rechazarSolicitud(conexionId, userId) {
    const recibidas = await SocialDAO.getSolicitudesPendientesRecibidas(userId);
    const enviadas = await SocialDAO.getSolicitudesEnviadas(userId);
    const esParte = [...recibidas, ...enviadas].some(s => s.id === parseInt(conexionId));
    if (!esParte) throw new Error('REQUEST_NOT_FOUND');
    return SocialDAO.eliminarConexion(conexionId);
  }

  static async desconectar(conexionId, userId) {
    const conexiones = await SocialDAO.getConexionesAceptadas(userId);
    const conexion = conexiones.find(c => c.id === parseInt(conexionId));
    if (!conexion) throw new Error('CONNECTION_NOT_FOUND');
    return SocialDAO.eliminarConexion(conexionId);
  }

  static async bloquear(bloqueadorId, bloqueadoId) {
    if (bloqueadorId === bloqueadoId) throw new Error('SELF_ACTION');
    const existente = await SocialDAO.getConexion(bloqueadorId, bloqueadoId);
    if (existente) return SocialDAO.bloquearConexion(existente.id, bloqueadorId);
    const id = await SocialDAO.crearSolicitud(bloqueadorId, bloqueadoId);
    return SocialDAO.bloquearConexion(id, bloqueadorId);
  }

  // Solo el bloqueador puede desbloquear
  static async desbloquear(bloqueadorId, bloqueadoId) {
    const conexion = await SocialDAO.getConexion(bloqueadorId, bloqueadoId);
    if (!conexion || conexion.estado !== 'bloqueada') throw new Error('NO_ACTIVE_BLOCK');
    if (conexion.bloqueador_id !== bloqueadorId) throw new Error('NOT_AUTHORIZED');
    return SocialDAO.eliminarConexion(conexion.id);
  }

  static async getConexiones(userId) {
    return SocialDAO.getConexionesAceptadas(userId);
  }

  static async getSolicitudes(userId) {
    const [recibidas, enviadas] = await Promise.all([
      SocialDAO.getSolicitudesPendientesRecibidas(userId),
      SocialDAO.getSolicitudesEnviadas(userId),
    ]);
    return { recibidas, enviadas };
  }

  static async getBloqueados(userId) {
    return SocialDAO.getBloqueados(userId);
  }

  static async buscarUsuarios(userId, query) {
    if (!query || query.trim().length < 2) return [];
    return SocialDAO.buscarUsuariosPorNombre(userId, query.trim());
  }

  static async contarConexiones(userId) {
    return SocialDAO.contarConexiones(userId);
  }

  static async contarPendientes(userId) {
    return SocialDAO.contarPendientes(userId);
  }

  /**
   * Jaccard: |A∩B| / |A∪B|  →  afinidad de categorías
   */
  static _jaccardCategorias(catsA, catsB) {
    if (catsA.length === 0 && catsB.length === 0) return 0;
    const setA = new Set(catsA);
    const setB = new Set(catsB);
    const interseccion = [...setA].filter(c => setB.has(c)).length;
    const union = new Set([...setA, ...setB]).size;
    return union === 0 ? 0 : interseccion / union;
  }

  /**
   * Similitud emocional: 1 - distancia euclidea normalizada
   * Campos: valence (-2 a 1), intensity (1-5)
   */
  static _similitudEmocional(emsA, emsB) {
    if (emsA.length === 0 || emsB.length === 0) return 0;
    const media = arr => arr.reduce((s, v) => s + v, 0) / arr.length;
    const dVal = (media(emsA.map(e => e.valence)) - media(emsB.map(e => e.valence))) / 4;
    const dInt = (media(emsA.map(e => e.intensity)) - media(emsB.map(e => e.intensity))) / 4;
    return Math.max(0, Math.min(1, 1 - Math.sqrt(dVal * dVal + dInt * dInt) / Math.sqrt(2)));
  }

  /**
   * Devuelve top 20 usuarios ordenados por similitud (score 0-100).
   * Score = 50% afinidad actividades + 50% estado emocional.
   */
  static async getUsuariosSimilares(userId) {
    const [candidatos, catsUsuario, emsUsuario, conexionesActuales, solicitudesEnviadas, solicitudesRecibidas] = await Promise.all([
      SocialDAO.getUsuariosCandidatos(userId),
      SocialDAO.getCategoriasRealizadas(userId),
      SocialDAO.getUltimasEmociones(userId),
      SocialDAO.getConexionesAceptadas(userId),
      SocialDAO.getSolicitudesEnviadas(userId),
      SocialDAO.getSolicitudesPendientesRecibidas(userId),
    ]);

    const idsConectados = new Set(conexionesActuales.map(c => c.amigo_id));
    const idsPendientes = new Set(solicitudesEnviadas.map(s => s.receptor_id));
    const mapaRecibidas = new Map(solicitudesRecibidas.map(s => [s.solicitante_id, s.id]));

    const ids = candidatos.map(c => c.id);
    const [catsMapa, emsMapa] = await Promise.all([
      SocialDAO.getCategoriasRealizadasBulk(ids),
      SocialDAO.getUltimasEmocionesBulk(ids),
    ]);

    const datos = candidatos.map(c => ({
      ...c,
      cats:[...(catsMapa[c.id] || new Set())],
      ems: emsMapa[c.id] || [],
    }));

    return datos
      .map(c => {
        const scoreAct = SocialService._jaccardCategorias(catsUsuario, c.cats);
        const scoreEmo = SocialService._similitudEmocional(emsUsuario, c.ems);
        const score = 0.5 * scoreAct + 0.5 * scoreEmo;
        return {
          id: c.id,
          nombre: c.nombre,
          apellidos: c.apellidos || '',
          foto: c.foto,
          score: Math.round(score * 100),
          scoreActividades: Math.round(scoreAct * 100),
          scoreEmocional: Math.round(scoreEmo * 100),
          yaConectado: idsConectados.has(c.id),
          solicitudEnviada: idsPendientes.has(c.id),
          solicitudRecibida: mapaRecibidas.has(c.id),
          conexionIdRecibida: mapaRecibidas.get(c.id) || null,
        };
      })
      .filter(c => c.score > 5)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  }

  static async recomendarActividad(remitenteId, destinatarioId, activityId, mensaje) {
    const conexion = await SocialDAO.getConexion(remitenteId, destinatarioId);
    if (!conexion || conexion.estado !== 'aceptada') {
      throw new Error('NOT_CONNECTED');
    }
    const recibidas = await SocialDAO.getRecomendacionesSocialesRecibidas(destinatarioId);
    const duplicado = recibidas.find(
      r => r.remitente_id === remitenteId && r.activity_id === parseInt(activityId)
    );
    if (duplicado) throw new Error('DUPLICATE_RECOMMENDATION');
    return SocialDAO.crearRecomendacionSocial(remitenteId, destinatarioId, activityId, mensaje);
  }

  static async aceptarRecomendacionSocial(recId, userId) {
    const rec = await SocialDAO.getRecomendacionSocialById(recId);
    if (!rec || rec.destinatario_id !== userId) throw new Error('NOT_AUTHORIZED');
    if (rec.estado !== 'pendiente') throw new Error('ALREADY_RESPONDED');

    await SocialDAO.actualizarEstadoRecomendacionSocial(recId, userId, 'aceptada');

    // Guardar actividad si no la tiene ya
    const yaGuardada = await SavedActivityDAO.exists(userId, rec.activity_id);
    if (!yaGuardada) {
      await SavedActivityDAO.saveActivity(userId, rec.activity_id);
    }

    return { yaGuardada: !!yaGuardada };
  }

  static async rechazarRecomendacionSocial(recId, userId) {
    const rec = await SocialDAO.getRecomendacionSocialById(recId);
    if (!rec || rec.destinatario_id !== userId) throw new Error('NOT_AUTHORIZED');
    if (rec.estado !== 'pendiente') throw new Error('ALREADY_RESPONDED');
    return SocialDAO.actualizarEstadoRecomendacionSocial(recId, userId, 'rechazada');
  }

  static async getRecomendacionesSocialesRecibidas(userId) {
    return SocialDAO.getRecomendacionesSocialesRecibidas(userId);
  }

  static async getHistorialRecomendacionesSociales(userId) {
    return SocialDAO.getHistorialRecomendacionesSociales(userId);
  }
}

module.exports = SocialService;