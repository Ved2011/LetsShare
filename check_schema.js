const { pool } = require('./Vnmo/db');

async function checkSchema() {
    try {
        console.log('Checking communities table...');
        const commResult = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'communities'");
        console.log('Communities columns:', commResult.rows);

        console.log('\nChecking items table...');
        const itemResult = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'items'");
        console.log('Items columns:', itemResult.rows);
        
        process.exit(0);
    } catch (err) {
        console.error('Error checking schema:', err);
        process.exit(1);
    }
}

checkSchema();
