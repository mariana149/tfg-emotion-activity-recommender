module.exports = function esAdmin(req, res, next) {
    if (!req.session.user)
        return res.redirect("/login");
    if (!req.session.user.admin)
        return res.status(403).send("No autorizado");

    next();
};