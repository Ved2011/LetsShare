const { pool } = require('./Vnmo/db');

async function checkDB() {
    try {
        const result = await pool.query("SELECT current_database(), current_user");
        console.log('DB Info:', result.rows[0]);
        process.exit(0);
    } catch (err) {
        console.error('Error checking DB:', err);
        process.exit(1);
    }
}

checkDB();
