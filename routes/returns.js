const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create return
router.post('/', authenticateToken, async (req, res) => {
  const { itemId, borrowerEmail, condition, notes } = req.body;

  try {
    // Find borrow by item_id and borrower email
    const borrowResult = await pool.query(`
      SELECT b.id FROM borrows b
      JOIN users u ON b.borrower_id = u.id
      WHERE b.item_id = $1 AND u.email = $2 AND b.status = 'active'
    `, [itemId, borrowerEmail]);

    if (borrowResult.rows.length === 0) {
      return res.status(400).json({ error: 'Active borrow not found' });
    }

    const borrowId = borrowResult.rows[0].id;

    const result = await pool.query(
      'INSERT INTO returns (borrow_id, condition, notes) VALUES ($1, $2, $3) RETURNING id',
      [borrowId, condition, notes]
    );

    // Update borrow status
    await pool.query('UPDATE borrows SET status = $1 WHERE id = $2', ['returned', borrowId]);

    // Update item status
    await pool.query('UPDATE items SET status = $1 WHERE id = $2', ['available', itemId]);

    res.status(201).json({ message: 'Return logged successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;