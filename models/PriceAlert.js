const { query } = require('../config/postgres');

async function create(userId, alert) {
  await query(
    'INSERT INTO price_alerts (user_id, coin_id, coin_name, symbol, target_price, currency, direction) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [userId, alert.coinId, alert.coinName, alert.symbol, alert.targetPrice, alert.currency, alert.direction]
  );
}

async function list(userId) {
  const result = await query('SELECT * FROM price_alerts WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  return result.rows;
}

module.exports = { create, list };
