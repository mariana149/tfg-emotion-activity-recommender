const express = require('express');
const router = express.Router();
const UserActivitiesController = require('../controllers/UserActivitiesController');
const SavedActivityController = require('../controllers/SavedActivityController');
const requireAuth = require('../middleware/usuario');

router.use(requireAuth);

router.get('/actividades', UserActivitiesController.renderActividades);
router.get('/mis-actividades', UserActivitiesController.renderMisActividades);
router.get('/api/actividades', UserActivitiesController.apiGetTodas);
router.get('/api/mis-actividades', UserActivitiesController.apiGetMisActividades);
router.post('/api/mis-actividades', UserActivitiesController.apiCrearMia);
router.put('/api/mis-actividades/:id', UserActivitiesController.apiEditarMia);
router.post('/api/mis-actividades/:id/eliminar', UserActivitiesController.apiEliminarMia);
router.post('/api/mis-actividades/:id/proponer', UserActivitiesController.apiProponer);
router.post('/api/mis-actividades/:id/activar', UserActivitiesController.apiActivarMia);
router.post('/api/mis-actividades/:id/desactivar', UserActivitiesController.apiDesactivarMia);
router.post('/api/mis-actividades/:id/cancelar', UserActivitiesController.apiCancelarPropuesta);

module.exports = router;