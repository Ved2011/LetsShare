const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 1. Send Chat Invite to a community member
router.post('/invite', authenticateToken, async (req, res) => {
  const senderId = req.user.id;
  const { receiver_id } = req.body;

  if (!receiver_id || parseInt(receiver_id) === senderId) {
    return res.status(400).json({ error: 'Invalid recipient' });
  }

  try {
    // Security check: Verify users share at least one community
    const shareCommunity = await pool.query(`
      SELECT 1 FROM community_members cm1
      JOIN community_members cm2 ON cm1.community_id = cm2.community_id
      WHERE cm1.user_id = $1 AND cm2.user_id = $2
    `, [senderId, receiver_id]);

    if (shareCommunity.rows.length === 0) {
      return res.status(403).json({ error: 'You can only chat with members of your communities.' });
    }

    // Check existing invite
    const existing = await pool.query(
      'SELECT * FROM direct_chat_invites WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)',
      [senderId, receiver_id]
    );

    if (existing.rows.length > 0) {
      const inv = existing.rows[0];
      if (inv.status === 'accepted') {
        return res.json({ message: 'Chat is already active!', status: 'accepted' });
      }
      if (inv.status === 'pending') {
        return res.json({ message: 'Chat invite is already pending.', status: 'pending' });
      }
      // If rejected, allow re-inviting by updating status
      await pool.query(
        'UPDATE direct_chat_invites SET sender_id = $1, receiver_id = $2, status = \'pending\', created_at = CURRENT_TIMESTAMP WHERE id = $3',
        [senderId, receiver_id, inv.id]
      );
    } else {
      await pool.query(
        'INSERT INTO direct_chat_invites (sender_id, receiver_id, status) VALUES ($1, $2, \'pending\')',
        [senderId, receiver_id]
      );
    }

    // Create notification for receiver
    const senderResult = await pool.query('SELECT name FROM users WHERE id = $1', [senderId]);
    const senderName = senderResult.rows[0] ? senderResult.rows[0].name : 'A member';
    
    await pool.query(
      'INSERT INTO notifications (user_id, message, category, related_id) VALUES ($1, $2, $3, $4)',
      [receiver_id, `${senderName} sent you a chat invite!`, 'chat_invite', senderId]
    );

    res.json({ message: 'Chat invite sent successfully!', status: 'pending' });
  } catch (err) {
    console.error('Chat invite error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 2. Get pending chat invites for the current user
router.get('/invites', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(`
      SELECT i.id AS invite_id, i.sender_id, i.created_at, u.name AS sender_name, u.email AS sender_email, encode(u.profile_picture, 'base64') AS sender_avatar
      FROM direct_chat_invites i
      JOIN users u ON i.sender_id = u.id
      WHERE i.receiver_id = $1 AND i.status = 'pending'
      ORDER BY i.created_at DESC
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Get chat invites error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 3. Respond to chat invite (accept or reject)
router.post('/invite/:id/respond', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const inviteId = req.params.id;
  const { action } = req.body; // 'accept' or 'reject'

  if (!['accept', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  try {
    const inviteResult = await pool.query(
      'SELECT * FROM direct_chat_invites WHERE id = $1 AND receiver_id = $2',
      [inviteId, userId]
    );

    if (inviteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    const invite = inviteResult.rows[0];
    const newStatus = action === 'accept' ? 'accepted' : 'rejected';

    await pool.query('UPDATE direct_chat_invites SET status = $1 WHERE id = $2', [newStatus, inviteId]);

    if (action === 'accept') {
      const receiverResult = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
      const receiverName = receiverResult.rows[0] ? receiverResult.rows[0].name : 'A member';

      await pool.query(
        'INSERT INTO notifications (user_id, message, category, related_id) VALUES ($1, $2, $3, $4)',
        [invite.sender_id, `${receiverName} accepted your chat invite!`, 'chat_accepted', userId]
      );
    }

    res.json({ message: `Invite ${newStatus}!`, status: newStatus });
  } catch (err) {
    console.error('Respond invite error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 4. Get active contacts (users with accepted invites)
router.get('/contacts', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(`
      SELECT DISTINCT 
        u.id, u.name, u.email, encode(u.profile_picture, 'base64') AS avatar_base64,
        (SELECT message FROM direct_messages 
         WHERE (sender_id = $1 AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = $1)
         ORDER BY created_at DESC LIMIT 1) AS last_message,
        (SELECT created_at FROM direct_messages 
         WHERE (sender_id = $1 AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = $1)
         ORDER BY created_at DESC LIMIT 1) AS last_message_time,
        (SELECT COUNT(*) FROM direct_messages 
         WHERE sender_id = u.id AND receiver_id = $1 AND is_read = false) AS unread_count
      FROM users u
      JOIN direct_chat_invites i 
        ON (i.sender_id = $1 AND i.receiver_id = u.id) 
        OR (i.receiver_id = $1 AND i.sender_id = u.id)
      WHERE i.status = 'accepted'
      ORDER BY last_message_time DESC NULLS LAST, u.name ASC
    `, [userId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Get contacts error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 5. Get chat status with specific user
router.get('/status/:otherUserId', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const otherUserId = req.params.otherUserId;

  try {
    const result = await pool.query(`
      SELECT status, sender_id, receiver_id 
      FROM direct_chat_invites 
      WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
    `, [userId, otherUserId]);

    if (result.rows.length === 0) {
      return res.json({ status: 'none' });
    }

    const inv = result.rows[0];
    res.json({ 
      status: inv.status, 
      isSender: inv.sender_id === userId 
    });
  } catch (err) {
    console.error('Get status error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 6. Get 1-on-1 messages with a user
router.get('/messages/:otherUserId', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const otherUserId = req.params.otherUserId;

  try {
    // Security check: Verify accepted chat invite exists
    const inviteCheck = await pool.query(`
      SELECT 1 FROM direct_chat_invites 
      WHERE ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))
        AND status = 'accepted'
    `, [userId, otherUserId]);

    if (inviteCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Chat invite not accepted yet.' });
    }

    // Mark unread messages from other user as read
    await pool.query(
      'UPDATE direct_messages SET is_read = true WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false',
      [otherUserId, userId]
    );

    const messages = await pool.query(`
      SELECT m.id, m.sender_id, m.receiver_id, m.message, m.created_at, u.name AS sender_name
      FROM direct_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE (m.sender_id = $1 AND m.receiver_id = $2) OR (m.sender_id = $2 AND m.receiver_id = $1)
      ORDER BY m.created_at ASC
    `, [userId, otherUserId]);

    res.json(messages.rows);
  } catch (err) {
    console.error('Get direct messages error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 7. Send 1-on-1 message
router.post('/messages/:otherUserId', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const otherUserId = req.params.otherUserId;
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  try {
    // Security check: Verify accepted chat invite exists
    const inviteCheck = await pool.query(`
      SELECT 1 FROM direct_chat_invites 
      WHERE ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))
        AND status = 'accepted'
    `, [userId, otherUserId]);

    if (inviteCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Chat invite not accepted yet.' });
    }

    const result = await pool.query(`
      INSERT INTO direct_messages (sender_id, receiver_id, message)
      VALUES ($1, $2, $3)
      RETURNING id, sender_id, receiver_id, message, created_at
    `, [userId, otherUserId, message.trim()]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Send direct message error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
