const router = require('express').Router();
const { asyncHandler } = require('../middlewares/errorMiddleware');
const c = require('../controllers/newsController');
router.get('/', asyncHandler(c.index));
module.exports = router;