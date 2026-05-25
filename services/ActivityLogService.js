const ActivityLogDAO = require('../dao/ActivityLogDAO');
const ActivityDAO = require('../dao/ActivityDAO');
const EmotionDAO = require('../dao/EmotionDAO');

class ActivityLogService {

    static async startActivity(userId, activityId, recommendationId = null, emotionBeforeId = null, emotionAfterId = null, rating = null) {
        if (!userId || !activityId) throw new Error('INVALID_DATA');

        const activity = await ActivityDAO.getById(activityId);
        if (!activity) throw new Error('ACTIVITY_NOT_FOUND');

        if (emotionBeforeId) {
            const emotionBefore = await EmotionDAO.getEmotionById(emotionBeforeId);
            if (!emotionBefore) throw new Error('EMOTION_NOT_FOUND');
        }

        if (emotionAfterId) {
            const emotionAfter = await EmotionDAO.getEmotionById(emotionAfterId);
            if (!emotionAfter) throw new Error('EMOTION_NOT_FOUND');
        }

        if (rating && (rating < 1 || rating > 5)) throw new Error('INVALID_RATING');

        const logId = await ActivityLogDAO.startActivity(
            userId, activityId, recommendationId, emotionBeforeId, emotionAfterId, rating
        );
        return logId;
    }


    static async setEmotionBefore(logId, emotionId){

        if(!logId || !emotionId)
            throw new Error('INVALID_DATA');

        const emotion = await EmotionDAO.getEmotionById(emotionId);

        if(!emotion)
            throw new Error('EMOTION_NOT_FOUND');

        return await ActivityLogDAO.setEmotionBefore(
            logId,
            emotionId
        );
    }


    static async setEmotionAfter(logId, emotionId){

        if(!logId || !emotionId)
            throw new Error('INVALID_DATA');

        const emotion = await EmotionDAO.getEmotionById(emotionId);

        if(!emotion)
            throw new Error('EMOTION_NOT_FOUND');

        return await ActivityLogDAO.setEmotionAfter(
            logId,
            emotionId
        );
    }


    static async getActivitiesByUser(userId){

        if(!userId)
            throw new Error('INVALID_USER');

        return await ActivityLogDAO.getActivitiesByUser(userId);
    }


    static async getLogById(id){

        if(!id)
            throw new Error('INVALID_ID');

        const log = await ActivityLogDAO.getLogById(id);

        if(!log)
            throw new Error('LOG_NOT_FOUND');

        return log;
    }
    static async setRating(logId, rating) {
        if (!logId || !rating) throw new Error('INVALID_DATA');
        if (rating < 1 || rating > 5) throw new Error('INVALID_RATING');
        return await ActivityLogDAO.setRating(logId, rating);
    }
    static async getRealizadasSinRecomendacion(userId) {
    if (!userId) throw new Error('INVALID_USER');
        return await ActivityLogDAO.getRealizadasSinRecomendacion(userId);
    }
}

module.exports = ActivityLogService;