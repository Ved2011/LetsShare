const { pool } = require('./Vnmo/db');

async function fixSchema() {
    try {
        console.log('Applying ALTER TABLE commands...');
        await pool.query(`
            ALTER TABLE communities ADD COLUMN IF NOT EXISTS city TEXT;
            ALTER TABLE communities ADD COLUMN IF NOT EXISTS state TEXT;
            ALTER TABLE communities ADD COLUMN IF NOT EXISTS locality TEXT;
            ALTER TABLE communities ADD COLUMN IF NOT EXISTS country TEXT;
            ALTER TABLE communities ADD COLUMN IF NOT EXISTS chat_enabled BOOLEAN DEFAULT false;
            ALTER TABLE communities ADD COLUMN IF NOT EXISTS latitude NUMERIC;
            ALTER TABLE communities ADD COLUMN IF NOT EXISTS longitude NUMERIC;
            ALTER TABLE items ADD COLUMN IF NOT EXISTS exclusive_community_id INTEGER REFERENCES communities(id) ON DELETE SET NULL;
        `);
        console.log('Schema fixed successfully');
        process.exit(0);
    } catch (err) {
        console.error('Failed to fix schema:', err);
        process.exit(1);
    }
}

fixSchema();
