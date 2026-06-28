const router = require('express').Router();
const { asyncHandler } = require('../middlewares/errorMiddleware');
const c = require('../controllers/chatController');
router.get('/', asyncHandler(c.index));
router.post('/', asyncHandler(c.ask));
module.exports = router;