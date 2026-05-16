const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Middleware to check if user is a site admin
const requireSiteAdmin = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await pool.query('SELECT is_site_admin FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0 || !result.rows[0].is_site_admin) {
      return res.status(403).json({ error: 'Access denied: Site Admin only.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: 'Server error checking admin status.' });
  }
};

// Get all complaints
router.get('/complaints', authenticateToken, requireSiteAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, b.borrow_id as borrow_ref, i.name as actual_item_name,
             comp.name as complainant_name, acc.name as accused_name
      FROM complaints c
      JOIN borrows b ON c.borrow_id = b.id
      JOIN items i ON b.item_id = i.id
      JOIN users comp ON c.complainant_id = comp.id
      JOIN users acc ON c.accused_id = acc.id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching admin complaints:', err);
    res.status(500).json({ error: 'Server error fetching complaints' });
  }
});

// Update complaint status
router.put('/complaints/:id/status', authenticateToken, requireSiteAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await pool.query('UPDATE complaints SET status = $1 WHERE id = $2', [status, id]);
    res.json({ message: 'Complaint status updated successfully.' });
  } catch (err) {
    console.error('Error updating complaint status:', err);
    res.status(500).json({ error: 'Server error updating complaint' });
  }
});

module.exports = router;
