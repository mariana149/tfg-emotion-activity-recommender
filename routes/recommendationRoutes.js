const express = require('express');
const router = express.Router();
const RecommendationController = require('../controllers/RecommendationController');
const isAuth = require('../middleware/usuario');

router.use(isAuth);

router.post('/api/recomendacion', RecommendationController.getRecomendaciones);
router.get('/api/recomendacion/historial', RecommendationController.getHistorial);
router.get('/api/recomendacion/last', RecommendationController.getLast);
router.get('/api/recomendacion/pendientes', RecommendationController.getPendientes);
router.get('/api/recomendacion/sin-recomendacion', RecommendationController.getRealizadasSinRecomendacion);
router.post('/api/recomendacion/:id/aceptar', RecommendationController.aceptar);
router.post('/api/recomendacion/:id/rechazar', RecommendationController.rechazar);
router.get('/recomendaciones', RecommendationController.renderRecomendaciones);
router.get('/historial-recomendaciones', RecommendationController.renderHistorial);


module.exports = router;