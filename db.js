const { Pool,types } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

types.setTypeParser(1082, (value) => value);
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};