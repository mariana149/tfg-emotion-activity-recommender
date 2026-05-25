const SocialService = require('../services/SocialService');

class SocialController {

  static async renderConexiones(req, res) {
    try {
      const userId = req.session.user.id;
      const [conexiones, solicitudes, bloqueados] = await Promise.all([
        SocialService.getConexiones(userId),
        SocialService.getSolicitudes(userId),
        SocialService.getBloqueados(userId),
      ]);
      res.render('usuario/social/conexiones', {
        currentPage: 'social',
        conexiones,
        solicitudesRecibidas: solicitudes.recibidas,
        solicitudesEnviadas: solicitudes.enviadas,
        bloqueados,
        user: req.session.user,
      });
    } catch (err) {
      console.error(err);
      req.session.flash = { tipo: 'danger', mensaje: 'Error al cargar conexiones' };
      res.redirect('/inicio');
    }
  }

  static async renderBuscarUsuarios(req, res) {
    try {
      res.render('usuario/social/buscarUsuarios', {
        currentPage: 'buscar-usuarios',
        user: req.session.user,
      });
    } catch (err) {
      console.error(err);
      res.redirect('/inicio');
    }
  }

  static async renderNotificaciones(req, res) {
    try {
      const userId = req.session.user.id;
      const [solicitudes, recomendaciones] = await Promise.all([
        SocialService.getSolicitudes(userId),
        SocialService.getRecomendacionesSocialesRecibidas(userId),
      ]);
      res.render('usuario/social/notificaciones', {
        currentPage: 'notificaciones',
        solicitudesRecibidas: solicitudes.recibidas,
        recomendaciones,
        user: req.session.user,
      });
    } catch (err) {
      console.error(err);
      res.redirect('/inicio');
    }
  }

  static async enviarSolicitud(req, res) {
    try {
      const { receptorId } = req.body;
      if (!receptorId) return res.status(400).json({ success: false, mensaje: 'Falta receptorId' });
      await SocialService.enviarSolicitud(req.session.user.id, parseInt(receptorId));
      res.json({ success: true, mensaje: 'Solicitud enviada' });
    } catch (err) {
      let mensaje = 'Error al enviar la solicitud';
      if (err.message === 'SELF_CONNECTION') mensaje = 'No puedes conectarte contigo mismo';
      if (err.message === 'ALREADY_CONNECTED') mensaje = 'Ya estáis conectados';
      if (err.message === 'PENDING_REQUEST') mensaje = 'Ya existe una solicitud pendiente';
      if (err.message === 'BLOCKED') mensaje = 'No es posible conectar con este usuario';
      res.status(400).json({ success: false, mensaje });
    }
  }

  static async aceptarSolicitud(req, res) {
    try {
      await SocialService.aceptarSolicitud(req.params.id, req.session.user.id);
      res.json({ success: true, mensaje: 'Solicitud aceptada' });
    } catch (err) {
      let mensaje = 'Error al aceptar la solicitud';
      if (err.message === 'REQUEST_NOT_FOUND') mensaje = 'Solicitud no encontrada o no autorizada';
      res.status(400).json({ success: false, mensaje });
    }
  }

  static async rechazarSolicitud(req, res) {
    try {
      await SocialService.rechazarSolicitud(req.params.id, req.session.user.id);
      res.json({ success: true, mensaje: 'Solicitud eliminada' });
    } catch (err) {
      let mensaje = 'Error al rechazar la solicitud';
      if (err.message === 'REQUEST_NOT_FOUND') mensaje = 'Solicitud no encontrada o no autorizada';
      res.status(400).json({ success: false, mensaje });
    }
  }

  static async desconectar(req, res) {
    try {
      await SocialService.desconectar(req.params.id, req.session.user.id);
      res.json({ success: true, mensaje: 'Desconectado correctamente' });
    } catch (err) {
      let mensaje = 'Error al desconectar';
      if (err.message === 'CONNECTION_NOT_FOUND') mensaje = 'Conexión no encontrada o no autorizada';
      res.status(400).json({ success: false, mensaje });
    }
  }

  static async bloquear(req, res) {
    try {
      await SocialService.bloquear(req.session.user.id, parseInt(req.params.userId));
      res.json({ success: true, mensaje: 'Usuario bloqueado' });
    } catch (err) {
      let mensaje = 'Error al bloquear';
      if (err.message === 'SELF_ACTION') mensaje = 'Acción no permitida';
      res.status(400).json({ success: false, mensaje });
    }
  }

  static async desbloquear(req, res) {
    try {
      await SocialService.desbloquear(req.session.user.id, parseInt(req.params.userId));
      res.json({ success: true, mensaje: 'Usuario desbloqueado' });
    } catch (err) {
      let mensaje = 'Error al desbloquear';
      if (err.message === 'NO_ACTIVE_BLOCK') mensaje = 'No hay bloqueo activo';
      if (err.message === 'NOT_AUTHORIZED') mensaje = 'No autorizado para desbloquear';
      res.status(400).json({ success: false, mensaje });
    }
  }

  static async getSimilares(req, res) {
    try {
      const similares = await SocialService.getUsuariosSimilares(req.session.user.id);
      res.json({ success: true, data: similares });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, mensaje: 'Error calculando similitud' });
    }
  }

  static async buscarUsuarios(req, res) {
    try {
      const usuarios = await SocialService.buscarUsuarios(req.session.user.id, req.query.q);
      res.json({ success: true, data: usuarios });
    } catch (err) {
      res.status(500).json({ success: false, mensaje: err.message });
    }
  }

  static async recomendarActividad(req, res) {
    try {
      const { destinatarioId, activityId, mensaje } = req.body;
      if (!destinatarioId || !activityId) {
        return res.status(400).json({ success: false, mensaje: 'Faltan datos obligatorios' });
      }
      await SocialService.recomendarActividad(
        req.session.user.id, parseInt(destinatarioId), parseInt(activityId), mensaje
      );
      res.json({ success: true, mensaje: 'Actividad recomendada correctamente' });
    } catch (err) {
      let mensaje = 'Error al recomendar la actividad';
      if (err.message === 'NOT_CONNECTED') mensaje = 'Solo puedes recomendar actividades a usuarios conectados';
      if (err.message === 'DUPLICATE_RECOMMENDATION') mensaje = 'Ya has recomendado esta actividad y está pendiente de respuesta';
      res.status(400).json({ success: false, mensaje });
    }
  }

  static async getRecomendacionesSociales(req, res) {
    try {
      const data = await SocialService.getRecomendacionesSocialesRecibidas(req.session.user.id);
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, mensaje: err.message });
    }
  }

  static async getHistorialRecomendacionesSociales(req, res) {
    try {
      const data = await SocialService.getHistorialRecomendacionesSociales(req.session.user.id);
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, mensaje: err.message });
    }
  }

  static async aceptarRecomendacionSocial(req, res) {
    try {
      const { yaGuardada } = await SocialService.aceptarRecomendacionSocial(parseInt(req.params.id), req.session.user.id);
      const mensaje = yaGuardada
        ? 'Recomendación aceptada · Ya tenías esta actividad guardada'
        : 'Recomendación aceptada · Actividad guardada en tu lista';
      res.json({ success: true, mensaje, yaGuardada });
    } catch (err) {
      let mensaje = 'Error al aceptar la recomendación';
      if (err.message === 'NOT_AUTHORIZED') mensaje = 'No autorizado';
      if (err.message === 'ALREADY_RESPONDED') mensaje = 'Esta recomendación ya fue respondida';
      res.status(400).json({ success: false, mensaje });
    }
  }

  static async rechazarRecomendacionSocial(req, res) {
    try {
      await SocialService.rechazarRecomendacionSocial(parseInt(req.params.id), req.session.user.id);
      res.json({ success: true, mensaje: 'Recomendación rechazada' });
    } catch (err) {
      let mensaje = 'Error al rechazar la recomendación';
      if (err.message === 'NOT_AUTHORIZED') mensaje = 'No autorizado';
      if (err.message === 'ALREADY_RESPONDED') mensaje = 'Esta recomendación ya fue respondida';
      res.status(400).json({ success: false, mensaje });
    }
  }

  static async contarConexiones(req, res) {
    try {
      const total = await SocialService.contarConexiones(req.session.user.id);
      res.json({ success: true, data: { total } });
    } catch (err) {
      res.status(500).json({ success: false, mensaje: err.message });
    }
  }

  static async contarPendientes(req, res) {
    try {
      const total = await SocialService.contarPendientes(req.session.user.id);
      res.json({ success: true, total });
    } catch (err) {
      res.status(500).json({ success: false, mensaje: err.message });
    }
  }
}

module.exports = SocialController;