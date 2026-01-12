const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

const seedSuperAdmin = async () => {
  const username = 'superadmin';
  const email = 'admin@infiniteframe.online';
  const password = 'Password1@'; // ⚠️ Change this to a strong password!

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const res = await pool.query(
      `INSERT INTO admins (username, email, password_hash, role, is_verified, status)
       VALUES ($1, $2, $3, 'super_admin', TRUE, 'active')
       ON CONFLICT (email) 
       DO UPDATE SET password_hash = $3, role = 'super_admin'
       RETURNING *`,
      [username, email, hashedPassword]
    );

    console.log('✅ Super Admin Seeded Successfully:');
    console.log('ID:', res.rows[0].id);
    console.log('Username:', res.rows[0].username);
    console.log('Role:', res.rows[0].role);

  } catch (err) {
    console.error('❌ Error seeding Super Admin:', err.message);
  } finally {
    pool.end();
  }
};

seedSuperAdmin();
