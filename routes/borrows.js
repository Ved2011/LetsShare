const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create borrow request
router.post('/', authenticateToken, async (req, res) => {
  const { itemId } = req.body;
  const borrowerId = req.user.id;

  try {
    // Get item details to find owner
    const itemResult = await pool.query('SELECT owner_id, name FROM items WHERE id = $1', [itemId]);
    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    const item = itemResult.rows[0];

    // Check if item is available
    if (item.status !== 'available') {
      return res.status(400).json({ error: 'Item is not available for borrowing' });
    }

    // Generate borrow_id
    const borrowId = 'BR-' + Date.now();

    const result = await pool.query(
      'INSERT INTO borrows (borrow_id, item_id, borrower_id, status) VALUES ($1, $2, $3, $4) RETURNING id',
      [borrowId, itemId, borrowerId, 'requested']
    );

    res.status(201).json({ message: 'Borrow request sent successfully', borrowId: borrowId });
  } catch (err) {
    console.error('Borrow request error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get borrows for user
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(`
      SELECT b.*, i.name as item_name, u.name as borrower_name, u.email as borrower_email
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

// Approve borrow request
router.put('/:id/approve', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { issueDate, dueDate, duration } = req.body;
  const userId = req.user.id;

  try {
    // Check if user owns the item
    const borrowResult = await pool.query(`
      SELECT b.*, i.owner_id FROM borrows b
      JOIN items i ON b.item_id = i.id
      WHERE b.id = $1
    `, [id]);

    if (borrowResult.rows.length === 0) {
      return res.status(404).json({ error: 'Borrow request not found' });
    }

    const borrow = borrowResult.rows[0];
    if (borrow.owner_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to approve this request' });
    }

    if (borrow.status !== 'requested') {
      return res.status(400).json({ error: 'Request has already been processed' });
    }

    // Update borrow with details and status
    await pool.query(
      'UPDATE borrows SET status = $1, issue_date = $2, due_date = $3, duration_days = $4 WHERE id = $5',
      ['active', issueDate, dueDate, duration, id]
    );

    // Update item status
    await pool.query('UPDATE items SET status = $1 WHERE id = $2', ['borrowed', borrow.item_id]);

    res.json({ message: 'Borrow request approved successfully' });
  } catch (err) {
    console.error('Approve borrow error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Decline borrow request
router.put('/:id/decline', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Check if user owns the item
    const borrowResult = await pool.query(`
      SELECT b.*, i.owner_id FROM borrows b
      JOIN items i ON b.item_id = i.id
      WHERE b.id = $1
    `, [id]);

    if (borrowResult.rows.length === 0) {
      return res.status(404).json({ error: 'Borrow request not found' });
    }

    const borrow = borrowResult.rows[0];
    if (borrow.owner_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to decline this request' });
    }

    if (borrow.status !== 'requested') {
      return res.status(400).json({ error: 'Request has already been processed' });
    }

    // Delete the request
    await pool.query('DELETE FROM borrows WHERE id = $1', [id]);

    res.json({ message: 'Borrow request declined successfully' });
  } catch (err) {
    console.error('Decline borrow error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;