require('dotenv').config();
const { Client } = require('pg');
const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'letsshare',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || ''
});

async function run() {
  try {
    await client.connect();
    console.log("Connected");
    const res = await client.query(`
      SELECT i.*, u.name as owner_name, d.image
      FROM items i
      JOIN users u ON i.owner_id = u.id
      JOIN follows f ON u.id = f.followed_user_id
      LEFT JOIN item_details d ON i.id = d.item_id
      WHERE f.follower_id = $1
      ORDER BY i.created_at DESC
      LIMIT 50
    `, [1]); // Assuming user ID 1 exists
    console.log("Query success, rows:", res.rows.length);
  } catch(e) {
    console.error("SQL Error:", e.message);
    console.error("Full error:", e);
  } finally {
    await client.end();
  }
}
run();
