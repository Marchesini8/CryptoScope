const bcrypt = require('bcrypt');
const db = require('../config/db');
async function create({ name, email, password }) { const hash = await bcrypt.hash(password, 12); const [r] = await db.execute('INSERT INTO users (name,email,password_hash) VALUES (:name,:email,:hash)', { name, email, hash }); return { id: r.insertId, name, email }; }
async function findByEmail(email) { const [rows] = await db.execute('SELECT * FROM users WHERE email = :email LIMIT 1', { email }); return rows[0]; }
async function verifyPassword(user, password) { return bcrypt.compare(password, user.password_hash); }
module.exports = { create, findByEmail, verifyPassword };