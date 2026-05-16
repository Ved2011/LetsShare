require('dotenv').config();
const { pool } = require('./db');

const email = process.argv[2];

if (!email) {
  console.error("Usage: node makeAdmin.js <user_email>");
  process.exit(1);
}

const makeAdmin = async () => {
  try {
    const res = await pool.query('UPDATE users SET is_site_admin = TRUE WHERE email = $1 RETURNING *', [email]);
    if (res.rows.length > 0) {
      console.log(`Success! User ${email} is now a site admin.`);
    } else {
      console.log(`User with email ${email} not found.`);
    }
  } catch (err) {
    console.error("Error updating user:", err);
  } finally {
    pool.end();
  }
};

makeAdmin();
