require('dotenv').config();
const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/letsshare'
});

async function run() {
  try {
    await client.connect();
    console.log("Connected");
    await client.query(`
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
    console.error("Error is:", e);
  } finally {
    await client.end();
  }
}
run();
