const express = require("express");
const router = express.Router();
const EmotionController = require("../controllers/EmotionController");;

const isAuth = require('../middleware/usuario');

router.use(isAuth);

router.post("/emociones/registrar",EmotionController.registerEmotion);
router.post("/api/emociones/registrar", EmotionController.apiRegistrar);

router.get("/api/emociones/evolucion", EmotionController.apiEmotionEvolution);
router.get("/api/emociones/distribucion", EmotionController.apiEmotionDistribution);
router.get("/api/emociones/last",EmotionController.getLastEmotion);
router.get("/api/emociones", EmotionController.apiUserEmotions);

router.get("/emociones", EmotionController.renderEmotions);
router.get("/emociones/:id", EmotionController.getEmotionById);



module.exports = router;