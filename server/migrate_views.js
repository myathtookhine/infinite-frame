const pool = require('./db');

async function migrate() {
  try {
    await pool.query("ALTER TABLE artworks ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;");
    console.log("Migration successful: Added 'views' column to artworks table.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
