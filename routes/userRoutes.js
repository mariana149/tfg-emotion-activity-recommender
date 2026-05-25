const express=require('express');
const router=express.Router();
const userController=require('../controllers/UserController');
const authController=require('../controllers/AuthController');
const upload = require('../middleware/upload');
const requireAuth = require('../middleware/usuario');

router.get('/login', authController.mostrarLogin);
router.get('/registro', authController.mostrarRegistro);
router.get('/perfil', requireAuth, userController.mostrarPerfil)
router.post('/login', authController.login);
router.post('/registro', authController.registro);
router.get('/logout', authController.logout);
router.post('/changePassword', requireAuth, userController.changePassword);
router.post('/modificarPerfil', requireAuth, userController.modificarPerfil);
router.post('/eliminarCuenta', requireAuth, userController.eliminarCuenta);
router.post('/perfil/foto', requireAuth, upload.single('foto'), userController.subirFoto);
router.post('/perfil/foto/eliminar', requireAuth, userController.eliminarFoto);
router.get('/inicio', requireAuth, userController.inicio);
router.get('/api/usuario/stats', requireAuth, userController.apiStats);

module.exports=router;