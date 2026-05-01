const express = require('express');
const multer = require('multer');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Multer setup for image uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create complaint
router.post('/', authenticateToken, upload.fields([{ name: 'beforeImage' }, { name: 'afterImage' }]), async (req, res) => {
  const { borrowId, borrowerName, issueType, severity, description } = req.body;
  const complainantId = req.user.id;
  const beforeImage = req.files.beforeImage ? req.files.beforeImage[0].buffer : null;
  const afterImage = req.files.afterImage ? req.files.afterImage[0].buffer : null;

  try {
    // Find accused_id by borrower name (assuming unique name, but better to use email)
    // For now, assume borrowerName is email or find by borrow
    const borrowResult = await pool.query('SELECT borrower_id FROM borrows WHERE id = $1', [borrowId]);
    if (borrowResult.rows.length === 0) {
      return res.status(400).json({ error: 'Borrow not found' });
    }
    const accusedId = borrowResult.rows[0].borrower_id;

    const issue = `${issueType} - ${severity}`;

    const result = await pool.query(
      'INSERT INTO complaints (borrow_id, complainant_id, accused_id, issue, description, before_image, after_image) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [borrowId, complainantId, accusedId, issue, description, beforeImage, afterImage]
    );

    res.status(201).json({ message: 'Complaint submitted successfully', complaintId: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get complaints for user
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(`
      SELECT c.*, b.borrow_id, i.name as item_name, u1.name as complainant_name, u2.name as accused_name
      FROM complaints c
      JOIN borrows b ON c.borrow_id = b.id
      JOIN items i ON b.item_id = i.id
      JOIN users u1 ON c.complainant_id = u1.id
      JOIN users u2 ON c.accused_id = u2.id
      WHERE c.complainant_id = $1 OR c.accused_id = $1
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;