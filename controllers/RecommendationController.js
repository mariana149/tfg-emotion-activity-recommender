const RecommendationService = require("../services/RecommendationService");
const ActivityLogService = require('../services/ActivityLogService');

class RecommendationController {

    static async getRecomendaciones(req, res) {
        
        try {
            const userId = req.session.user.id;
            const emotionData = req.body;

            if (!emotionData.emotion || !emotionData.intensity || !emotionData.energy_level)
                return res.status(400).json({ success: false, message: 'Completa todos los campos' });

            const result = await RecommendationService.getRecomendaciones(userId, emotionData);
            res.json({ success: true, data: result });

        } catch (error) {
            let message = "Error al generar la recomendación";
            if (error.message === "NO_ACTIVITIES") message = "No hay actividades disponibles";
            if (error.message === "INVALID_USER") message = "Usuario no válido";
            if (error.message === "NO_EMOTION_DATA") message = "Faltan datos emocionales";
            res.status(400).json({ success: false, message });
        }
    }

    static async aceptar(req, res) {
        try {
            await RecommendationService.aceptarRecomendacion(req.params.id);
            res.json({ success: true });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    static async rechazar(req, res) {
        try {
            await RecommendationService.rechazarRecomendacion(req.params.id);
            res.json({ success: true });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    static async getHistorial(req, res) {
        try {
            const historial = await RecommendationService.getHistorial(req.session.user.id);
            res.json({ success: true, data: historial });
        } catch (err) {
            res.status(500).json({ success: false });
        }
    }

    static async getLast(req, res) {
        try {
            const last = await RecommendationService.getLastRecommendation(req.session.user.id);
            res.json({ success: true, data: last });
        } catch (err) {
            res.status(500).json({ success: false });
        }
    }

    static async renderRecomendaciones(req, res) {
        res.render('usuario/recomendaciones', { user: req.session.user });
    }

    static async getRealizadasSinRecomendacion(req, res) {
        try {
            const data = await ActivityLogService.getRealizadasSinRecomendacion(req.session.user.id);
            res.json({ success: true, data });
        } catch (err) {
            res.status(500).json({ success: false });
        }
    }

    static async renderHistorial(req, res) {
        if (!req.session.user) return res.redirect('/login');
        res.render('usuario/historialRecomendaciones', { user: req.session.user });
    }
    
    static async getPendientes(req, res) {
        try {
            const data = await RecommendationService.getPendientes(req.session.user.id);
            res.json({ success: true, data });
        } catch (err) {
            res.status(500).json({ success: false });
        }
    }
}

module.exports = RecommendationController;