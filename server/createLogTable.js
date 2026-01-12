const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

const createLogTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL,
        ip_address VARCHAR(50),
        details TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      -- Index for fast sorting
      CREATE INDEX IF NOT EXISTS idx_logs_created_at ON activity_logs(created_at);
    `);
    console.log("✅ 'activity_logs' table created successfully!");
  } catch (err) {
    console.error("❌ Error creating table:", err.message);
  } finally {
    pool.end();
  }
};

createLogTable();
