const express = require('express');
const router = express.Router();
const SocialController = require('../controllers/SocialController');
const isAuth = require('../middleware/usuario');

router.use(isAuth);

router.get('/social', SocialController.renderConexiones);
router.get('/buscar-usuarios', SocialController.renderBuscarUsuarios);
router.get('/notificaciones', SocialController.renderNotificaciones);

router.post('/api/social/solicitud', SocialController.enviarSolicitud);
router.post('/api/social/solicitud/:id/aceptar', SocialController.aceptarSolicitud);
router.post('/api/social/solicitud/:id/rechazar', SocialController.rechazarSolicitud);
router.delete('/api/social/conexion/:id', SocialController.desconectar);
router.post('/api/social/bloquear/:userId', SocialController.bloquear);
router.post('/api/social/desbloquear/:userId', SocialController.desbloquear);

router.get('/api/social/similares', SocialController.getSimilares);
router.get('/api/social/buscar', SocialController.buscarUsuarios);

router.post('/api/social/recomendar', SocialController.recomendarActividad);
router.get('/api/social/recomendaciones', SocialController.getRecomendacionesSociales);
router.get('/api/social/recomendaciones/historial', SocialController.getHistorialRecomendacionesSociales);
router.post('/api/social/recomendaciones/:id/aceptar', SocialController.aceptarRecomendacionSocial);
router.post('/api/social/recomendaciones/:id/rechazar', SocialController.rechazarRecomendacionSocial);

router.get('/api/social/pendientes/count', SocialController.contarPendientes);

module.exports = router;

