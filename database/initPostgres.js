const fs = require('fs');
const path = require('path');
const { query } = require('../config/postgres');

async function initPostgres() {
  if (process.env.DB_AUTO_MIGRATE === 'false') return;
  const schemaPath = path.join(__dirname, 'postgres-schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  await query(sql);
}

module.exports = initPostgres;
