const db = require('../config/db');
async function addTx(userId, tx) { await db.execute('INSERT INTO portfolio_transactions (user_id, coin_id, coin_name, symbol, amount_invested, coin_price, quantity, purchased_at) VALUES (:userId,:coinId,:coinName,:symbol,:amountInvested,:coinPrice,:quantity,:purchasedAt)', { userId, ...tx }); }
async function list(userId) { const [rows] = await db.execute('SELECT * FROM portfolio_transactions WHERE user_id = :userId ORDER BY purchased_at DESC, created_at DESC', { userId }); return rows; }
module.exports = { addTx, list };