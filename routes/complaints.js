const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const upload = multer();

const router = express.Router();

// Create complaint
router.post('/', authenticateToken, upload.fields([{ name: 'beforeImage' }, { name: 'afterImage' }]), async (req, res) => {
  const { borrowId, itemName, borrowerName, issueType, severity, issueDescription } = req.body;
  const complainantId = req.user.id;

  try {
    // Get borrow details
    let borrowResult;
    if (isNaN(borrowId)) {
      borrowResult = await pool.query('SELECT * FROM borrows WHERE borrow_id = $1', [borrowId]);
    } else {
      borrowResult = await pool.query('SELECT * FROM borrows WHERE id = $1', [borrowId]);
    }
    if (borrowResult.rows.length === 0) {
      return res.status(400).json({ error: 'Borrow not found' });
    }
    const borrow = borrowResult.rows[0];

    const result = await pool.query(
      'INSERT INTO complaints (borrow_id, complainant_id, accused_id, item_name, borrower_name, issue_type, severity, description, before_image, after_image) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
      [borrow.id, complainantId, borrow.borrower_id, itemName || null, borrowerName || null, issueType || null, severity || null, issueDescription || null, req.files.beforeImage ? req.files.beforeImage[0].buffer : null, req.files.afterImage ? req.files.afterImage[0].buffer : null]
    );
    res.status(201).json({ message: 'Complaint submitted successfully', complaintId: result.rows[0].id });
  } catch (err) {
    console.error('Complaint error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get complaints for user
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(`
<<<<<<< HEAD
      SELECT c.*, b.borrow_id as borrow_ref, i.name as item_name,
        u_complainant.name as complainant_name, u_accused.name as accused_name
      FROM complaints c
      JOIN borrows b ON c.borrow_id = b.id
      JOIN items i ON b.item_id = i.id
      LEFT JOIN users u_complainant ON c.complainant_id = u_complainant.id
      LEFT JOIN users u_accused ON c.accused_id = u_accused.id
      WHERE c.complainant_id = $1 OR c.accused_id = $1
      ORDER BY c.id DESC
=======
      SELECT c.*, b.borrow_id, i.name as item_name
      FROM complaints c
      JOIN borrows b ON c.borrow_id = b.id
      JOIN items i ON b.item_id = i.id
      WHERE c.complainant_id = $1 OR c.accused_id = $1
>>>>>>> 5d0a726 (wer)
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;