const express = require("express");
const router = express.Router();

const SavedActivityController = require("../controllers/SavedActivityController");
const isAuth = require('../middleware/usuario');

router.use(isAuth);

router.get("/api/guardadas", SavedActivityController.getSaved);
router.post("/api/guardadas", SavedActivityController.save);
router.post("/api/guardadas/quitar", SavedActivityController.remove);

module.exports = router;