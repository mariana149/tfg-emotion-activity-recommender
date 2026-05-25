const SavedActivityDAO = require('../dao/SavedActivityDAO');
const ActivityDAO      = require('../dao/ActivityDAO');
 
class SavedActivityService {
 
    static async saveActivity(userId, activityId) {
 
        if (!userId || !activityId)
            throw new Error('INVALID_DATA');
 
        const activity = await ActivityDAO.getById(activityId);
 
        if (!activity)
            throw new Error('ACTIVITY_NOT_FOUND');
 
        const exists = await SavedActivityDAO.exists(userId, activityId);
 
        if (exists)
            throw new Error('ACTIVITY_ALREADY_SAVED');

        const savedId = await SavedActivityDAO.saveActivity(userId, activityId);
 
        return savedId;
    }
 
    static async getSavedByUser(userId) {
 
        if (!userId)
            throw new Error('INVALID_USER');
 
        return await SavedActivityDAO.getSavedByUser(userId);
    }
 
    static async removeSavedActivity(userId, activityId) {
 
        if (!userId || !activityId)
            throw new Error('INVALID_DATA');

        const exists = await SavedActivityDAO.exists(userId, activityId);
 
        if (!exists)
            throw new Error('SAVED_ACTIVITY_NOT_FOUND');
 
        await SavedActivityDAO.removeSaved(userId, activityId);
 
        return true;
    }
 
}
 
module.exports = SavedActivityService;