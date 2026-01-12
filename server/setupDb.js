const pool = require('./db');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const setupDatabase = async () => {
  try {
    console.log('🔄 Resetting Database Tables...');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'DATABASE.SQL');
    let sql = fs.readFileSync(sqlPath, 'utf8');

    // Generate Hash for Super Admin
    const hashedPassword = await bcrypt.hash('superadmin123', 10);
    
    // Replace placeholder with real hash
    sql = sql.replace('$2b$10$YourHashHere', hashedPassword);

    // Execute SQL
    await pool.query(sql);

    console.log('✅ Database setup complete!');
    console.log('🔑 Super Admin Credentials:');
    console.log('   Username: superadmin');
    console.log('   Password: superadmin123');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error setting up database:', err);
    process.exit(1);
  }
};

setupDatabase();
