const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { signToken } = require('../middlewares/authMiddleware');
const { verifyGoogleCredential } = require('../services/googleAuthService');
exports.showLogin = (req, res) => res.render('pages/login', { title: 'Entrar - CryptoRadar', description: 'Acesse sua carteira cripto.', errors: [], mode: 'login' });
exports.showRegister = (req, res) => res.render('pages/login', { title: 'Cadastro - CryptoRadar', description: 'Crie sua conta no CryptoRadar.', errors: [], mode: 'register' });
exports.registerRules = [body('name').trim().isLength({ min: 2 }), body('email').isEmail().normalizeEmail(), body('password').isLength({ min: 6 })];
exports.loginRules = [body('email').isEmail().normalizeEmail(), body('password').notEmpty()];
exports.register = async (req, res) => { const errors = validationResult(req); if (!errors.isEmpty()) return res.status(422).render('pages/login', { title: 'Cadastro', description: '', errors: errors.array(), mode: 'register' }); const existing = await User.findByEmail(req.body.email); if (existing) return res.status(422).render('pages/login', { title: 'Cadastro', description: '', errors: [{ msg: 'E-mail ja cadastrado.' }], mode: 'register' }); const user = await User.create(req.body); res.cookie('token', signToken(user), { httpOnly: true, sameSite: 'lax' }); res.redirect('/carteira'); };
exports.login = async (req, res) => { const errors = validationResult(req); if (!errors.isEmpty()) return res.status(422).render('pages/login', { title: 'Entrar', description: '', errors: errors.array(), mode: 'login' }); const user = await User.findByEmail(req.body.email); if (!user || !(await User.verifyPassword(user, req.body.password))) return res.status(401).render('pages/login', { title: 'Entrar', description: '', errors: [{ msg: 'Credenciais invalidas.' }], mode: 'login' }); res.cookie('token', signToken(user), { httpOnly: true, sameSite: 'lax' }); res.redirect('/carteira'); };
exports.google = async (req, res) => {
  try {
    const profile = await verifyGoogleCredential(req.body.credential);
    const user = await User.upsertGoogleUser(profile);
    res.cookie('token', signToken(user), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.json({ ok: true, redirect: req.body.redirect || '/carteira', user: { name: user.name, email: user.email } });
  } catch (error) {
    res.status(401).json({ ok: false, error: error.message || 'Login com Google falhou.' });
  }
};
exports.logout = (req, res) => { res.clearCookie('token'); res.redirect('/'); };
