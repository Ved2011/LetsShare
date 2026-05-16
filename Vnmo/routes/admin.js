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

// ── COMPLAINTS ──────────────────────────────────────────────────────────────

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

// ── USERS ───────────────────────────────────────────────────────────────────

// Get all users with their item count and communities
router.get('/users', authenticateToken, requireSiteAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.username, u.city, u.state, u.country,
        u.is_verified, u.is_site_admin, u.plan_type, u.created_at, u.last_login,
        COUNT(DISTINCT i.id) AS item_count,
        COUNT(DISTINCT cm.community_id) AS community_count
      FROM users u
      LEFT JOIN items i ON i.owner_id = u.id
      LEFT JOIN community_members cm ON cm.user_id = u.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching admin users:', err);
    res.status(500).json({ error: 'Server error fetching users' });
  }
});

// Get a single user's full profile: items + communities
router.get('/users/:id/details', authenticateToken, requireSiteAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const [userRes, itemsRes, communitiesRes] = await Promise.all([
      pool.query('SELECT id, name, email, username, city, state, country, is_verified, is_site_admin, plan_type, created_at, last_login FROM users WHERE id = $1', [id]),
      pool.query('SELECT id, name, status, price_per_day, brand, condition, created_at FROM items WHERE owner_id = $1 ORDER BY created_at DESC', [id]),
      pool.query(`
        SELECT c.id, c.name, c.description, c.is_private, cm.joined_at
        FROM communities c
        JOIN community_members cm ON cm.community_id = c.id
        WHERE cm.user_id = $1
        ORDER BY cm.joined_at DESC
      `, [id])
    ]);

    if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    res.json({
      user: userRes.rows[0],
      items: itemsRes.rows,
      communities: communitiesRes.rows
    });
  } catch (err) {
    console.error('Error fetching user details:', err);
    res.status(500).json({ error: 'Server error fetching user details' });
  }
});

// Delete a user (cascades to their items, borrows, etc.)
router.delete('/users/:id', authenticateToken, requireSiteAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    // Prevent deleting self
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own admin account.' });
    }
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Server error deleting user' });
  }
});

// ── ITEMS ───────────────────────────────────────────────────────────────────

// Get all items
router.get('/items', authenticateToken, requireSiteAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.id, i.name, i.status, i.price_per_day, i.brand, i.condition, i.created_at,
             u.name AS owner_name, u.email AS owner_email, u.id AS owner_id
      FROM items i
      JOIN users u ON i.owner_id = u.id
      ORDER BY i.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching admin items:', err);
    res.status(500).json({ error: 'Server error fetching items' });
  }
});

// Delete an item
router.delete('/items/:id', authenticateToken, requireSiteAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM items WHERE id = $1', [id]);
    res.json({ message: 'Item deleted successfully.' });
  } catch (err) {
    console.error('Error deleting item:', err);
    res.status(500).json({ error: 'Server error deleting item' });
  }
});

// ── COMMUNITIES ─────────────────────────────────────────────────────────────

// Get all communities with member count
router.get('/communities', authenticateToken, requireSiteAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.id, c.name, c.description, c.is_private, c.max_limit, c.chat_enabled,
        c.city, c.state, c.country, c.created_at,
        u.name AS admin_name, u.email AS admin_email,
        COUNT(cm.user_id) AS member_count
      FROM communities c
      LEFT JOIN users u ON c.admin_id = u.id
      LEFT JOIN community_members cm ON cm.community_id = c.id
      GROUP BY c.id, u.name, u.email
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching admin communities:', err);
    res.status(500).json({ error: 'Server error fetching communities' });
  }
});

// Delete a community
router.delete('/communities/:id', authenticateToken, requireSiteAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM communities WHERE id = $1', [id]);
    res.json({ message: 'Community deleted successfully.' });
  } catch (err) {
    console.error('Error deleting community:', err);
    res.status(500).json({ error: 'Server error deleting community' });
  }
});

// Remove a member from a community
router.delete('/communities/:communityId/members/:userId', authenticateToken, requireSiteAdmin, async (req, res) => {
  const { communityId, userId } = req.params;
  try {
    await pool.query('DELETE FROM community_members WHERE community_id = $1 AND user_id = $2', [communityId, userId]);
    res.json({ message: 'Member removed from community.' });
  } catch (err) {
    console.error('Error removing member:', err);
    res.status(500).json({ error: 'Server error removing member' });
  }
});

module.exports = router;
