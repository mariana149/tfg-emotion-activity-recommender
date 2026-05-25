const ActivityLogService = require('../services/ActivityLogService');

class ActivityLogController {

    static async startActivity(req, res) {
        try {
            const userId = req.session.user.id;
            const { activity_id, recommendation_id, emotion_before_id, emotion_after_id, rating } = req.body;
            const logId = await ActivityLogService.startActivity(
                userId,
                activity_id,
                recommendation_id || null,
                emotion_before_id || null,
                emotion_after_id || null,
                rating || null
            );

            res.json({ success: true, logId });
        } catch (error) {
            let message = 'Error al registrar la actividad';
            if (error.message === 'INVALID_DATA') message = 'Datos inválidos';
            if (error.message === 'ACTIVITY_NOT_FOUND') message = 'Actividad no encontrada';
            if (error.message === 'EMOTION_NOT_FOUND') message = 'Emoción no encontrada';
            if (error.message === 'INVALID_RATING') message = 'La valoración debe estar entre 1 y 5';
            res.status(400).json({ success: false, message });
        }
    }

    static async setEmotionBefore(req, res) {

        try {

            const { log_id, emotion_id } = req.body;

            await ActivityLogService.setEmotionBefore(
                log_id,
                emotion_id
            );

            res.json({
                success: true
            });

        } catch (error) {

            let message = 'Error al registrar la emoción previa';
            if (error.message === 'INVALID_DATA') message = 'Datos inválidos';
            if (error.message === 'EMOTION_NOT_FOUND') message = 'Emoción no encontrada';
            res.status(400).json({ success: false, message });

        }
    }

    static async setEmotionAfter(req, res) {

        try {

            const { log_id, emotion_id } = req.body;

            await ActivityLogService.setEmotionAfter(
                log_id,
                emotion_id
            );

            res.json({
                success: true
            });

        } catch (error) {

            let message = 'Error al registrar la emoción posterior';
            if (error.message === 'INVALID_DATA') message = 'Datos inválidos';
            if (error.message === 'EMOTION_NOT_FOUND') message = 'Emoción no encontrada';
            res.status(400).json({ success: false, message });

        }
    }

    static async getActivitiesByUser(req, res) {

        try {

            const userId = req.session.user.id;

            const logs = await ActivityLogService.getActivitiesByUser(userId);

            res.json({
                success: true,
                data: logs
            });

        } catch (error) {
            let message = 'Error al obtener actividades';
            if (error.message === 'INVALID_USER') message = 'Usuario no válido';
            res.status(500).json({ success: false, message });

        }
    }

    static async getLogById(req, res) {

        try {

            const log = await ActivityLogService.getLogById(
                req.params.id
            );

            res.json({
                success: true,
                data: log
            });

        } catch (error) {

            let message = 'Error al obtener el registro';
            if (error.message === 'INVALID_ID') message = 'ID no válido';
            if (error.message === 'LOG_NOT_FOUND') message = 'Registro no encontrado';
            res.status(404).json({ success: false, message });

        }
    }

    static async setRating(req, res) {
        try {
            const { log_id, rating } = req.body;
            await ActivityLogService.setRating(log_id, rating);
            res.json({ success: true });
        } catch (error) {
            let message = 'Error al guardar la valoración';
            if (error.message === 'INVALID_DATA') message = 'Datos inválidos';
            if (error.message === 'INVALID_RATING') message = 'La valoración debe estar entre 1 y 5';
            res.status(400).json({ success: false, message });
        }
    }
}

module.exports = ActivityLogController;