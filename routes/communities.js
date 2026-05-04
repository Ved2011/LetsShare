const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all public communities + user's communities
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM community_members WHERE community_id = c.id) as member_count,
        EXISTS(SELECT 1 FROM community_members WHERE community_id = c.id AND user_id = $1) as is_member
      FROM communities c
      WHERE c.is_private = false OR c.admin_id = $1 OR EXISTS(SELECT 1 FROM community_members WHERE community_id = c.id AND user_id = $1)
      ORDER BY c.created_at DESC
    `, [userId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching communities:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a community
router.post('/', authenticateToken, async (req, res) => {
  const { name, address, description, max_limit, is_private } = req.body;
  const userId = req.user.id;

  if (!name) return res.status(400).json({ error: 'Community name is required' });

  try {
    await pool.query('BEGIN');
    
    // Check wallet balance
    const userResult = await pool.query('SELECT wallet_balance FROM users WHERE id = $1', [userId]);
    const walletBalance = Number(userResult.rows[0].wallet_balance);
    const creationCost = 200;

    if (walletBalance < creationCost) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: `Insufficient balance. Creating a community costs Rs. ${creationCost}.` });
    }

    // Deduct cost and log transaction
    await pool.query('UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2', [creationCost, userId]);
    await pool.query(
      'INSERT INTO transactions (user_id, amount, type, category, description) VALUES ($1, $2, $3, $4, $5)',
      [userId, creationCost, 'debit', 'platform_fee', `Community creation fee for ${name}`]
    );

    const communityResult = await pool.query(
      'INSERT INTO communities (name, address, description, max_limit, is_private, admin_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, address, description || '', max_limit || 100, is_private || false, userId]
    );
    
    const newCommunity = communityResult.rows[0];
    
    // Add creator as member
    await pool.query(
      'INSERT INTO community_members (community_id, user_id) VALUES ($1, $2)',
      [newCommunity.id, userId]
    );

    await pool.query('COMMIT');
    res.status(201).json({ message: 'Community created successfully', community: newCommunity });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error creating community:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Join a community (public)
router.post('/:id/join', authenticateToken, async (req, res) => {
  const communityId = req.params.id;
  const userId = req.user.id;

  try {
    const commResult = await pool.query('SELECT * FROM communities WHERE id = $1', [communityId]);
    if (commResult.rows.length === 0) return res.status(404).json({ error: 'Community not found' });
    
    const community = commResult.rows[0];
    if (community.is_private) return res.status(403).json({ error: 'This community is private. You need an invite.' });

    const memberCountResult = await pool.query('SELECT COUNT(*) FROM community_members WHERE community_id = $1', [communityId]);
    const memberCount = parseInt(memberCountResult.rows[0].count);
    if (memberCount >= community.max_limit) return res.status(400).json({ error: 'Community has reached its maximum limit.' });

    await pool.query(
      'INSERT INTO community_members (community_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [communityId, userId]
    );

    res.json({ message: 'Successfully joined community' });
  } catch (err) {
    console.error('Error joining community:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user invites
router.get('/invites', authenticateToken, async (req, res) => {
  try {
    // get user email
    const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [req.user.id]);
    const userEmail = userResult.rows[0].email;

    const result = await pool.query(`
      SELECT i.*, c.name as community_name 
      FROM community_invites i 
      JOIN communities c ON i.community_id = c.id 
      WHERE i.invitee_email = $1 AND i.status = 'pending'
    `, [userEmail]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching invites:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Accept invite
router.post('/invites/:id/accept', authenticateToken, async (req, res) => {
  const inviteId = req.params.id;
  const userId = req.user.id;

  try {
    const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
    const userEmail = userResult.rows[0].email;

    const inviteResult = await pool.query('SELECT * FROM community_invites WHERE id = $1 AND invitee_email = $2 AND status = $3', [inviteId, userEmail, 'pending']);
    if (inviteResult.rows.length === 0) return res.status(404).json({ error: 'Invite not found or already processed' });
    
    const invite = inviteResult.rows[0];

    const commResult = await pool.query('SELECT max_limit FROM communities WHERE id = $1', [invite.community_id]);
    const community = commResult.rows[0];

    const memberCountResult = await pool.query('SELECT COUNT(*) FROM community_members WHERE community_id = $1', [invite.community_id]);
    const memberCount = parseInt(memberCountResult.rows[0].count);
    
    if (memberCount >= community.max_limit) return res.status(400).json({ error: 'Community has reached its maximum limit.' });

    await pool.query('BEGIN');
    
    await pool.query('UPDATE community_invites SET status = $1 WHERE id = $2', ['accepted', inviteId]);
    
    await pool.query(
      'INSERT INTO community_members (community_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [invite.community_id, userId]
    );

    await pool.query('COMMIT');
    res.json({ message: 'Successfully joined community via invite' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error accepting invite:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Invite to community
router.post('/:id/invite', authenticateToken, async (req, res) => {
  const communityId = req.params.id;
  const { email } = req.body;
  const userId = req.user.id;

  try {
    const commResult = await pool.query('SELECT * FROM communities WHERE id = $1', [communityId]);
    if (commResult.rows.length === 0) return res.status(404).json({ error: 'Community not found' });
    
    // Check if inviter is a member or admin
    const isMemberResult = await pool.query('SELECT 1 FROM community_members WHERE community_id = $1 AND user_id = $2', [communityId, userId]);
    if (isMemberResult.rows.length === 0 && commResult.rows[0].admin_id !== userId) {
      return res.status(403).json({ error: 'You must be a member to invite others.' });
    }

    await pool.query(
      'INSERT INTO community_invites (community_id, inviter_id, invitee_email) VALUES ($1, $2, $3)',
      [communityId, userId, email]
    );

    res.json({ message: 'Invite sent successfully' });
  } catch (err) {
    console.error('Error sending invite:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin toggle chat
router.put('/:id/chat', authenticateToken, async (req, res) => {
  const communityId = req.params.id;
  const { chat_enabled } = req.body;
  const userId = req.user.id;

  try {
    const userResult = await pool.query('SELECT plan_type FROM users WHERE id = $1', [userId]);
    if (userResult.rows[0].plan_type !== 'Premium') {
      return res.status(403).json({ error: 'Only admins with a Premium plan can enable or disable chat.' });
    }

    const commResult = await pool.query('SELECT admin_id FROM communities WHERE id = $1', [communityId]);
    if (commResult.rows.length === 0) return res.status(404).json({ error: 'Community not found' });
    if (commResult.rows[0].admin_id !== userId) return res.status(403).json({ error: 'Only the admin can change chat settings.' });

    await pool.query('UPDATE communities SET chat_enabled = $1 WHERE id = $2', [chat_enabled, communityId]);
    res.json({ message: `Chat has been ${chat_enabled ? 'enabled' : 'disabled'}.` });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin add member
router.post('/:id/members', authenticateToken, async (req, res) => {
  const communityId = req.params.id;
  const { email } = req.body;
  const adminId = req.user.id;

  try {
    const commResult = await pool.query('SELECT admin_id, max_limit FROM communities WHERE id = $1', [communityId]);
    if (commResult.rows.length === 0) return res.status(404).json({ error: 'Community not found' });
    if (commResult.rows[0].admin_id !== adminId) return res.status(403).json({ error: 'Only the admin can directly add members.' });

    const targetUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (targetUser.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const memberCountResult = await pool.query('SELECT COUNT(*) FROM community_members WHERE community_id = $1', [communityId]);
    if (parseInt(memberCountResult.rows[0].count) >= commResult.rows[0].max_limit) {
      return res.status(400).json({ error: 'Community limit reached.' });
    }

    await pool.query(
      'INSERT INTO community_members (community_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [communityId, targetUser.rows[0].id]
    );
    res.json({ message: 'User added successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin remove member
router.delete('/:id/members/:userId', authenticateToken, async (req, res) => {
  const communityId = req.params.id;
  const targetUserId = req.params.userId;
  const adminId = req.user.id;

  try {
    const commResult = await pool.query('SELECT admin_id FROM communities WHERE id = $1', [communityId]);
    if (commResult.rows.length === 0) return res.status(404).json({ error: 'Community not found' });
    if (commResult.rows[0].admin_id !== adminId) return res.status(403).json({ error: 'Only the admin can remove members.' });

    if (adminId === parseInt(targetUserId)) return res.status(400).json({ error: 'Admin cannot be removed.' });

    await pool.query('DELETE FROM community_members WHERE community_id = $1 AND user_id = $2', [communityId, targetUserId]);
    res.json({ message: 'User removed successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Chat GET messages
router.get('/:id/chat', authenticateToken, async (req, res) => {
  const communityId = req.params.id;
  const userId = req.user.id;

  try {
    const commResult = await pool.query('SELECT chat_enabled FROM communities WHERE id = $1', [communityId]);
    if (commResult.rows.length === 0) return res.status(404).json({ error: 'Community not found' });
    if (!commResult.rows[0].chat_enabled) return res.status(403).json({ error: 'Chat is disabled for this community.' });

    const isMember = await pool.query('SELECT 1 FROM community_members WHERE community_id = $1 AND user_id = $2', [communityId, userId]);
    if (isMember.rows.length === 0) return res.status(403).json({ error: 'You are not a member.' });

    const messages = await pool.query(`
      SELECT m.*, u.name as user_name 
      FROM community_messages m 
      JOIN users u ON m.user_id = u.id 
      WHERE community_id = $1 ORDER BY created_at ASC LIMIT 100
    `, [communityId]);
    
    res.json(messages.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Chat POST message
router.post('/:id/chat', authenticateToken, async (req, res) => {
  const communityId = req.params.id;
  const { message } = req.body;
  const userId = req.user.id;

  if (!message) return res.status(400).json({ error: 'Message cannot be empty.' });

  try {
    const commResult = await pool.query('SELECT chat_enabled FROM communities WHERE id = $1', [communityId]);
    if (commResult.rows.length === 0) return res.status(404).json({ error: 'Community not found' });
    if (!commResult.rows[0].chat_enabled) return res.status(403).json({ error: 'Chat is disabled for this community.' });

    const isMember = await pool.query('SELECT 1 FROM community_members WHERE community_id = $1 AND user_id = $2', [communityId, userId]);
    if (isMember.rows.length === 0) return res.status(403).json({ error: 'You are not a member.' });

    await pool.query('INSERT INTO community_messages (community_id, user_id, message) VALUES ($1, $2, $3)', [communityId, userId, message]);
    res.status(201).json({ message: 'Sent' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
