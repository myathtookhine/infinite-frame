const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function dropTables() {
  try {
    console.log('Dropping old tables...');
    await pool.query('DROP TABLE IF EXISTS categories, styles, themes, units, mediums CASCADE');
    console.log('Success: Old tables (categories, styles, themes, units, mediums) dropped.');
  } catch (err) {
    console.error('Error dropping tables:', err);
  } finally {
    await pool.end();
  }
}

dropTables();
