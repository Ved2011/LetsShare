const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

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

module.exports = router;
