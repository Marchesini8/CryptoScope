const db = require('../config/db');
async function create(userId, alert) { await db.execute('INSERT INTO price_alerts (user_id, coin_id, coin_name, symbol, target_price, currency, direction) VALUES (:userId,:coinId,:coinName,:symbol,:targetPrice,:currency,:direction)', { userId, ...alert }); }
async function list(userId) { const [rows] = await db.execute('SELECT * FROM price_alerts WHERE user_id = :userId ORDER BY created_at DESC', { userId }); return rows; }
module.exports = { create, list };