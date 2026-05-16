const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create borrow request
router.post('/', authenticateToken, async (req, res) => {
  const { itemId, dueDate } = req.body;
  const borrowerId = req.user.id;

  if (!dueDate) {
    return res.status(400).json({ error: 'Return date is required' });
  }

  try {
    // Check community constraint
    const itemOwnerResult = await pool.query('SELECT owner_id FROM items WHERE id = $1', [itemId]);
    if (itemOwnerResult.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    const ownerId = itemOwnerResult.rows[0].owner_id;

    if (ownerId !== borrowerId) {
      const shareCommunityResult = await pool.query(`
        SELECT 1 FROM community_members cm1 
        JOIN community_members cm2 ON cm1.community_id = cm2.community_id 
        WHERE cm1.user_id = $1 AND cm2.user_id = $2
      `, [borrowerId, ownerId]);
      
      if (shareCommunityResult.rows.length === 0) {
        return res.status(403).json({ error: 'You can only borrow from people in your communities.' });
      }
    }

    // Calculate duration
    const today = new Date();
    const due = new Date(dueDate);
    const duration = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (duration <= 0) {
      return res.status(400).json({ error: 'Return date must be in the future' });
    }

    // Get borrower details to check plan limits
    const borrowerResult = await pool.query('SELECT plan_type, borrows_this_month, wallet_balance FROM users WHERE id = $1', [borrowerId]);
    const borrower = borrowerResult.rows[0];
    
    let limit = 999; // Unlimited in Early Bird
    const currentBorrows = borrower.borrows_this_month + 1;
    let message = 'Borrow request sent successfully';
    let extraFee = 0;
    // Borrowing is free for everyone during Early Bird phase.

    // Generate borrow_id
    const borrowId = 'BR-' + Date.now();

    // Start transaction
    await pool.query('BEGIN');
    
    // Deduct fee if over limit
    if (extraFee > 0) {
      await pool.query('UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2', [extraFee, borrowerId]);
      await pool.query(
        'INSERT INTO transactions (user_id, amount, type, category, description) VALUES ($1, $2, $3, $4, $5)',
        [borrowerId, extraFee, 'debit', 'borrow_fee', `Extra borrow fee for item ${itemId}`]
      );
    }

    const result = await pool.query(
      'INSERT INTO borrows (borrow_id, item_id, borrower_id, status, due_date, duration_days) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [borrowId, itemId, borrowerId, 'requested', dueDate, duration]
    );

    // Increment monthly borrows
    await pool.query('UPDATE users SET borrows_this_month = borrows_this_month + 1 WHERE id = $1', [borrowerId]);
    
    await pool.query('COMMIT');

    res.status(201).json({ message, borrowId: borrowId });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Borrow request error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get borrow requests for items owned by the current user
router.get('/requests', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(`
      SELECT b.*, i.name as item_name, u.name as borrower_name, u.email as borrower_email
      FROM borrows b
      JOIN items i ON b.item_id = i.id
      JOIN users u ON b.borrower_id = u.id
      WHERE i.owner_id = $1 AND b.status = 'requested'
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Get requests error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get borrows for user
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(`
      SELECT b.*, i.name as item_name, i.owner_id, u.name as borrower_name, u.email as borrower_email
      FROM borrows b
      JOIN items i ON b.item_id = i.id
      JOIN users u ON b.borrower_id = u.id
      WHERE b.borrower_id = $1 AND b.status IN ('requested', 'active')
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
    const borrowerId = borrow.borrower_id;
    const itemId = borrow.item_id;
    
    if (Number(borrow.owner_id) != Number(userId)) {
      return res.status(403).json({ error: 'Not authorized to approve this request' });
    }

    if (borrow.status !== 'requested') {
      return res.status(400).json({ error: 'Request has already been processed' });
    }

    // Rental is free for all members in Early Bird phase.
    const totalPrice = 0;
    await pool.query('BEGIN');

    // Update borrow with details and status
    await pool.query(
      'UPDATE borrows SET status = $1, issue_date = $2, due_date = $3, duration_days = $4 WHERE id = $5',
      ['active', issueDate, dueDate, duration, id]
    );

    // Update item status
    await pool.query('UPDATE items SET status = $1 WHERE id = $2', ['borrowed', itemId]);

    await pool.query('COMMIT');

    res.json({ message: 'Borrow request approved and payment processed successfully' });
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

// Return borrowed item
router.put('/:id/return', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Get borrow record
    const borrowResult = await pool.query(`
      SELECT b.* FROM borrows b
      WHERE b.id = $1
    `, [id]);

    if (borrowResult.rows.length === 0) {
      return res.status(404).json({ error: 'Borrow record not found' });
    }

    const borrow = borrowResult.rows[0];
    
    // Only borrower can return
    if (Number(borrow.borrower_id) !== Number(userId)) {
      return res.status(403).json({ error: 'Not authorized to return this item' });
    }

    if (borrow.status !== 'active') {
      return res.status(400).json({ error: 'Item is not currently borrowed' });
    }

    // Update borrow status
    await pool.query('UPDATE borrows SET status = $1 WHERE id = $2', ['returned', id]);

    // Update item status back to available
    await pool.query('UPDATE items SET status = $1 WHERE id = $2', ['available', borrow.item_id]);

    res.json({ message: 'Item returned successfully' });
  } catch (err) {
    console.error('Return item error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get overdue borrows for user
router.get('/overdue', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(`
      SELECT b.*, i.name as item_name, i.owner_id, u.name as borrower_name,
             CURRENT_DATE - b.due_date as days_overdue
      FROM borrows b
      JOIN items i ON b.item_id = i.id
      JOIN users u ON b.borrower_id = u.id
      WHERE (i.owner_id = $1 OR b.borrower_id = $1)
        AND b.status = 'active'
        AND b.due_date < CURRENT_DATE
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Overdue borrows error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;