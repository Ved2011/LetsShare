const { pool } = require('./Vnmo/db');

async function checkSchema() {
    try {
        console.log('Checking community_members table...');
        const result = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'community_members'");
        console.log('Community Members columns:', result.rows);
        process.exit(0);
    } catch (err) {
        console.error('Error checking schema:', err);
        process.exit(1);
    }
}

checkSchema();
