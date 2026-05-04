const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const upload = multer();

const router = express.Router();

// Search users and items
router.get('/search', authenticateToken, async (req, res) => {
  const query = (req.query.q || '').trim();
  const userId = req.user.id;
  if (!query) {
    return res.json({ users: [], items: [] });
  }

  const searchTerm = `%${query}%`;

  try {
    const usersResult = await pool.query(
      `SELECT u.id, u.name, u.email, EXISTS(
          SELECT 1 FROM follows f WHERE f.follower_id = $2 AND f.followed_user_id = u.id
        ) AS is_followed
       FROM users u
       WHERE (u.name ILIKE $1 OR u.email ILIKE $1)
         AND u.id <> $2
       ORDER BY u.name
       LIMIT 20`,
      [searchTerm, userId]
    );

    const itemsResult = await pool.query(
      `SELECT i.id, i.name, i.description, i.status, i.owner_id, u.name AS owner_name
       FROM items i
       JOIN users u ON i.owner_id = u.id
       WHERE i.name ILIKE $1 OR i.description ILIKE $1 OR u.name ILIKE $1
       ORDER BY i.created_at DESC
       LIMIT 20`,
      [searchTerm]
    );

    res.json({ users: usersResult.rows, items: itemsResult.rows });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Follow a user
router.post('/:id/follow', authenticateToken, async (req, res) => {
  const followerId = req.user.id;
  const followedUserId = parseInt(req.params.id, 10);

  if (followerId === followedUserId) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }

  try {
    await pool.query(
      'INSERT INTO follows (follower_id, followed_user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [followerId, followedUserId]
    );
    res.json({ message: 'User followed successfully' });
  } catch (err) {
    console.error('Follow error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Unfollow a user
router.delete('/:id/follow', authenticateToken, async (req, res) => {
  const followerId = req.user.id;
  const followedUserId = parseInt(req.params.id, 10);

  if (followerId === followedUserId) {
    return res.status(400).json({ error: 'Cannot unfollow yourself' });
  }

  try {
    await pool.query(
      'DELETE FROM follows WHERE follower_id = $1 AND followed_user_id = $2',
      [followerId, followedUserId]
    );
    res.json({ message: 'User unfollowed successfully' });
  } catch (err) {
    console.error('Unfollow error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

const bcrypt = require('bcryptjs');

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT id, name, username, email, phone, dob, address, two_factor_enabled, profile_picture, plan_type, borrows_this_month, last_borrow_reset, wallet_balance, upi_id FROM users WHERE id = $1',
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    let user = result.rows[0];
    
    // Check if we need to reset monthly borrows
    const now = new Date();
    const lastReset = new Date(user.last_borrow_reset);
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      await pool.query('UPDATE users SET borrows_this_month = 0, last_borrow_reset = $1 WHERE id = $2', [now, userId]);
      user.borrows_this_month = 0;
      user.last_borrow_reset = now;
    }

    if (user.profile_picture) {
      user.profilePictureBase64 = user.profile_picture.toString('base64');
    }
    res.json(user);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upgrade plan
router.post('/upgrade-plan', authenticateToken, async (req, res) => {
  const { planType } = req.body;
  const userId = req.user.id;

  if (!['Free', 'Pro', 'Premium'].includes(planType)) {
    return res.status(400).json({ error: 'Invalid plan type' });
  }

  try {
    await pool.query(
      'UPDATE users SET plan_type = $1 WHERE id = $2',
      [planType, userId]
    );
    res.json({ message: `Upgraded to ${planType} plan` });
  } catch (err) {
    console.error('Upgrade plan error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add money to wallet (Simulated)
router.post('/add-money', authenticateToken, async (req, res) => {
  const { amount } = req.body;
  const userId = req.user.id;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    await pool.query('BEGIN');
    
    await pool.query('UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2', [amount, userId]);
    await pool.query(
      'INSERT INTO transactions (user_id, amount, type, category, description) VALUES ($1, $2, $3, $4, $5)',
      [userId, amount, 'credit', 'topup', 'Wallet top-up (Simulated)']
    );

    await pool.query('COMMIT');
    res.json({ message: `Successfully added Rs. ${amount} to your wallet.` });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Add money error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update current user profile
router.put('/me', authenticateToken, upload.single('profilePicture'), async (req, res) => {
  const { name, username, email, oldPassword, newPassword, phone, dob, address, two_factor_enabled, upi_id } = req.body;
  const userId = req.user.id;
  const profilePicture = req.file ? req.file.buffer : null;

  try {
    // If it's a simple JSON update for UPI ID
    if (upi_id !== undefined && Object.keys(req.body).length === 1) {
      await pool.query('UPDATE users SET upi_id = $1 WHERE id = $2', [upi_id, userId]);
      return res.json({ message: 'Payout info updated successfully' });
    }

    // Get current user to check password
    const userResult = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    let updateQuery = 'UPDATE users SET name = $1, email = $2, phone = $3, dob = $4, address = $5, two_factor_enabled = $6, username = $7';
    let values = [name, email, phone, dob, address, two_factor_enabled === 'true', username];
    let paramIndex = 8;

    if (newPassword && newPassword.trim() !== '') {
      if (!oldPassword) {
        return res.status(400).json({ error: 'Old password is required to set a new one' });
      }
      
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Incorrect old password' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateQuery += `, password = $${paramIndex++}`;
      values.push(hashedPassword);
    }

    if (profilePicture) {
      updateQuery += `, profile_picture = $${paramIndex++}`;
      values.push(profilePicture);
    }
    
    if (upi_id !== undefined) {
      updateQuery += `, upi_id = $${paramIndex++}`;
      values.push(upi_id);
    }

    updateQuery += ` WHERE id = $${paramIndex}`;
    values.push(userId);

    await pool.query(updateQuery, values);
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Update profile error:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email already in use' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
