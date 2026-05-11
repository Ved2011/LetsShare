require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/letsshare'
});

async function test() {
  try {
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'follows'");
    console.log("Follows columns:", res.rows.map(r => r.column_name));
    
    const res2 = await pool.query("SELECT * FROM items LIMIT 1");
    console.log("Items columns:", res2.fields.map(f => f.name));
    
    const res3 = await pool.query("SELECT * FROM item_details LIMIT 1");
    console.log("Item_details columns:", res3.fields.map(f => f.name));
  } catch(e) {
    console.error("Error:", e.message);
  } finally {
    pool.end();
  }
}
test();
