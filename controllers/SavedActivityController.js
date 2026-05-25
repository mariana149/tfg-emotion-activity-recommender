const SavedActivityService = require("../services/SavedActivityService");
 
class SavedActivityController {
 
    static async getSaved(req, res) {
        try {
            const userId = req.session.user.id;
            const data = await SavedActivityService.getSavedByUser(userId);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
 
    static async save(req, res) {
        try {
            const userId = req.session.user.id;
            const { activityId } = req.body;
            const savedId = await SavedActivityService.saveActivity(userId, activityId);
            res.json({ success: true, savedId });
        } catch (error) {
            let message = 'Error al guardar la actividad';
            if (error.message === 'INVALID_DATA') message = 'Datos inválidos';
            if (error.message === 'ACTIVITY_NOT_FOUND') message = 'Actividad no encontrada';
            if (error.message === 'ACTIVITY_ALREADY_SAVED') message = 'Ya tienes esta actividad guardada';
            res.status(400).json({ success: false, message });
        }
    }
 
    static async remove(req, res) {
        try {
            const userId = req.session.user.id;
            const { activityId } = req.body;
            await SavedActivityService.removeSavedActivity(userId, activityId);
            res.json({ success: true });
        } catch (error) {
            let message = 'Error al eliminar la actividad';
            if (error.message === 'INVALID_DATA') message = 'Datos inválidos';
            if (error.message === 'SAVED_ACTIVITY_NOT_FOUND') message = 'Actividad no encontrada en tu lista';
            res.status(400).json({ success: false, message });
        }
    }
 
}
 
module.exports = SavedActivityController;