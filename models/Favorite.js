const { query } = require('../config/postgres');

async function list(userId) {
  const result = await query('SELECT * FROM favorite_coins WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  return result.rows;
}

async function add(userId, coinId, coinName, symbol) {
  await query(
    'INSERT INTO favorite_coins (user_id, coin_id, coin_name, symbol) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, coin_id) DO NOTHING',
    [userId, coinId, coinName, symbol]
  );
}

async function remove(userId, coinId) {
  await query('DELETE FROM favorite_coins WHERE user_id = $1 AND coin_id = $2', [userId, coinId]);
}

module.exports = { list, add, remove };
