const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all notifications for the current user
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(
      'SELECT id, type, message, is_read, related_id, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const notificationId = req.params.id;
  try {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    );
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Error marking notification read:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark all as read
router.put('/read-all', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1',
      [userId]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Error marking all notifications read:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
