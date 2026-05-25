const express = require("express");
const router = express.Router();

const ActivityLogController = require("../controllers/ActivityLogController");
const isAuth = require('../middleware/usuario');

router.use(isAuth);

router.post("/activity/start", ActivityLogController.startActivity);
router.get("/activity/my", ActivityLogController.getActivitiesByUser);
router.get("/activity/log/:id", ActivityLogController.getLogById);
router.get('/api/realizadas', ActivityLogController.getActivitiesByUser);

module.exports = router;