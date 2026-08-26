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
    const [userRes, itemsRes, communitiesRes, borrowedRes, warningsRes] = await Promise.all([
      pool.query('SELECT id, name, email, username, city, state, country, is_verified, is_site_admin, plan_type, created_at, last_login FROM users WHERE id = $1', [id]),
      pool.query('SELECT id, name, status, price_per_day, brand, condition, created_at FROM items WHERE owner_id = $1 ORDER BY created_at DESC', [id]),
      pool.query(`
        SELECT c.id, c.name, c.description, c.is_private, cm.joined_at
        FROM communities c
        JOIN community_members cm ON cm.community_id = c.id
        WHERE cm.user_id = $1
        ORDER BY cm.joined_at DESC
      `, [id]),
      pool.query(`
        SELECT i.id, i.name, b.status as borrow_status, b.issue_date, b.due_date
        FROM borrows b
        JOIN items i ON b.item_id = i.id
        WHERE b.borrower_id = $1
        ORDER BY b.created_at DESC
      `, [id]),
      pool.query(`
        SELECT w.*, u.name as admin_name
        FROM user_warnings w
        LEFT JOIN users u ON w.admin_id = u.id
        WHERE w.user_id = $1
        ORDER BY w.created_at DESC
      `, [id])
    ]);

    if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    res.json({
      user: userRes.rows[0],
      items: itemsRes.rows,
      communities: communitiesRes.rows,
      borrowed: borrowedRes.rows,
      warnings: warningsRes.rows
    });
  } catch (err) {
    console.error('Error fetching user details:', err);
    res.status(500).json({ error: 'Server error fetching user details' });
  }
});

router.post('/users/:id/warn', authenticateToken, requireSiteAdmin, async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const { category, message } = req.body;

  if (!category || !message) {
    return res.status(400).json({ error: 'Category and message are required.' });
  }

  const validCategories = ['Terms of Service', 'Inappropriate Content', 'Spam', 'Harassment', 'Other'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({ error: 'Invalid warning category.' });
  }

  try {
    await pool.query('BEGIN');

    // 1. Insert the warning
    const warningResult = await pool.query(`
      INSERT INTO user_warnings (user_id, admin_id, category, message)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [id, adminId, category, message]);

    const newWarning = warningResult.rows[0];

    // 2. Count current unacknowledged / total warnings for user
    const warnCountResult = await pool.query('SELECT COUNT(*) FROM user_warnings WHERE user_id = $1', [id]);
    const totalWarnings = parseInt(warnCountResult.rows[0].count, 10);

    // Get current user details
    const userResult = await pool.query('SELECT name, email, is_suspended, is_deactivated, suspension_count FROM users WHERE id = $1', [id]);
    const targetUser = userResult.rows[0];

    let actionTakenText = 'Warning issued successfully.';
    let remainingWarnings = 5 - (totalWarnings % 5);
    if (remainingWarnings === 0) remainingWarnings = 5;

    // 3. Check suspension threshold (happens every 5 warnings)
    if (totalWarnings > 0 && totalWarnings % 5 === 0) {
      const newSuspensionCount = targetUser.suspension_count + 1;
      
      if (newSuspensionCount >= 2) {
        // Deactivate permanently on 2nd suspension
        await pool.query('UPDATE users SET is_deactivated = true, is_suspended = true, suspension_count = $1 WHERE id = $2', [newSuspensionCount, id]);
        actionTakenText = 'User has received 5 warnings for the 2nd time and is now PERMANENTLY DEACTIVATED.';
      } else {
        // Suspend until manual admin reactivation
        await pool.query('UPDATE users SET is_suspended = true, suspension_count = $1 WHERE id = $2', [newSuspensionCount, id]);
        actionTakenText = 'User has received 5 warnings and is now SUSPENDED until reactivated by an Admin.';
      }
    }

    // Insert warning system alert into notifications table
    let noticeMessage = `Notice: You have received a warning (${category}). You have ${remainingWarnings} warnings remaining before automatic account suspension.`;
    if (totalWarnings % 5 === 0) {
      noticeMessage = `CRITICAL: Your account has been suspended due to receiving ${totalWarnings} warnings.`;
    }
    
    await pool.query(
      "INSERT INTO notifications (user_id, type, message) VALUES ($1, 'warning', $2)",
      [id, noticeMessage]
    );

    await pool.query('COMMIT');
    res.status(201).json({ 
      message: actionTakenText, 
      warning: newWarning,
      total_warnings: totalWarnings,
      warnings_left: remainingWarnings
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error warning user:', err);
    res.status(500).json({ error: 'Server error saving warning.' });
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

// Reactivate / Unsuspend a user account manually
router.put('/users/:id/unsuspend', authenticateToken, requireSiteAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE users SET is_suspended = false, is_deactivated = false WHERE id = $1 RETURNING id, name, email',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User account has been successfully reactivated.', user: result.rows[0] });
  } catch (err) {
    console.error('Error unsuspending user:', err);
    res.status(500).json({ error: 'Server error reactivating user' });
  }
});

module.exports = router;
