const UserService = require('../services/UserService');

class UserController {

    static async mostrarPerfil(req, res) {
        try {
            const userId = req.session.user.id;
            const usuario = await UserService.getUserById(userId);
            const stats = await UserService.getUserStats(userId);
            const flash = req.session.flash || null;
            delete req.session.flash;

            res.render("usuario/perfil", {
                usuario,
                stats,
                user: req.session.user,
                flash
            });

        } catch (err) {
            res.status(500).send("Error al cargar el perfil");
        }
    }

    static async changePassword(req, res) {
        const { newPassword } = req.body;

        if (!newPassword) {
            req.session.flash = { type: 'error', msg: 'Introduce una contraseña' };
            return res.redirect("/perfil");
        }

        try {
            await UserService.changePassword(req.session.user.id, newPassword);
            req.session.flash = { type: 'success', msg: 'Contraseña cambiada correctamente' };
            res.redirect("/perfil");
        } catch(err) {
            let msg = 'Error al cambiar la contraseña';
            if(err.message === 'WEAK_PASSWORD') msg = 'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número';
            req.session.flash = { type: 'error', msg};
            res.redirect("/perfil");
        }
    }

    static async modificarPerfil(req, res) {
        const { nombre, apellidos, pais, ciudad, email } = req.body;

        try {
            await UserService.updateProfile(
                req.session.user.id, nombre, apellidos, pais, ciudad, email
            );
            req.session.user.email = email;
            req.session.user.nombre = nombre;
            req.session.flash = { type: 'success', msg: 'Perfil actualizado correctamente' };
            res.redirect("/perfil");

        } catch (err) {
            let msg = "Error al actualizar el perfil";
            if (err.message === "EMAIL_EXISTS") msg = "El email ya está en uso";
            if (err.message === "EMPTY_FIELDS") msg = "Completa todos los campos";
            req.session.flash = { type: 'error', msg };
            res.redirect("/perfil");
        }
    }

    static async eliminarCuenta(req, res) {

        try {
            await UserService.eliminarCuenta(req.session.user.id);
            req.session.destroy(() => {
                res.redirect("/login");
            });
        } catch(err) {
            res.status(500).send("Error al eliminar la cuenta");
        }
    }

    static async eliminarFoto(req, res) {
        try {
            await UserService.eliminarFoto(req.session.user.id);
            req.session.user.foto = null;
            res.json({ success: true });

        } catch (err) {
            let message = "Error al eliminar la foto";
            if (err.message === 'INVALID_DATA') message = "Datos inválidos";
            if (err.message === 'USER_NOT_FOUND') message = "Usuario no encontrado";
            res.status(400).json({ success: false, message });
        }
    }

    static async subirFoto(req, res) {
        try {
            if (!req.file) throw new Error('NO_FILE');

            const foto = await UserService.updateFoto(req.session.user.id, req.file);
            req.session.user.foto = foto;

            res.json({ success: true, foto });

        } catch (err) {
            let message = "Error al subir la foto";
            if (err.message === 'NO_FILE') message = "No se recibió ningún archivo";
            if (err.message === 'INVALID_FILE_TYPE') message = "Solo se permiten JPG, PNG o WEBP";
            res.status(400).json({ success: false, message });
        }
    }
    
    static async inicio(req, res) {
        res.render("usuario/inicio", { user: req.session.user });
    }

    static async apiStats(req, res) {
        try {
            const stats = await UserService.getUserStats(req.session.user.id);
            res.json({ success: true, data: stats });
        } catch (err) {
            res.status(500).json({ success: false });
        }
    }
}

module.exports = UserController;