const ActivitiesService = require('../services/ActivitiesService');

class UserActivitiesController {

    static async renderActividades(req, res) {
        res.render("usuario/actividades", { user: req.session.user });
    }

    static async renderMisActividades(req, res) {
        res.render("usuario/misActividades", { user: req.session.user });
    }

    static async apiGetTodas(req, res) {
        try {
            const actividades = await ActivitiesService.getAllActividades();
            res.json({ success: true, data: actividades });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async apiGetMisActividades(req, res) {
        try {
            const actividades = await ActivitiesService.getMisActividades(req.session.user.id);
            res.json({ success: true, data: actividades });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async apiCrearMia(req, res) {
        try {
            const { name, description, category_id, energy_level, duration_minutes } = req.body;
            const indoor = req.body.indoor ? 1 : 0;
            const individual = req.body.individual ? 1 : 0;
            await ActivitiesService.crearMia(
                req.session.user.id, name, description, category_id, energy_level, duration_minutes, indoor, individual
            );
            res.json({ success: true });
        } catch (error) {
            let message = 'Error al crear la actividad';
            if (error.message === 'EMPTY_FIELDS') message = 'Completa todos los campos obligatorios';
            res.status(400).json({ success: false, message });
        }
    }

    static async apiEditarMia(req, res) {
        try {
            const { name, description } = req.body;
            await ActivitiesService.editarMia(req.params.id, req.session.user.id, name, description);
            res.json({ success: true });
        } catch (error) {
            let message = 'Error al editar la actividad';
            if (error.message === 'EMPTY_FIELDS') message = 'El nombre y la descripcion es obligatorio';
            if (error.message === 'ACTIVITY_NOT_FOUND') message = 'Actividad no encontrada';
            if (error.message === 'NOT_AUTHORIZED') message = 'No tienes permisos para editar esta actividad';
            if (error.message === 'CANNOT_EDIT') message = 'Solo puedes editar actividades en borrador';
            res.status(400).json({ success: false, message });
        }
    }

    static async apiEliminarMia(req, res) {
        try {
            await ActivitiesService.eliminarMia(req.params.id, req.session.user.id);
            res.json({ success: true });
        } catch (error) {
            let message = 'Error al eliminar la actividad';
            if (error.message === 'ACTIVITY_NOT_FOUND') message = 'Actividad no encontrada';
            if (error.message === 'NOT_AUTHORIZED') message = 'No tienes permisos para eliminar esta actividad';
            if (error.message === 'CANNOT_DELETE') message = 'Solo puedes eliminar actividades en borrador';
            res.status(400).json({ success: false, message });
        }
    }

    static async apiProponer(req, res) {
        try {
            await ActivitiesService.proponer(req.params.id, req.session.user.id);
            res.json({ success: true });
        } catch (error) {
            let message = 'Error al proponer la actividad';
            if (error.message === 'ACTIVITY_NOT_FOUND') message = 'Actividad no encontrada';
            if (error.message === 'NOT_AUTHORIZED') message = 'No tienes permisos para proponer esta actividad';
            if (error.message === 'CANNOT_PROPOSE') message = 'Solo puedes proponer actividades en borrador';
            res.status(400).json({ success: false, message });
        }
    }
    static async apiActivarMia(req, res) {
        try {
            await ActivitiesService.activarMia(req.params.id, req.session.user.id);
            res.json({ success: true });
        } catch (error) {
            let message = 'Error al activar la actividad';
            if (error.message === 'ACTIVITY_NOT_FOUND') message = 'Actividad no encontrada';
            if (error.message === 'NOT_AUTHORIZED') message = 'No tienes permisos para activar esta actividad';
            res.status(400).json({ success: false, message });
        }
    }

    static async apiDesactivarMia(req, res) {
        try {
            await ActivitiesService.desactivarMia(req.params.id, req.session.user.id);
            res.json({ success: true });
        } catch (error) {
            let message = 'Error al desactivar la actividad';
            if (error.message === 'ACTIVITY_NOT_FOUND') message = 'Actividad no encontrada';
            if (error.message === 'NOT_AUTHORIZED') message = 'No tienes permisos para desactivar esta actividad';
            res.status(400).json({ success: false, message });
        }
    }
    static async apiCancelarPropuesta(req, res) {
        try {
            await ActivitiesService.cancelarPropuesta(req.params.id, req.session.user.id);
            res.json({ success: true });
        } catch (error) {
            let message = 'Error al cancelar la propuesta';
            if (error.message === 'ACTIVITY_NOT_FOUND') message = 'Actividad no encontrada';
            if (error.message === 'NOT_AUTHORIZED') message = 'No tienes permisos para cancelar esta propuesta';
            if (error.message === 'CANNOT_CANCEL') message = 'Solo puedes cancelar actividades en estado propuesta';
            res.status(400).json({ success: false, message });
        }
    }
}


module.exports = UserActivitiesController;