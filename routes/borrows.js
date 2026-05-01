const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create borrow
router.post('/', authenticateToken, async (req, res) => {
  const { itemId, borrowerEmail, dueDate } = req.body;
  const borrowerId = req.user.id;

  try {
    // Find borrower by email
    const borrowerResult = await pool.query('SELECT id FROM users WHERE email = $1', [borrowerEmail]);
    if (borrowerResult.rows.length === 0) {
      return res.status(400).json({ error: 'Borrower not found' });
    }
    const actualBorrowerId = borrowerResult.rows[0].id;

    // Generate borrow_id
    const borrowId = 'BR-' + Date.now();

    const result = await pool.query(
      'INSERT INTO borrows (borrow_id, item_id, borrower_id, due_date) VALUES ($1, $2, $3, $4) RETURNING id',
      [borrowId, itemId, actualBorrowerId, dueDate]
    );

    // Update item status
    await pool.query('UPDATE items SET status = $1 WHERE id = $2', ['borrowed', itemId]);

    res.status(201).json({ message: 'Borrow created successfully', borrowId: borrowId });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get borrows for user
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(`
      SELECT b.*, i.name as item_name, u.name as borrower_name
      FROM borrows b
      JOIN items i ON b.item_id = i.id
      JOIN users u ON b.borrower_id = u.id
      WHERE i.owner_id = $1 OR b.borrower_id = $1
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;