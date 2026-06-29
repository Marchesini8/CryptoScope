const router = require('express').Router();
const { asyncHandler } = require('../middlewares/errorMiddleware');
const api = require('../controllers/apiController');

router.get('/ranking', asyncHandler(api.ranking));
router.get('/market-metrics', asyncHandler(api.marketMetrics));
router.get('/chart/:id', asyncHandler(api.chart));
router.get('/ohlc/:id', asyncHandler(api.ohlc));
router.get('/price', asyncHandler(api.price));
router.get('/coins/search', asyncHandler(api.searchCoins));

module.exports = router;
