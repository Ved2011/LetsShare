const express = require('express');
const { pool } = require('../db');
const { authenticateToken, authenticateTokenOptional } = require('../middleware/auth');
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
      `SELECT i.id, i.name, d.description, i.status, i.owner_id, u.name AS owner_name
       FROM items i
       JOIN users u ON i.owner_id = u.id
       LEFT JOIN item_details d ON i.id = d.item_id
       WHERE i.name ILIKE $1 OR d.description ILIKE $1 OR d.category ILIKE $1 OR u.name ILIKE $1
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
  const followingId = parseInt(req.params.id, 10);

  if (followerId === followingId) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }

  try {
    await pool.query(
      'INSERT INTO follows (follower_id, followed_user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [followerId, followingId]
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
  const followingId = parseInt(req.params.id, 10);

  try {
    await pool.query(
      'DELETE FROM follows WHERE follower_id = $1 AND followed_user_id = $2',
      [followerId, followingId]
    );
    res.json({ message: 'User unfollowed successfully' });
  } catch (err) {
    console.error('Unfollow error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get users I follow
router.get('/following', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.username
      FROM users u
      JOIN follows f ON u.id = f.followed_user_id
      WHERE f.follower_id = $1
      ORDER BY u.name
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get recent items from followed users
router.get('/following/items', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(`
      SELECT i.id, i.name, i.status, i.image, i.owner_id, i.created_at,
             u.name as owner_name
      FROM items i
      JOIN users u ON i.owner_id = u.id
      JOIN follows f ON u.id = f.followed_user_id
      WHERE f.follower_id = $1
      ORDER BY i.created_at DESC
      LIMIT 50
    `, [userId]);
    
    const items = result.rows.map(item => {
      if (item.image) {
        item.imageBase64 = `data:image/jpeg;base64,${item.image.toString('base64')}`;
      }
      return item;
    });
    res.json(items);
  } catch (err) {
    console.error('Error fetching following items:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Global Search (Communities, Items, Users)
router.get('/global-search', authenticateToken, async (req, res) => {
  const query = (req.query.q || '').trim();
  const userId = req.user.id;
  if (!query) return res.json([]);

  const searchTerm = `%${query}%`;
  try {
    const result = await pool.query(`
      (SELECT id, name, 'Community' as category, COALESCE(city || ', ' || state, address) as subtext 
       FROM communities 
       WHERE name ILIKE $1 OR address ILIKE $1 OR city ILIKE $1 OR state ILIKE $1 OR locality ILIKE $1 
       LIMIT 10)
      UNION ALL
      (SELECT id, name, 'Item' as category, 'Item' as subtext FROM items WHERE name ILIKE $1 LIMIT 10)
      UNION ALL
      (SELECT id, name, 'User' as category, email as subtext FROM users WHERE (name ILIKE $1 OR email ILIKE $1) AND id <> $2 LIMIT 10)
      ORDER BY category, name
    `, [searchTerm, userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

const bcrypt = require('bcryptjs');



// Get users who follow me
router.get('/followers', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.username
      FROM users u
      JOIN follows f ON u.id = f.follower_id
      WHERE f.followed_user_id = $1
      ORDER BY u.name
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT id, name, username, email, phone, dob, address, locality, city, state, country, two_factor_enabled, profile_picture, plan_type, borrows_this_month, last_borrow_reset, wallet_balance, upi_id, bio, is_site_admin FROM users WHERE id = $1',
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

// Get user's own warnings
router.get('/warnings', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(
      `SELECT w.*, u.name as admin_name
       FROM user_warnings w
       LEFT JOIN users u ON w.admin_id = u.id
       WHERE w.user_id = $1 AND w.acknowledged = false
       ORDER BY w.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching user warnings:', err);
    res.status(500).json({ error: 'Server error fetching warnings' });
  }
});

// Acknowledge a warning
router.put('/warnings/:id/acknowledge', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const warningId = req.params.id;
  try {
    const result = await pool.query(
      'UPDATE user_warnings SET acknowledged = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [warningId, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Warning not found or not authorized' });
    }
    res.json({ message: 'Warning acknowledged successfully', warning: result.rows[0] });
  } catch (err) {
    console.error('Error acknowledging warning:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get specific user profile
router.get('/:id', authenticateTokenOptional, async (req, res) => {
  const targetUserIdStr = req.params.id;
  console.log('GET user profile hit for ID string:', targetUserIdStr);
  
  if (isNaN(targetUserIdStr)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  
  const targetUserId = parseInt(targetUserIdStr, 10);
  const currentUserId = req.user ? req.user.id : null;
  console.log('Fetching profile for targetUserId:', targetUserId, 'by viewer:', currentUserId);

  try {
    const allUsers = await pool.query('SELECT id FROM users');
    console.log('Available User IDs in DB:', allUsers.rows.map(r => r.id));

    const result = await pool.query(
      `SELECT id, name, email, username, profile_picture, bio FROM users WHERE id = $1`,
      [targetUserId]
    );

    console.log('Query result rows:', result.rows.length);

    if (result.rows.length === 0) {
      console.log('User not found in DB for ID:', targetUserId);
      return res.status(404).json({ error: 'User not found' });
    }

    let user = result.rows[0];
    user.is_followed = false;

    if (currentUserId) {
      const followCheck = await pool.query(
        `SELECT 1 FROM follows WHERE follower_id = $1 AND followed_user_id = $2`,
        [currentUserId, targetUserId]
      );
      user.is_followed = followCheck.rows.length > 0;
    }

    if (user.profile_picture) {
      user.profilePictureBase64 = user.profile_picture.toString('base64');
      delete user.profile_picture;
    }

    res.json(user);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upgrade plan
router.post('/upgrade-plan', authenticateToken, async (req, res) => {
  const { planType } = req.body;
  const userId = req.user.id;

  const planCosts = {
    'Free': 0,
    'Pro': 50,
    'Premium': 120
  };

  if (!planCosts.hasOwnProperty(planType)) {
    return res.status(400).json({ error: 'Invalid plan type' });
  }

  const cost = planCosts[planType];

  try {
    await pool.query('BEGIN');

    // Get current user data
    const userResult = await pool.query('SELECT wallet_balance, plan_type FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (user.plan_type === planType && planType !== 'Free') {
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: `You are already on the ${planType} plan.` });
    }

    if (cost > 0) {
      if (Number(user.wallet_balance) < cost) {
        await pool.query('ROLLBACK');
        return res.status(400).json({ error: `Insufficient balance. ${planType} plan costs Rs. ${cost}.` });
      }

      // Deduct balance
      await pool.query('UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2', [cost, userId]);
      
      // Log transaction
      await pool.query(
        'INSERT INTO transactions (user_id, amount, type, category, description) VALUES ($1, $2, $3, $4, $5)',
        [userId, cost, 'debit', 'subscription', `Upgrade to ${planType} plan`]
      );
    }

    // Update user plan and set expiry to 30 days from now
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    await pool.query(
      'UPDATE users SET plan_type = $1, plan_expiry = $2 WHERE id = $3',
      [planType, expiryDate, userId]
    );

    await pool.query('COMMIT');
    res.json({ message: `Successfully upgraded to ${planType} plan. Valid until ${expiryDate.toLocaleDateString()}` });
  } catch (err) {
    await pool.query('ROLLBACK');
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
  const { name, username, email, oldPassword, newPassword, phone, dob, address, two_factor_enabled, upi_id, bio, locality, city, state, country } = req.body;
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

    let updateQuery = 'UPDATE users SET name = $1, email = $2, phone = $3, dob = $4, address = $5, two_factor_enabled = $6, username = $7, bio = $8, locality = $9, city = $10, state = $11, country = $12';
    let values = [name, email, phone, dob, address, two_factor_enabled === 'true', username, bio, locality, city, state, country];
    let paramIndex = 13;

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

// Delete current user account
router.delete('/me', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const userResult = await pool.query('SELECT email, name FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { email, name } = userResult.rows[0];

    // Check if user has active borrows or lent items
    const activeItems = await pool.query(`
      SELECT 1 FROM items WHERE (owner_id = $1 AND status = 'borrowed')
      UNION
      SELECT 1 FROM borrows WHERE borrower_id = $1 AND status = 'active'
    `, [userId]);

    if (activeItems.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete account with active borrowed or lent items. Please return them first.' });
    }

    // Perform deletion
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    // Send automated email
    try {
      const { sendEmail } = require('../utils/email');
      await sendEmail(
        email,
        'Account Deleted - LetsShare',
        `Hello ${name},\n\nYour LetsShare account has been successfully deleted.`,
        `<div style="font-family: sans-serif; padding: 20px;">
          <h2>Account Deleted</h2>
          <p>Hello ${name},</p>
          <p>Your LetsShare account and all associated data have been deleted.</p>
          <p>We're sorry to see you go!</p>
        </div>`
      );
    } catch (mailErr) {
      console.error('Failed to send account deletion email:', mailErr);
    }

    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
