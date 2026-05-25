const UserService=require('../services/UserService');

class AuthController{

    static mostrarRegistro(req, res) {
        if (req.session.user) {
            if (req.session.user.admin) {
                return res.redirect("/admin/dashboard");
            }
            return res.redirect("/inicio");
        }
        res.render('auth/registro', { error: null });
    }

    static async registro(req,res){
        try{
            const{nombre,apellidos,pais,ciudad,email,password}=req.body;
            const foto = req.file ? '/uploads/' + req.file.filename : null;
            await UserService.registro(nombre,apellidos,pais,ciudad,email,password,0,foto);
            res.redirect("/login");
        }catch (err){
            let msg='Ocurrió un error'
            if (err.message === 'EMAIL_EXISTS') msg = 'El email ya está registrado';
            if (err.message === 'EMPTY_FIELDS') msg = 'Completa todos los campos';
            if(err.message === 'WEAK_PASSWORD') msg = 'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número';
            res.render('auth/registro',{error:msg});
        }
    }

    static mostrarLogin(req, res) {
        if (req.session.user) {
            if (req.session.user.admin) {
                return res.redirect("/admin/dashboard");
            }
            return res.redirect("/inicio");
        }
        const flash = req.session.flash || null;
        delete req.session.flash;
        res.render('auth/login', { flash });
    }

    static async login(req,res){
        try{
            const {email,password}=req.body;
            const usuario=await UserService.loginUser(email,password);
            if(usuario){
                req.session.user = {
                id: usuario.id,
                email: usuario.email,
                nombre : usuario.nombre,
                admin: usuario.admin,
                activo: usuario.activo,
                foto: usuario.foto
                };
            }
            if (usuario.admin) {
                res.redirect("/admin/dashboard");
            } else {
                res.redirect("/inicio");
            }
        } catch (err){
            let msg='Ocurrió un error';
             switch(err.message) {
                case 'EMPTY_FIELDS': msg = 'Completa todos los campos'; break;
                case 'USER_NOT_FOUND': msg = 'Email o contraseña incorrectos'; break;
                case 'INVALID_PASSWORD': msg = 'Email o contraseña incorrectos'; break;
                case 'USER_INACTIVE': msg = 'Tu cuenta está desactivada. Contacta con el administrador.'; break;
            }
            req.session.flash = { type: 'error', msg };
            res.redirect('/login');
        }
    }
    
    static logout(req,res){
        req.session.destroy(()=>res.redirect("/login"));
    }
    
}

module.exports=AuthController;