const { query } = require('../config/postgres');

async function addTx(userId, tx) {
  await query(
    'INSERT INTO portfolio_transactions (user_id, coin_id, coin_name, symbol, amount_invested, coin_price, quantity, purchased_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
    [userId, tx.coinId, tx.coinName, tx.symbol, tx.amountInvested, tx.coinPrice, tx.quantity, tx.purchasedAt]
  );
}

async function list(userId) {
  const result = await query('SELECT * FROM portfolio_transactions WHERE user_id = $1 ORDER BY purchased_at DESC, created_at DESC', [userId]);
  return result.rows;
}

module.exports = { addTx, list };
