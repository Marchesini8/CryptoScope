const { query } = require('../config/postgres');

async function add(userId, question, answer) {
  if (!userId) return;
  await query('INSERT INTO chat_history (user_id, question, answer) VALUES ($1, $2, $3)', [userId, question, answer]);
}

async function list(userId) {
  if (!userId) return [];
  const result = await query('SELECT * FROM chat_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20', [userId]);
  return result.rows.reverse();
}

module.exports = { add, list };
