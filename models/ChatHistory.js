const db = require('../config/db');
async function add(userId, question, answer) { if (!userId) return; await db.execute('INSERT INTO chat_history (user_id, question, answer) VALUES (:userId,:question,:answer)', { userId, question, answer }); }
async function list(userId) { if (!userId) return []; const [rows] = await db.execute('SELECT * FROM chat_history WHERE user_id = :userId ORDER BY created_at DESC LIMIT 20', { userId }); return rows.reverse(); }
module.exports = { add, list };