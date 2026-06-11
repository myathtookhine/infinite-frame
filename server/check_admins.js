const pool = require('./db');
async function test() {
  const res = await pool.query("SELECT id, username, email, role, is_verified, status FROM admins;");
  for (let r of res.rows) {
    console.log(r);
  }
  process.exit();
}
test();
