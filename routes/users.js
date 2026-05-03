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
    const result = await pool.query(
      'SELECT id, name, email, phone, dob, address, two_factor_enabled, profile_picture FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = result.rows[0];
    if (user.profile_picture) {
      user.profilePictureBase64 = user.profile_picture.toString('base64');
    }
    delete user.profile_picture;
    res.json(user);
  } catch (err) {
    console.error('Fetch profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update current user profile
router.put('/me', authenticateToken, upload.single('profilePicture'), async (req, res) => {
  const { name, email, password, phone, dob, address, two_factor_enabled } = req.body;
  const userId = req.user.id;
  const profilePicture = req.file ? req.file.buffer : null;

  try {
    let updateQuery = 'UPDATE users SET name = $1, email = $2, phone = $3, dob = $4, address = $5, two_factor_enabled = $6';
    let values = [name, email, phone, dob, address, two_factor_enabled === 'true'];

    let paramIndex = 7;
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += `, password = $${paramIndex}`;
      values.push(hashedPassword);
      paramIndex++;
    }

    if (profilePicture) {
      updateQuery += `, profile_picture = $${paramIndex}`;
      values.push(profilePicture);
      paramIndex++;
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
