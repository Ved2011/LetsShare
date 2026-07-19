const express = require('express');
const { pool } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM items) AS total_items,
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM borrows WHERE status = 'active') AS active_borrows
    `);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;