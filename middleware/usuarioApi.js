module.exports = function requireAuthApi(req, res, next) {
    if (!req.session.user)
        return res.status(401).json({ error: 'No autenticado' });
    next();
};