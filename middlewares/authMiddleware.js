const jwt = require('jsonwebtoken');
function signToken(user) { return jwt.sign({ id: user.id, name: user.name, email: user.email }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }); }
function attachUser(req, res, next) { const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', ''); res.locals.user = null; if (!token) return next(); try { req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret'); res.locals.user = req.user; } catch (_) { res.clearCookie('token'); } next(); }
function requireAuth(req, res, next) { if (!req.user) return res.redirect('/auth/login'); next(); }
module.exports = { attachUser, requireAuth, signToken };