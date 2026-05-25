const EmotionDAO = require('../dao/EmotionDAO');

class EmotionService {

    static async registerEmotion(userId, emotion, intensity, energy_level, notes){

        if(!userId || !emotion || !intensity || !energy_level)
            throw new Error('EMPTY_FIELDS');

        if(intensity < 1 || intensity > 5)
            throw new Error('INVALID_INTENSITY');

        if(!['baja', 'media', 'alta'].includes(energy_level))
            throw new Error('INVALID_ENERGY');

        const emotionValence = {
            1: 1,   // Feliz
            2: 1,   // Calma
            3: 0,   // Neutral
            4: -1,  // Triste
            5: -1,  // Estrés
            6: -2   // Ansiedad
        };

        const valence = emotionValence[emotion];

        const emotionId = await EmotionDAO.addEmotion(
            userId,
            emotion,
            intensity,
            energy_level,
            valence,
            notes
        );

        return emotionId;
    }


    static async getEmotionById(id){

        if(!id)
            throw new Error('INVALID_ID');

        const emotion = await EmotionDAO.getEmotionById(id);

        if(!emotion)
            throw new Error('EMOTION_NOT_FOUND');

        return emotion;
    }


    static async getLastEmotion(userId){

        if(!userId)
            throw new Error('INVALID_USER');

        const emotion = await EmotionDAO.getLastEmotion(userId);

        return emotion;
    }


    static async getEmotionsByUser(userId){

        if(!userId)
            throw new Error('INVALID_USER');

        return await EmotionDAO.getEmotionsByUserId(userId);
    }


    static async getEmotionsByDateRange(userId, from, to){

        if(!userId || !from || !to)
            throw new Error('INVALID_DATA');

        return await EmotionDAO.getEmotionsByUserIdAndDateRange(
            userId,
            from,
            to
        );
    }
    
    static async getEmotionEvolution(userId){

        if(!userId)
        throw new Error("INVALID_USER");

        return await EmotionDAO.getEmotionEvolution(userId);
    }

    static async getEmotionDistribution(userId){

        if(!userId)
        throw new Error("INVALID_USER");

        return await EmotionDAO.getEmotionDistribution(userId);
    }

}

module.exports = EmotionService;