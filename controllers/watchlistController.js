const Favorite = require('../models/Favorite');
const coin = require('../services/coinGeckoService');
exports.index = async (req, res) => { const favorites = await Favorite.list(req.user.id); const ranking = await coin.getRanking(); const ids = new Set(favorites.map(f => f.coin_id)); res.render('pages/watchlist', { title: 'Watchlist - CryptoRadar', description: 'Suas criptomoedas favoritas.', coins: ranking.usd.filter(c => ids.has(c.id)) }); };
exports.add = async (req, res) => { await Favorite.add(req.user.id, req.body.coinId, req.body.coinName, req.body.symbol); res.redirect(req.get('referer') || '/watchlist'); };
exports.remove = async (req, res) => { await Favorite.remove(req.user.id, req.params.id); res.redirect('/watchlist'); };