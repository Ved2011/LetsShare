require('dotenv').config();
const { pool } = require('../db');

async function testChat() {
  try {
    console.log("Checking database connection and community_messages table...");
    
    // 1. Check if community_messages table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'community_messages'
      );
    `);
    
    const exists = tableCheck.rows[0].exists;
    console.log(`Table 'community_messages' exists: ${exists}`);
    
    if (!exists) {
      console.log("Creating community_messages table...");
      await pool.query(`
        CREATE TABLE IF NOT EXISTS community_messages (
          id SERIAL PRIMARY KEY,
          community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          message TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log("Table created successfully!");
    } else {
      // Describe table columns
      const cols = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'community_messages';
      `);
      console.log("Columns in community_messages:");
      cols.rows.forEach(c => console.log(`  - ${c.column_name}: ${c.data_type}`));
    }
    
    console.log("All DB chat checks complete!");
  } catch (err) {
    console.error("Database check failed:", err);
  } finally {
    pool.end();
  }
}

testChat();
