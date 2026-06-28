const router = require('express').Router();
const { requireAuth } = require('../middlewares/authMiddleware');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const c = require('../controllers/watchlistController');
router.get('/', requireAuth, asyncHandler(c.index));
router.post('/', requireAuth, asyncHandler(c.add));
router.post('/:id/remover', requireAuth, asyncHandler(c.remove));
module.exports = router;