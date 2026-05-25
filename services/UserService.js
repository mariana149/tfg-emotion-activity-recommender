const bcrypt = require('bcrypt');
const UserDAO = require('../dao/UserDAO');
const SavedActivityDAO = require('../dao/SavedActivityDAO');
const ActivityLogDAO = require('../dao/ActivityLogDAO');
const EmotionDAO = require('../dao/EmotionDAO');
const RecommendationDAO = require('../dao/RecommendationDAO');
const SocialDAO = require('../dao/SocialDAO');
const fs = require('fs').promises;
const path = require('path');

class UserService {

    static async registro(nombre, apellidos, pais, ciudad, email, password, admin = 0, foto = null) {

        if (!nombre || !apellidos || !pais || !ciudad || !email || !password)
            throw new Error('EMPTY_FIELDS');

        const existe = await UserDAO.findByEmail(email);
        if (existe) throw new Error('EMAIL_EXISTS');

        if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password))
            throw new Error('WEAK_PASSWORD');

        const hashedPassword = await bcrypt.hash(password, 10);

        const userId = await UserDAO.addUser(
            nombre,
            apellidos,
            pais,
            ciudad,
            email,
            hashedPassword,
            admin,
            1,
            foto
        );

        return userId;
    }

    static async loginUser(email, password) {

        if (!email || !password)
            throw new Error('EMPTY_FIELDS');

        const user = await UserDAO.findByEmail(email);

        if (!user)
            throw new Error('USER_NOT_FOUND');

        if (!user.activo)
            throw new Error('USER_INACTIVE');

        const valid = await bcrypt.compare(password, user.password);

        if (!valid)
            throw new Error('INVALID_PASSWORD');

        delete user.password;

        return user;
    }

    static async changePassword(id, newPassword) {

        if (!id || !newPassword)
            throw new Error('INVALID_DATA');
        if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword))
            throw new Error('WEAK_PASSWORD');
        
        const encrypted = await bcrypt.hash(newPassword, 10);

        await UserDAO.updatePassword(id, encrypted);

        return true;
    }

    static async eliminarCuenta(id) {

        if (!id) throw new Error('INVALID_DATA');

        await UserDAO.deleteUser(id);

        return true;
    }

    static async getUserById(id) {

        const user = await UserDAO.getUserById(id);

        if (!user)
            throw new Error('USER_NOT_FOUND');

        delete user.password;

        return user;
    }

    static async updateProfile(id, nombre, apellidos, pais, ciudad, email) {

        if (!id || !nombre || !apellidos || !pais || !ciudad || !email)
            throw new Error('EMPTY_FIELDS');

        const user = await UserDAO.getUserById(id);
        if (!user) throw new Error('USER_NOT_FOUND');

        const emailOwner = await UserDAO.findByEmail(email);
        if (emailOwner && emailOwner.id !== id) throw new Error('EMAIL_EXISTS');

        return await UserDAO.updateUser(id, nombre, apellidos, pais, ciudad, email);
    }

    static async getAllUsers() {

        const users = await UserDAO.getAllUsers();

        return users;
    }
    static async getUserStats(userId) {
        if (!userId) throw new Error('INVALID_USER');

        const [guardadas, realizadas, emociones, recomendaciones, conexiones] = await Promise.allSettled([
            SavedActivityDAO.countByUser(userId),
            ActivityLogDAO.countByUser(userId),
            EmotionDAO.countByUser(userId),
            RecommendationDAO.countByUser(userId),
            SocialDAO.contarConexiones(userId)
        ]);

        return {
            guardadas: guardadas.status === 'fulfilled' ? guardadas.value : 0,
            realizadas: realizadas.status === 'fulfilled' ? realizadas.value : 0,
            emociones: emociones.status === 'fulfilled' ? emociones.value : 0,
            recomendaciones: recomendaciones.status === 'fulfilled' ? recomendaciones.value : 0,
            conexiones: conexiones.status === 'fulfilled' ? conexiones.value : 0,
        };
    }
    static async updateFoto(id, file) {
        if (!id || !file) throw new Error('INVALID_DATA');
        const usuario = await UserDAO.getUserById(id);
        if (!usuario) throw new Error('USER_NOT_FOUND');

        if (usuario.foto) {
            const rutaAntigua = path.join(__dirname, '..', 'public', usuario.foto);
            try { await fs.unlink(rutaAntigua); } catch {}
        }

        const nuevaFoto = '/uploads/' + file.filename;

        await UserDAO.updateFoto(id, nuevaFoto);

        return nuevaFoto;
    }
    static async eliminarFoto(id) {
        if (!id) throw new Error('INVALID_DATA');

        const usuario = await UserDAO.getUserById(id);
        if (!usuario) throw new Error('USER_NOT_FOUND');

        if (usuario.foto) {
            const rutaAntigua = path.join(__dirname, '..', 'public', usuario.foto);
            try { await fs.unlink(rutaAntigua); } catch {}
        }
        return await UserDAO.updateFoto(id, null);
    }
    static async updateEmail(id, email) {
        if (!id || !email) throw new Error('EMPTY_FIELDS');
        const user = await UserDAO.getUserById(id);

        if (!user) throw new Error('USER_NOT_FOUND');
        const emailOwner = await UserDAO.findByEmail(email);

        if (emailOwner && emailOwner.id !== id) throw new Error('EMAIL_EXISTS');
        
        return await UserDAO.updateEmail(id, email);
    }
}

module.exports = UserService;