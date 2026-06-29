const { query } = require('../config/postgres');

async function add(userId, text) {
  if (!text) return;
  await query('INSERT INTO search_history (user_id, query) VALUES ($1, $2)', [userId || null, text]);
}

module.exports = { add };
