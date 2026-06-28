const router = require('express').Router();
const { requireAuth } = require('../middlewares/authMiddleware');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const c = require('../controllers/alertController');
router.get('/', requireAuth, asyncHandler(c.index));
router.post('/', requireAuth, asyncHandler(c.create));
module.exports = router;