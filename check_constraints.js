const { pool } = require('./Vnmo/db');

async function checkConstraints() {
    try {
        console.log('Checking constraints for communities table...');
        const result = await pool.query("SELECT conname, pg_get_constraintdef(c.oid) FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace WHERE n.nspname = 'public' AND contypid = 'communities'::regtype");
        console.log('Constraints:', result.rows);
        process.exit(0);
    } catch (err) {
        console.error('Error checking constraints:', err);
        process.exit(1);
    }
}

checkConstraints();
