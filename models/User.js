const bcrypt = require('bcrypt');
const { query } = require('../config/postgres');

function toUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatarUrl: row.avatar_url,
    authProvider: row.auth_provider,
    googleId: row.google_id,
    password_hash: row.password_hash
  };
}

async function create({ name, email, password }) {
  const hash = await bcrypt.hash(password, 12);
  const result = await query(
    'INSERT INTO users (name, email, password_hash, auth_provider) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, email, hash, 'email']
  );
  return toUser(result.rows[0]);
}

async function findByEmail(email) {
  const result = await query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
  return toUser(result.rows[0]);
}

async function findByGoogleId(googleId) {
  const result = await query('SELECT * FROM users WHERE google_id = $1 LIMIT 1', [googleId]);
  return toUser(result.rows[0]);
}

async function upsertGoogleUser(profile) {
  const existingByGoogle = await findByGoogleId(profile.googleId);
  if (existingByGoogle) {
    const updated = await query(
      'UPDATE users SET name = $1, email = $2, avatar_url = $3, auth_provider = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
      [profile.name, profile.email, profile.avatarUrl || null, 'google', existingByGoogle.id]
    );
    return toUser(updated.rows[0]);
  }

  const existingByEmail = await findByEmail(profile.email);
  if (existingByEmail) {
    const updated = await query(
      'UPDATE users SET google_id = $1, name = $2, avatar_url = $3, auth_provider = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
      [profile.googleId, profile.name, profile.avatarUrl || null, 'google', existingByEmail.id]
    );
    return toUser(updated.rows[0]);
  }

  const created = await query(
    'INSERT INTO users (name, email, google_id, avatar_url, auth_provider) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [profile.name, profile.email, profile.googleId, profile.avatarUrl || null, 'google']
  );
  return toUser(created.rows[0]);
}

async function verifyPassword(user, password) {
  if (!user || !user.password_hash) return false;
  return bcrypt.compare(password, user.password_hash);
}

module.exports = { create, findByEmail, findByGoogleId, upsertGoogleUser, verifyPassword };
