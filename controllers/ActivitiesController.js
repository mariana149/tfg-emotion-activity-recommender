const ActivitiesService    = require("../services/ActivitiesService");

class ActivitiesController {

    static async renderActividadesAdmin(req, res) {
        res.render("actividades/adminActividades", { user: req.session.user });
    }

    static async renderCrearActividad(req, res) {
        res.render("actividades/crearActividad", { user: req.session.user, error: null });
    }

    static async renderEditarActividad(req, res) {
        try {
            const actividad = await ActivitiesService.getActivity(req.params.id);
            res.render("actividades/editarActividad", { user: req.session.user, actividad, error: null });
        } catch (error) {
            res.status(404).send("Actividad no encontrada");
        }
    }

    static async apiCrear(req, res) {
        try {
            const { name, description, category_id, energy_level, duration_minutes } = req.body;
            const indoor = req.body.indoor ? 1 : 0;
            const individual = req.body.individual ? 1 : 0;

            await ActivitiesService.createActivity(
                name, description, category_id, energy_level, duration_minutes,
                indoor, individual, req.session.user.id, 'publicada'
            );
            res.json({ success: true });
        } catch (error) {
            let message = 'Error al crear la actividad';
            if (error.message === 'EMPTY_FIELDS') message = 'Completa todos los campos obligatorios';
            res.status(400).json({ success: false, message });
        }
    }

    static async apiEditar(req, res) {
        try {
            const { name, description } = req.body;
            await ActivitiesService.updateActivity(req.params.id, name, description);
            res.json({ success: true });
        } catch (error) {
            let message = 'Error al editar la actividad';
            if (error.message === 'EMPTY_FIELDS') message = 'El nombre es obligatorio';
            if (error.message === 'ACTIVITY_NOT_FOUND') message = 'Actividad no encontrada';
            res.status(400).json({ success: false, message });
        }
    }

    static async apiEliminar(req, res) {
        try {
            await ActivitiesService.deleteActivity(req.params.id);
            res.json({ success: true });
        } catch (error) {
            let message = 'Error al eliminar la actividad';
            if (error.message === 'INVALID_ID') message = 'ID no válido';
            if (error.message === 'ACTIVITY_NOT_FOUND') message = 'Actividad no encontrada';
            res.status(400).json({ success: false, message });
        }
    }

}

module.exports = ActivitiesController;
