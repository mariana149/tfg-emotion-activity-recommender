const ActivityDAO       = require('../dao/ActivityDAO');
const RecommendationDAO = require('../dao/RecommendationDAO');
const EmotionService = require('./EmotionService');

const energyMap   = { 'baja': 1, 'media': 2, 'alta': 3 };
const EMO_CAT_COMPAT = {
    1: { 1: 1, 2: 3, 3: 2, 4: 3, 5: 1, 6: 2 }, // Feliz    → Actividad física, Social
    2: { 1: 3, 2: 1, 3: 2, 4: 1, 5: 2, 6: 3 }, // Calma    → Relajación, Naturaleza
    3: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 }, // Neutral  → todas por igual
    4: { 1: 1, 2: 1, 3: 3, 4: 3, 5: 2, 6: 1 }, // Triste   → Social, Creatividad
    5: { 1: 3, 2: 1, 3: 2, 4: 1, 5: 2, 6: 3 }, // Estrés   → Relajación, Naturaleza
    6: { 1: 3, 2: 0, 3: 1, 4: 1, 5: 3, 6: 2 }, // Ansiedad → Relajación, Bienestar
};

class RecommendationService {

    static async getRecomendaciones(userId, emotionData) {
        if (!userId) throw new Error('INVALID_USER');
        if (!emotionData) throw new Error('NO_EMOTION_DATA');

        const { emotion, intensity, energy_level } = emotionData;
        const energia = energyMap[energy_level] || 2;

        // Registrar la emoción actual
        const emotionId = await EmotionService.registerEmotion(
            userId, emotion, intensity, energy_level, ''
        );

        // Cargar actividades y configuración
        const activities = await ActivityDAO.getAllPublicadas();
        if (!activities || activities.length === 0) throw new Error('NO_ACTIVITIES');

        const config = await RecommendationDAO.getConfig();

        // Precarga de datos (evita N queries en bucle) 
        const historialRecs = await RecommendationDAO.getUserRecommendations(userId);
        const categoriasFav = await RecommendationDAO.getCategoriasFavoritasByUser(userId);
        const impactosPersonales = await RecommendationDAO.getRatingsPersonalesByUser(userId);
        const impactosGlobales = await RecommendationDAO.getRatingsGlobales();
        const catFavIds = new Set(categoriasFav.map(c => c.category_id));
        const ratingsPersonales = await RecommendationDAO.getRatingsPersonalesBulk(userId);
        const ratingsGlobales = await RecommendationDAO.getRatingsGlobalesBulk();

        const scored = [];

        for (const activity of activities) {

            // COMPATIBILIDAD EMOCIONAL
            const emoScore = (EMO_CAT_COMPAT[emotion]?.[activity.category_id] ?? 1);

            // COMPATIBILIDAD ENERGÍA 
            const actEnergia = energyMap[activity.energy_level] || 2;
            const energyDiff = Math.abs(actEnergia - energia);
            const energyScore = 3 - energyDiff;

            // HISTORIAL PERSONAL 
            let personalScore = 0;
            const impactoPersonal = impactosPersonales[activity.id];
            if (impactoPersonal && impactoPersonal.total >= 2) {
                const imp = impactoPersonal.impacto_medio;
                personalScore = imp > 2  ? 3  :
                                imp > 0  ? 2  :
                                imp === 0 ? 0 : -1;
            }
            // Penalizar si fue rechazada como recomendación
            const rechazadas = historialRecs.filter(r =>
                r.activity_id === activity.id && r.aceptada === 0
            );
            if (rechazadas.length > 0) personalScore -= 2;

            const ratingP = ratingsPersonales[activity.id];
            if (ratingP && ratingP.total >= 2) {
                if (ratingP.media >= 4) personalScore += 2;
                else if (ratingP.media <= 2) personalScore -= 1;
            }
            // HISTORIAL GLOBAL 
            let globalScore = 0;
            const impactoGlobal = impactosGlobales[activity.id];
            if (impactoGlobal && impactoGlobal.total >= 3) {
                const imp = impactoGlobal.impacto_medio;
                globalScore = imp > 2  ? 2  :
                            imp > 0  ? 1  :
                            imp === 0 ? 0 : -1;
            }
            const ratingG = ratingsGlobales[activity.id];
            if (ratingG && ratingG.total >= 3) {
                if (ratingG.media >= 4) globalScore += 2;
                else if (ratingG.media <= 2) globalScore -= 1;
            }
            //  AFFINITY (categorías favoritas) 
            const affinityScore = catFavIds.has(activity.category_id) ? 2 : 0;

            //  EXPLORACIÓN
            const vecesRecomendada = historialRecs.filter(r =>
                r.activity_id === activity.id
            ).length;
            const explorationScore = vecesRecomendada === 0
                ? 2
                : -(vecesRecomendada * 0.5);

            // SCORE FINAL con pesos de config
            let sumaPesos = 
                config.emotion_weight +
                config.energy_weight +
                config.affinity +
                config.exploration;

            if (impactoPersonal && impactoPersonal.total >= 2) 
                sumaPesos += config.personal_history;

            if (impactoGlobal && impactoGlobal.total >= 3) 
                sumaPesos += config.global_history;

            const score =
                (config.emotion_weight / sumaPesos) * emoScore +
                (config.energy_weight / sumaPesos) * energyScore +
                (config.personal_history / sumaPesos) * personalScore +
                (config.global_history / sumaPesos) * globalScore +
                (config.affinity / sumaPesos) * affinityScore +
                (config.exploration / sumaPesos) * explorationScore;

            //  RAZÓN 
            let reason = '';
            if (impactoPersonal?.total >= 2 && impactoPersonal.impacto_medio > 0)
                reason = 'Te ha ayudado emocionalmente en el pasado';
            else if (energyDiff === 0)
                reason = 'Coincide con tu nivel de energía';
            else if ((EMO_CAT_COMPAT[emotion]?.[activity.category_id] ?? 0) === 3)
                reason = 'Encaja con tu estado emocional actual';
            else if (vecesRecomendada === 0)
                reason = 'Algo nuevo para ti';
            else
                reason = 'Recomendada por el sistema';

            scored.push({ activity, score, reason });
        }

        // Ordenar y coger las 3 mejores
        scored.sort((a, b) => b.score - a.score);
        const top3 = scored.slice(0, 3);

        // Guardar en BD
        const ids = await RecommendationDAO.saveRecomendaciones(userId, top3.map(r => ({
            activity: r.activity,
            emotionId: emotionId,
            score: r.score,
            reason: r.reason,
        })));

        return top3.map((r, i) => ({
            recommendation_id: ids[i],
            activity: r.activity,
            score: r.score,
            reason: r.reason,
            emotion_id: emotionId,
            emotion_tipo: emotion, 
            emotion_intensity: intensity,      
            emotion_energy: energy_level, 
        }));
    }

    static async aceptarRecomendacion(recommendationId) {
        return await RecommendationDAO.updateAceptada(recommendationId, 1);
    }

    static async rechazarRecomendacion(recommendationId) {
        return await RecommendationDAO.updateAceptada(recommendationId, 0);
    }

    static async getLastRecommendation(userId) {
        return await RecommendationDAO.getLastByUser(userId);
    }

    static async getHistorial(userId) {
        return await RecommendationDAO.getHistorialByUser(userId);
    }
    static async getPendientes(userId) {
        return await RecommendationDAO.getPendientesByUser(userId);
    }
}

module.exports = RecommendationService;