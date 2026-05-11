require('dotenv').config();
const { pool } = require('./db');

async function test() {
  try {
    const res = await pool.query(`
      (SELECT id, name, 'Community' as category, COALESCE(city || ', ' || state, address) as subtext 
       FROM communities 
       WHERE name ILIKE $1 OR address ILIKE $1 OR city ILIKE $1 OR state ILIKE $1 OR locality ILIKE $1 
       LIMIT 10)
      UNION ALL
      (SELECT id, name, 'Item' as category, 'Item' as subtext FROM items WHERE name ILIKE $1 LIMIT 10)
      UNION ALL
      (SELECT id, name, 'User' as category, email as subtext FROM users WHERE (name ILIKE $1 OR email ILIKE $1) AND id <> $2 LIMIT 10)
      ORDER BY category, name
    `, ['%Dhava%', 1]);
    console.log("Success:", res.rows);
  } catch (err) {
    console.error("DB Error:", err.message);
  } finally {
    pool.end();
  }
}
test();
