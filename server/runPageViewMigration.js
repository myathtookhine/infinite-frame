const pool = require('./db');
const fs = require('fs');
const path = require('path');

const runMigration = async () => {
  try {
    console.log('Running Page Views Migration...');
    
    const sqlPath = path.join(__dirname, 'PAGE_VIEWS_MIGRATION.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await pool.query(sql);

    console.log('✅ Page Views Migration successful!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
};

runMigration();
