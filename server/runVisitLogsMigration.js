const pool = require('./db');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const runMigration = async () => {
  try {
    console.log("Running Visit Logs Migration...");
    const sql = fs.readFileSync(path.join(__dirname, 'VISIT_LOGS_MIGRATION.sql'), 'utf8');
    await pool.query(sql);
    console.log("✅ Visit Logs Migration successful!");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    pool.end();
  }
};

runMigration();
