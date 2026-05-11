require('dotenv').config();
const { pool } = require('./db');

async function test() {
  try {
    const result = await pool.query(`
      SELECT i.*, u.name as owner_name, d.image
      FROM items i
      JOIN users u ON i.owner_id = u.id
      JOIN follows f ON u.id = f.following_id
      LEFT JOIN item_details d ON i.id = d.item_id
      WHERE f.follower_id = $1
      ORDER BY i.created_at DESC
      LIMIT 50
    `, [1]);
    console.log("Success");
  } catch(e) {
    console.error("DB Error:", e.message);
  } finally {
    pool.end();
  }
}
test();
