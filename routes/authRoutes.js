const router = require('express').Router();
const { asyncHandler } = require('../middlewares/errorMiddleware');
const auth = require('../controllers/authController');
router.get('/login', auth.showLogin);
router.get('/cadastro', auth.showRegister);
router.post('/cadastro', auth.registerRules, asyncHandler(auth.register));
router.post('/login', auth.loginRules, asyncHandler(auth.login));
router.post('/logout', auth.logout);
module.exports = router;