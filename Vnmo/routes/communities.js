const express = require('express');
const { pool } = require('../db');
const { authenticateToken, authenticateTokenOptional } = require('../middleware/auth');

const router = express.Router();

// Get all public communities + user's communities
router.get('/', authenticateTokenOptional, async (req, res) => {
  try {
    let userId = req.user?.id ? parseInt(req.user.id) : null;
    if (userId && isNaN(userId)) userId = null;
    const { city, state, locality, country } = req.query;
    
    let query = `
      SELECT c.*, 
        (SELECT COUNT(*) FROM public.community_members WHERE community_id = c.id) as member_count,
        (SELECT COUNT(*) FROM public.items i 
         JOIN public.community_members cm ON i.owner_id = cm.user_id 
         WHERE cm.community_id = c.id AND (i.exclusive_community_id IS NULL OR i.exclusive_community_id = c.id)) as item_count,
        EXISTS(SELECT 1 FROM public.community_members WHERE community_id = c.id AND user_id = $1) as is_member,
        EXISTS(SELECT 1 FROM public.community_members WHERE community_id = c.id AND user_id = $1 AND is_admin = true) as is_current_user_admin
      FROM public.communities c
      WHERE (c.is_private = false OR c.admin_id = $1 OR EXISTS(SELECT 1 FROM public.community_members WHERE community_id = c.id AND user_id = $1))
      AND ($1::int IS NULL OR c.city = (SELECT city FROM users WHERE id = $1))
    `;
    const params = [userId];

    if (city) {
      query += ` AND c.city ILIKE $${params.length + 1}`;
      params.push(`%${city}%`);
    }
    if (state) {
      query += ` AND c.state ILIKE $${params.length + 1}`;
      params.push(`%${state}%`);
    }
    if (locality) {
      query += ` AND c.locality ILIKE $${params.length + 1}`;
      params.push(`%${locality}%`);
    }
    if (country) {
      query += ` AND c.country ILIKE $${params.length + 1}`;
      params.push(`%${country}%`);
    }

    query += ` ORDER BY c.created_at DESC`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching communities:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
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

// Get single community details
router.get('/:id', authenticateToken, async (req, res) => {
  const communityId = req.params.id;
  const userId = req.user.id;
  try {
    const result = await pool.query(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM community_members WHERE community_id = c.id) as member_count,
        (SELECT COUNT(*) FROM items i 
         JOIN community_members cm ON i.owner_id = cm.user_id 
         WHERE cm.community_id = c.id AND (i.exclusive_community_id IS NULL OR i.exclusive_community_id = c.id)) as item_count,
        EXISTS(SELECT 1 FROM community_members WHERE community_id = c.id AND user_id = $2) as is_member,
        EXISTS(SELECT 1 FROM community_members WHERE community_id = c.id AND user_id = $2 AND is_admin = true) as is_current_user_admin
      FROM communities c
      WHERE c.id = $1
    `, [communityId, userId]);
    
    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Community not found' });
    }
    
    const community = result.rows[0];
    // Check if user has access
    if (community.is_private && !community.is_member && community.admin_id !== userId) {
        return res.status(403).json({ error: 'This is a private community.' });
    }
    
    res.json(community);
  } catch (err) {
    console.error('Error fetching community details:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a community
router.post('/', authenticateToken, async (req, res) => {
    const { name, address, description, max_limit, is_private, city, state, locality, country } = req.body;
    const userId = parseInt(req.user.id);
    if (isNaN(userId)) return res.status(401).json({ error: 'Invalid user ID in token' });

    if (!name) return res.status(400).json({ error: 'Community name is required' });

    try {
      await pool.query('BEGIN');
      
      // Community creation is free in Early Bird phase.
      const creationCost = 0;

      const communityResult = await pool.query(
        'INSERT INTO communities (name, address, description, max_limit, is_private, admin_id, city, state, locality, country, chat_enabled) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true) RETURNING *',
        [name, address || '', description || '', parseInt(max_limit) || 100, is_private || false, userId, city || null, state || null, locality || null, country || 'India']
      );
    
    const newCommunity = communityResult.rows[0];
    
    // Add creator as member and admin
    await pool.query(
      'INSERT INTO community_members (community_id, user_id, is_admin) VALUES ($1, $2, $3)',
      [newCommunity.id, userId, true]
    );

    await pool.query('COMMIT');
    res.status(201).json({ message: 'Community created successfully', community: newCommunity });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error creating community:', err);
    res.status(500).json({ error: 'Server error', details: err.message, stack: err.stack });
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
    
    // Check admin status to bypass limit
    const userResult = await pool.query('SELECT is_site_admin FROM users WHERE id = $1', [userId]);
    const isSiteAdmin = userResult.rows[0]?.is_site_admin || false;

    if (!isSiteAdmin && memberCount >= community.max_limit) {
      return res.status(400).json({ error: 'Community has reached its maximum limit.' });
    }

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
  const { identifier } = req.body;
  const userId = req.user.id;

  if (!identifier) return res.status(400).json({ error: 'Email or Username is required' });

  try {
    const commResult = await pool.query('SELECT * FROM communities WHERE id = $1', [communityId]);
    if (commResult.rows.length === 0) return res.status(404).json({ error: 'Community not found' });
    const community = commResult.rows[0];
    
    // Check if inviter is a member or admin
    const isMemberResult = await pool.query('SELECT 1 FROM community_members WHERE community_id = $1 AND user_id = $2', [communityId, userId]);
    if (isMemberResult.rows.length === 0 && community.admin_id !== userId) {
      return res.status(403).json({ error: 'You must be a member to invite others.' });
    }

    let targetEmail = identifier;
    // Check if identifier is a username
    if (!identifier.includes('@')) {
      const userResult = await pool.query('SELECT email FROM users WHERE username = $1 OR name = $1', [identifier]);
      if (userResult.rows.length === 0) return res.status(404).json({ error: 'User with this username not found' });
      targetEmail = userResult.rows[0].email;
    }

    await pool.query(
      'INSERT INTO community_invites (community_id, inviter_id, invitee_email) VALUES ($1, $2, $3)',
      [communityId, userId, targetEmail]
    );

    // Send invite email
    try {
      const { sendEmail } = require('../utils/email');
      const inviterResult = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
      const inviterName = inviterResult.rows[0].name;

      await sendEmail(
        targetEmail,
        `Invitation to join ${community.name} on LetsShare`,
        `${inviterName} has invited you to join the community "${community.name}" on LetsShare. Login to accept the invite.`,
        `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2>Community Invitation</h2>
          <p><strong>${inviterName}</strong> has invited you to join the community <strong>"${community.name}"</strong> on LetsShare.</p>
          <p>Join now to start sharing and borrowing items with your community!</p>
          <a href="${process.env.APP_URL || 'http://localhost:4000'}/login.html" style="display: inline-block; padding: 10px 20px; background-color: #4f7cde; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">Login to Accept</a>
        </div>`
      );
    } catch (mailErr) {
      console.error('Failed to send invite email:', mailErr);
    }

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
    // Plan type check removed for Early Bird phase.

    // Check if user is an admin in this community
    const adminCheck = await pool.query('SELECT 1 FROM community_members WHERE community_id = $1 AND user_id = $2 AND is_admin = true', [communityId, userId]);
    if (adminCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Only admins can change chat settings.' });
    }

    await pool.query('UPDATE communities SET chat_enabled = $1 WHERE id = $2', [chat_enabled, communityId]);
    res.json({ message: `Chat has been ${chat_enabled ? 'enabled' : 'disabled'}.` });
  } catch (err) {
    console.error('Error toggling chat:', err);
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

// Get community members
router.get('/:id/members', authenticateToken, async (req, res) => {
  const communityId = req.params.id;
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, cm.is_admin 
      FROM users u 
      JOIN community_members cm ON u.id = cm.user_id 
      WHERE cm.community_id = $1
      ORDER BY cm.is_admin DESC, u.name ASC
    `, [communityId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching members:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Leave a community
router.post('/:id/leave', authenticateToken, async (req, res) => {
  const communityId = req.params.id;
  const userId = req.user.id;

  try {
    const commResult = await pool.query('SELECT admin_id FROM communities WHERE id = $1', [communityId]);
    if (commResult.rows.length === 0) return res.status(404).json({ error: 'Community not found' });
    
    // Check if user is the primary admin or one of the admins
    const memberResult = await pool.query('SELECT is_admin FROM community_members WHERE community_id = $1 AND user_id = $2', [communityId, userId]);
    if (memberResult.rows.length === 0) return res.status(400).json({ error: 'You are not a member of this community.' });

    const isAdmin = memberResult.rows[0].is_admin;

    if (isAdmin) {
      // Check if there are other admins
      const otherAdmins = await pool.query('SELECT COUNT(*) FROM community_members WHERE community_id = $1 AND is_admin = true AND user_id <> $2', [communityId, userId]);
      if (parseInt(otherAdmins.rows[0].count) === 0) {
        return res.status(400).json({ error: 'You are the only admin. You must promote another member to admin before leaving or delete the community.' });
      }
    }

    await pool.query('DELETE FROM community_members WHERE community_id = $1 AND user_id = $2', [communityId, userId]);
    
    // If user was the primary admin (admin_id in communities table), transfer it to another admin
    if (commResult.rows[0].admin_id === userId) {
        const nextAdmin = await pool.query('SELECT user_id FROM community_members WHERE community_id = $1 AND is_admin = true LIMIT 1', [communityId]);
        if (nextAdmin.rows.length > 0) {
            await pool.query('UPDATE communities SET admin_id = $1 WHERE id = $2', [nextAdmin.rows[0].user_id, communityId]);
        }
    }

    res.json({ message: 'Successfully left the community' });
  } catch (err) {
    console.error('Error leaving community:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a community
router.delete('/:id', authenticateToken, async (req, res) => {
  const communityId = req.params.id;
  const userId = req.user.id;

  try {
    const commResult = await pool.query('SELECT admin_id FROM communities WHERE id = $1', [communityId]);
    if (commResult.rows.length === 0) return res.status(404).json({ error: 'Community not found' });
    
    // Check if user is an admin
    const memberResult = await pool.query('SELECT is_admin FROM community_members WHERE community_id = $1 AND user_id = $2', [communityId, userId]);
    if (memberResult.rows.length === 0 || !memberResult.rows[0].is_admin) {
        return res.status(403).json({ error: 'Only admins can delete the community.' });
    }

    await pool.query('DELETE FROM communities WHERE id = $1', [communityId]);
    res.json({ message: 'Community deleted successfully' });
  } catch (err) {
    console.error('Error deleting community:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle admin status of a member
router.put('/:id/members/:targetUserId/admin', authenticateToken, async (req, res) => {
  const communityId = req.params.id;
  const targetUserId = req.params.targetUserId;
  const { is_admin } = req.body;
  const userId = req.user.id;

  try {
    // Check if requester is an admin
    const requesterResult = await pool.query('SELECT is_admin FROM community_members WHERE community_id = $1 AND user_id = $2', [communityId, userId]);
    if (requesterResult.rows.length === 0 || !requesterResult.rows[0].is_admin) {
        return res.status(403).json({ error: 'Only admins can manage admin roles.' });
    }

    // Check if target is a member
    const targetResult = await pool.query('SELECT 1 FROM community_members WHERE community_id = $1 AND user_id = $2', [communityId, targetUserId]);
    if (targetResult.rows.length === 0) return res.status(404).json({ error: 'Target user is not a member of this community.' });

    await pool.query('UPDATE community_members SET is_admin = $1 WHERE community_id = $2 AND user_id = $3', [is_admin, communityId, targetUserId]);
    
    res.json({ message: `User role updated to ${is_admin ? 'Admin' : 'Member'}.` });
  } catch (err) {
    console.error('Error updating admin role:', err);
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
    console.error('Error in GET /chat:', err);
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
    console.error('Error in POST /chat:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get items for a community
router.get('/:id/items', authenticateToken, async (req, res) => {
    try {
        const communityId = req.params.id;
        const items = await pool.query(`
            SELECT i.*, idt.category, idt.description, idt.image
            FROM items i
            JOIN users u ON i.owner_id = u.id
            JOIN community_members cm ON u.id = cm.user_id
            LEFT JOIN item_details idt ON i.id = idt.item_id
            WHERE cm.community_id = $1
            ORDER BY i.created_at DESC
        `, [communityId]);
        res.json(items.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
