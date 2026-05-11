require('dotenv').config();
const { pool } = require('./db');
async function fix() {
  try {
    await pool.query(`
      ALTER TABLE communities ADD COLUMN IF NOT EXISTS city TEXT;
      ALTER TABLE communities ADD COLUMN IF NOT EXISTS state TEXT;
      ALTER TABLE communities ADD COLUMN IF NOT EXISTS locality TEXT;
      ALTER TABLE communities ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India';
      ALTER TABLE communities ADD COLUMN IF NOT EXISTS address TEXT;
    `);
    console.log("Fixed communities table");
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
fix();
