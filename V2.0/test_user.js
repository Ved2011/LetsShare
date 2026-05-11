require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/letsshare'
});

async function test() {
  const targetUserId = 2;
  const currentUserId = 1;
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.username, u.profile_picture,
        EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = $2 AND f.followed_user_id = u.id) AS is_followed
       FROM users u WHERE u.id = $1`,
      [targetUserId, currentUserId]
    );
    console.log("Result rows:", result.rows.length);
    console.log("User:", result.rows[0]);
  } catch(e) {
    console.error("Error:", e.message);
  } finally {
    pool.end();
  }
}
test();
