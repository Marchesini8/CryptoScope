const db = require('../config/db');
async function add(userId, query) { if (!query) return; await db.execute('INSERT INTO search_history (user_id, query) VALUES (:userId,:query)', { userId: userId || null, query }); }
module.exports = { add };