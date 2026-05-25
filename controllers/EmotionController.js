const EmotionService = require('../services/EmotionService');
const emotionMap = require('../utils/emotionMap');

class EmotionController {

    static async renderEmotions(req, res) {
        res.render("usuario/emociones", { user: req.session.user, emotionMap });
    }

    static async registerEmotion(req, res){
        try{
        const userId = req.session.user.id;   
            const {
                emotion,
                intensity,
                energy_level,
                notes
            } = req.body;

            await EmotionService.registerEmotion(
                userId,
                emotion,
                intensity,
                energy_level,
                notes
            );

            res.redirect("/emociones");

        }catch(error){

            let msg = "Error registrando emoción";

            switch(error.message){
                case "EMPTY_FIELDS":
                    msg = "Completa los campos obligatorios";
                    break;

                case "INVALID_INTENSITY":
                    msg = "La intensidad debe estar entre 1 y 5";
                    break;

                case "INVALID_ENERGY":
                    msg = "El nivel de energía debe ser baja, media o alta";
                    break;
            }

            res.render("usuario/emociones", { error: msg, user: req.session.user });
        }
    }

    static async apiUserEmotions(req,res){

        try{

            const userId = req.session.user.id;

            const emociones = await EmotionService.getEmotionsByUser(userId);

            res.json(emociones);

        }catch(error){

            res.status(500).json({ success: false, message: 'Error cargando emociones'});

        }
    }

    static async getEmotionById(req,res){

        try{

            const emotion = await EmotionService.getEmotionById(
                req.params.id
            );

            res.json({
                success:true,
                data:emotion
            });

        }catch(error){
            let message = 'Error al obtener la emoción';
            if (error.message === 'INVALID_ID') message = 'ID no válido';
            if (error.message === 'EMOTION_NOT_FOUND') message = 'Emoción no encontrada';
            res.status(404).json({ success: false, message });
        }
    }

    static async getLastEmotion(req,res){

        try{

            const emotion = await EmotionService.getLastEmotion(
                req.session.user.id
            );

            res.json({
                success:true,
                data:emotion
            });

        }catch(error){

            res.status(500).json({
                success:false,
                message:error.message
            });

        }
    }
    static async apiEmotionEvolution(req,res){

        try{
            const userId = req.session.user.id;
            const data = await EmotionService.getEmotionEvolution(userId);
            res.json({ success: true, data });

        }catch(error){
            res.status(500).json({ success: false, message: 'Error cargando evolución' });
        }

    }

    static async apiEmotionDistribution(req,res){

        try{

            const userId = req.session.user.id;
            const data = await EmotionService.getEmotionDistribution(userId);
            res.json({ success: true, data });

        }catch(error){

            res.status(500).json({ success: false, message: 'Error cargando distribución' });
        }

    }

    static async apiRegistrar(req, res) {
        try {
            const { emotion, intensity, energy_level, notes } = req.body;
            const emotionId = await EmotionService.registerEmotion(
                req.session.user.id, emotion, intensity, energy_level, notes || ''
            );
            res.json({ success: true, emotionId });
        } catch (error) {
            let message = 'Error al registrar la emoción';
            if (error.message === 'EMPTY_FIELDS') message = 'Completa todos los campos obligatorios';
            if (error.message === 'INVALID_INTENSITY') message = 'La intensidad debe estar entre 1 y 5';
            if (error.message === 'INVALID_ENERGY') message = 'El nivel de energía debe ser baja, media o alta';
            res.status(400).json({ success: false, message });
        }
    }
}

module.exports = EmotionController;