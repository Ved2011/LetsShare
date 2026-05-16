const { pool } = require('./Vnmo/db');

async function testInsert() {
    try {
        const userId = 7; // Audit Vnmo from previous list
        console.log('Testing insert for userId:', userId);
        const res = await pool.query(
            'INSERT INTO communities (name, address, description, max_limit, is_private, admin_id, city, state, locality, country) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
            ['Test Community', 'Test Address', 'Test Desc', 100, false, userId, 'Test City', 'Test State', 'Test Locality', 'India']
        );
        console.log('Insert Success:', res.rows[0]);
        process.exit(0);
    } catch (err) {
        console.error('Insert Failed:', err);
        process.exit(1);
    }
}

testInsert();
