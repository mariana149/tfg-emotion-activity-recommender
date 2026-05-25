const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');
const ActivitiesController = require('../controllers/ActivitiesController');
const esAdmin = require('../middleware/esAdmin');
const upload = require('../middleware/upload');
const isAuth = require('../middleware/usuario');

router.use(isAuth);

router.get('/admin/dashboard', esAdmin, AdminController.dashboard);

router.get('/admin/usuarios', esAdmin, AdminController.listarUsuarios);
router.get('/admin/usuarios/:id/stats', esAdmin, AdminController.getStatsUsuario);
router.post('/admin/usuarios/:id/activar', esAdmin, AdminController.activarUsuario);
router.post('/admin/usuarios/:id/desactivar', esAdmin, AdminController.desactivarUsuario);

router.get('/admin/actividades', esAdmin, AdminController.listarActividades);
router.get('/admin/actividades/crear', esAdmin, ActivitiesController.renderCrearActividad);
router.post('/admin/actividades/crear', esAdmin, ActivitiesController.apiCrear);
router.post('/admin/actividades/editar/:id', esAdmin, ActivitiesController.apiEditar);
router.get('/admin/actividades/propuestas', esAdmin, AdminController.listarPropuestas);
router.post('/admin/actividades/:id/desactivar', esAdmin, ActivitiesController.apiEliminar);
router.post('/admin/actividades/:id/activar', esAdmin, AdminController.activarActividad);
router.get('/admin/actividades/:id/stats', esAdmin, AdminController.getStatsActividad);

router.get('/admin/motor', esAdmin, AdminController.verMotor);
router.post('/admin/motor', esAdmin, AdminController.actualizarMotor);

router.get('/admin/perfil', esAdmin, AdminController.verPerfil);
router.post('/admin/perfil/datos', esAdmin, AdminController.actualizarDatos);
router.post('/admin/perfil/password', esAdmin, AdminController.cambiarPassword);

router.get('/admin/propuestas', esAdmin, AdminController.verPropuestas);
router.post('/admin/actividades/:id/publicar', esAdmin, AdminController.publicarActividad);
router.post('/admin/actividades/:id/rechazar', esAdmin, AdminController.rechazarActividad);

router.get('/admin/explotacion', esAdmin, AdminController.renderExplotacion);
router.get('/admin/explotacion/pdf', esAdmin, AdminController.descargarInformePDF);

module.exports = router;