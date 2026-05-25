const AdminService = require('../services/AdminService');
const ActivityService = require('../services/ActivitiesService');
const UserService = require('../services/UserService');
const emotionMap = require('../utils/emotionMap');
const { generarInformePDF } = require('../utils/pdfGenerator');

class AdminController {

    static async dashboard(req, res) {
        try {
            const [stats, graficas] = await Promise.all([
                AdminService.getDashboardStats(),
                AdminService.getGraficas()
            ]);

            res.render('admin/dashboard', {
                user: req.session.user,
                stats,
                graficas,
                emotionMap
            });
        } catch (err) {
            res.status(500).send("Error al cargar el dashboard");
        }
    }

    static async listarUsuarios(req, res) {
        try {
            const usuarios = await AdminService.getAllUsuarios();
            res.render('admin/usuarios', {
                user: req.session.user,
                usuarios
            });
        } catch (err) {
            res.status(500).send("Error al cargar usuarios");
        }
    }

    static async getStatsUsuario(req, res) {
        try {
            const [usuario, stats] = await Promise.all([
                UserService.getUserById(req.params.id),
                AdminService.getStatsUsuario(req.params.id)
            ]);
            res.json({ success: true, data: { usuario, stats } });
        } catch (err) {
            let message = 'Error al obtener estadísticas del usuario';
            if (err.message === 'USER_NOT_FOUND') message = 'Usuario no encontrado';
            res.status(404).json({ success: false, message });
        }
    }

    static async activarUsuario(req, res) {
        try {
            await AdminService.activarUsuario(req.params.id);
            res.json({ success: true });
        } catch (err) {
            let message = 'Error al activar el usuario';
            if (err.message === 'INVALID_DATA') message = 'Usuario no encontrado';
            res.status(400).json({ success: false, message });
        }
    }

    static async desactivarUsuario(req, res) {
        try {
            await AdminService.desactivarUsuario(req.params.id);
            res.json({ success: true });
        } catch (err) {
            let message = 'Error al desactivar el usuario';
            if (err.message === 'INVALID_DATA') message = 'Usuario no encontrado';
            res.status(400).json({ success: false, message });
        }
    }

    static async listarActividades(req, res) {
        try {
            const actividades = await ActivityService.getAllActivities();
            res.render('admin/actividades', {
                user: req.session.user,
                actividades
            });
        } catch (err) {
            res.status(500).send("Error al cargar actividades");
        }
    }

    static async getStatsActividad(req, res) {
        try {
            const stats = await AdminService.getStatsActividad(req.params.id);
            res.json({ success: true, data: stats });
        } catch (err) {
            let message = 'Error al obtener datos';
            if (err.message === 'INVALID_DATA') message = 'Actividad no encontrada';
            res.status(400).json({ success: false, message });
        }
    }

    static async activarActividad(req, res) {
        try {
            await ActivityService.activateActivity(req.params.id);
            res.json({ success: true });
        } catch (err) {
            let message = 'Error al activar datos';
            if (err.message === 'INVALID_DATA') message = 'Actividad no encontrada';
            res.status(400).json({ success: false, message });
        }
    }

    static async verMotor(req, res) {
        try {
            const config = await AdminService.getConfig();
            const flash = req.session.flash || null;
            delete req.session.flash;

            res.render('admin/motor', {
                user: req.session.user,
                config,
                flash
            });
        } catch (err) {
            res.status(500).send("Error al cargar la configuración");
        }
    }

    static async actualizarMotor(req, res) {
        try {
            await AdminService.updateConfig(req.body);
            req.session.flash = { type: 'success', msg: 'Configuración guardada correctamente' };
            res.redirect('/admin/motor');
        } catch (err) {
            const config = await AdminService.getConfig();
            let error = "Error al guardar la configuración";
            if (err.message === 'INVALID_VALUE') error = "Los valores deben estar entre 1 y 10";
            if (err.message === 'INVALID_DATA')  error = "Datos de configuración no válidos";
            if (err.message === 'INVALID_PARAM') error = "Parámetro de configuración no válido";
        
            res.render('admin/motor', {
                user: req.session.user,
                config,
                flash: { type: 'error', msg: error }
            });
        }
    }

    static async verPerfil(req, res) {
        try {
            const usuario = await UserService.getUserById(req.session.user.id);
            const flash = req.session.flash || null;
            delete req.session.flash;

            res.render('admin/perfil', {
                user: req.session.user,
                usuario,
                flash
            });
        } catch (err) {
            res.status(500).send("Error al cargar el perfil");
        }
    }

    static async actualizarDatos(req, res) {
        const email = req.body.email;

        try {
            await UserService.updateEmail(req.session.user.id, email);
            req.session.user.email = email;
            req.session.flash = { type: 'success', msg: 'Datos actualizados correctamente' };
            res.redirect('/admin/perfil');

        } catch (err) {
            let msg = "Error al actualizar los datos";
            if (err.message === 'EMAIL_EXISTS') msg = "El email ya está en uso";
            if (err.message === 'EMPTY_FIELDS') msg = "Completa todos los campos";
            req.session.flash = { type: 'error', msg };
            res.redirect('/admin/perfil');
        }
    }

    static async cambiarPassword(req, res) {
        const { newPassword } = req.body;

        if (!newPassword) {
            req.session.flash = { type: 'error', msg: 'Introduce una contraseña' };
            return res.redirect('/admin/perfil');
        }

        try {
            await UserService.changePassword(req.session.user.id, newPassword);
            req.session.flash = { type: 'success', msg: 'Contraseña cambiada correctamente' };
            res.redirect('/admin/perfil');

        } catch (err) {
            req.session.flash = { type: 'error', msg: 'Error al cambiar la contraseña' };
            res.redirect('/admin/perfil');
        }
    }

    static async listarPropuestas(req, res) {
        try {
            const actividades = await ActivityService.getPropuestas();
            res.json({ success: true, data: actividades });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    static async publicarActividad(req, res) {
        try {
            await ActivityService.publicar(req.params.id);
            res.json({ success: true });
        } catch (err) {
            let message = 'Error al publicar la actividad';
            if (err.message === 'ACTIVITY_NOT_FOUND') message = 'Actividad no encontrada';
            if (err.message === 'CANNOT_PUBLISH') message = 'Solo se pueden publicar actividades en estado propuesta';
            res.status(400).json({ success: false, message });
        }
    }

    static async verPropuestas(req, res) {
        try {
            res.render('admin/propuestas', {
                user: req.session.user
            });
        } catch (err) {
            res.status(500).send("Error al cargar propuestas");
        }
    }

    static async rechazarActividad(req, res) {
        try {
            await ActivityService.rechazar(req.params.id);
            res.json({ success: true });
        } catch (err) {
            let message = 'Error al rechazar la actividad';
            if (err.message === 'ACTIVITY_NOT_FOUND') message = 'Actividad no encontrada';
            if (err.message === 'CANNOT_REJECT') message = 'Solo se pueden rechazar actividades en estado propuesta';
            res.status(400).json({ success: false, message });
        }
    }

    static async renderExplotacion(req, res) {
        try {
            const datos = await AdminService.getDatosExplotacion();
            res.render('admin/explotacion', {
                currentPage: 'explotacion',
                datos,
                user: req.session.user,
            });
        } catch (err) {
            console.error(err);
            req.session.flash = { tipo: 'danger', mensaje: 'Error cargando datos de explotación' };
            res.redirect('/admin/dashboard');
        }
    }
    
    static async descargarInformePDF(req, res) {
        try {
            const datos = await AdminService.getDatosExplotacion();
            const buffer = await generarInformePDF(datos);
            const fecha = new Date().toISOString().slice(0, 10);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="informe-general-${fecha}.pdf"`);
            res.send(buffer);
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Error generando el informe PDF' });
        }
    }
 
}

module.exports = AdminController;