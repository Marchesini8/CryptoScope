const db = require('../config/db');
async function list(userId) { const [rows] = await db.execute('SELECT * FROM favorite_coins WHERE user_id = :userId ORDER BY created_at DESC', { userId }); return rows; }
async function add(userId, coinId, coinName, symbol) { await db.execute('INSERT IGNORE INTO favorite_coins (user_id, coin_id, coin_name, symbol) VALUES (:userId,:coinId,:coinName,:symbol)', { userId, coinId, coinName, symbol }); }
async function remove(userId, coinId) { await db.execute('DELETE FROM favorite_coins WHERE user_id = :userId AND coin_id = :coinId', { userId, coinId }); }
module.exports = { list, add, remove };