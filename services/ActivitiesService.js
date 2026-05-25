const ActivityDAO = require('../dao/ActivityDAO');

class ActivityService {

    static async getActivity(id) {

        if (!id)
            throw new Error('INVALID_ID');

        const activity = await ActivityDAO.getById(id);

        if (!activity)
            throw new Error('ACTIVITY_NOT_FOUND');

        return activity;
    }

    static async getAllActivities() {
        return await ActivityDAO.getAll();
    }

    static async createActivity(
        name, description, category_id, energy_level,
        duration_minutes, indoor, individual, userId, estado = 'propuesta'
    ) {
        if (!name || !category_id || !energy_level)
            throw new Error('EMPTY_FIELDS');

        const id = await ActivityDAO.createActivity(
            name, description, category_id, energy_level,
            duration_minutes, indoor, individual, userId, estado
        );

        return id;
    }

    static async updateActivity(id, name, description){

        if(!id || !name)
            throw new Error('EMPTY_FIELDS');

        const activity = await ActivityDAO.getById(id);

        if(!activity)
            throw new Error('ACTIVITY_NOT_FOUND');

        const updated = await ActivityDAO.updateActivity(
            id,
            name,
            description
        );

        return updated;
    }

    static async deleteActivity(id){

        if(!id)
            throw new Error('INVALID_ID');

        const activity = await ActivityDAO.getById(id);

        if(!activity)
            throw new Error('ACTIVITY_NOT_FOUND');

        await ActivityDAO.deleteActivity(id);

        return true;
    }
    static async activateActivity(id) {
        if (!id) throw new Error('INVALID_DATA');
        return await ActivityDAO.activateActivity(id);
    }
    static async getMisActividades(userId) {
        return await ActivityDAO.getByUser(userId);
    }

    static async crearMia(userId, name, description, category_id, energy_level, duration_minutes, indoor, individual) {
        if (!name || !energy_level || !duration_minutes || !category_id) throw new Error('EMPTY_FIELDS');
        return await ActivityDAO.createByUser(userId, name, description, category_id, energy_level, duration_minutes, indoor, individual);
    }

    static async editarMia(id, userId, name, description) {
        if (!name) throw new Error('EMPTY_FIELDS');
        const actividad = await ActivityDAO.getById(id);
        if (!actividad) throw new Error('ACTIVITY_NOT_FOUND');
        if (actividad.created_by !== userId) throw new Error('NOT_AUTHORIZED');
        if (actividad.estado !== 'borrador') throw new Error('CANNOT_EDIT');
        return await ActivityDAO.updateActivity(id, name, description);
    }

    static async eliminarMia(id, userId) {
        const actividad = await ActivityDAO.getById(id);
        if (!actividad) throw new Error('ACTIVITY_NOT_FOUND');
        if (actividad.created_by !== userId) throw new Error('NOT_AUTHORIZED');
        if (actividad.estado !== 'borrador') throw new Error('CANNOT_DELETE');
        return await ActivityDAO.deleteById(id);
    }

    static async proponer(id, userId) {
        const actividad = await ActivityDAO.getById(id);
        if (!actividad) throw new Error('ACTIVITY_NOT_FOUND');
        if (actividad.created_by !== userId) throw new Error('NOT_AUTHORIZED');
        if (actividad.estado !== 'borrador') throw new Error('CANNOT_PROPOSE');
        return await ActivityDAO.updateEstado(id, 'propuesta');
    }
    static async getAllActividades() {
        return await ActivityDAO.getAllPublicadas();
    }
    static async activarMia(id, userId) {
        const actividad = await ActivityDAO.getById(id);
        if (!actividad) throw new Error('ACTIVITY_NOT_FOUND');
        if (actividad.created_by !== userId) throw new Error('NOT_AUTHORIZED');
        return await ActivityDAO.activateActivity(id);
    }

    static async desactivarMia(id, userId) {
        const actividad = await ActivityDAO.getById(id);
        if (!actividad) throw new Error('ACTIVITY_NOT_FOUND');
        if (actividad.created_by !== userId) throw new Error('NOT_AUTHORIZED');
        return await ActivityDAO.deleteActivity(id);
    }

    static async cancelarPropuesta(id, userId) {
        const actividad = await ActivityDAO.getById(id);
        if (!actividad) throw new Error('ACTIVITY_NOT_FOUND');
        if (actividad.created_by !== userId) throw new Error('NOT_AUTHORIZED');
        if (actividad.estado !== 'propuesta') throw new Error('CANNOT_CANCEL');
        return await ActivityDAO.updateEstado(id, 'borrador');
    }
    static async getPropuestas() {
        return await ActivityDAO.getByEstado('propuesta');
    }

    static async publicar(id) {
        const actividad = await ActivityDAO.getById(id);
        if (!actividad) throw new Error('ACTIVITY_NOT_FOUND');
        if (actividad.estado !== 'propuesta') throw new Error('CANNOT_PUBLISH');
        return await ActivityDAO.updateEstado(id, 'publicada');
    }
    static async rechazar(id) {
        const actividad = await ActivityDAO.getById(id);
        if (!actividad) throw new Error('ACTIVITY_NOT_FOUND');
        if (actividad.estado !== 'propuesta') throw new Error('CANNOT_REJECT');
        return await ActivityDAO.updateEstado(id, 'borrador');
    }
}

module.exports = ActivityService;