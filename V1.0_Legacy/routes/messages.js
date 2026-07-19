const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Helper: escape HTML entities to sanitize message text
function sanitizeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ── Static routes MUST come before /:userId to avoid Express treating them as params ──

// Get total unread message count for current user
router.get('/unread-count', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(
      'SELECT COUNT(*) FROM direct_messages WHERE receiver_id = $1 AND is_read = false',
      [userId]
    );
    res.json({ unreadCount: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error('Error fetching unread count:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all pending invites for current user (sent and received)
router.get('/invites', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(`
      SELECT dci.id, dci.sender_id, dci.receiver_id, dci.status, dci.created_at,
        s.name AS sender_name, r.name AS receiver_name
      FROM direct_chat_invites dci
      JOIN users s ON dci.sender_id = s.id
      JOIN users r ON dci.receiver_id = r.id
      WHERE (dci.sender_id = $1 OR dci.receiver_id = $1) AND dci.status = 'pending'
      ORDER BY dci.created_at DESC
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching invites:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get list of all accepted conversations for current user
router.get('/conversations', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(`
      SELECT
        u.id AS user_id,
        u.name,
        u.username,
        CASE WHEN u.profile_picture IS NOT NULL
          THEN encode(u.profile_picture, 'base64')
          ELSE NULL
        END AS profile_picture,
        lm.message AS last_message,
        lm.created_at AS last_message_time,
        COALESCE(unread.count, 0)::int AS unread_count
      FROM direct_chat_invites dci
      JOIN users u ON u.id = CASE
        WHEN dci.sender_id = $1 THEN dci.receiver_id
        ELSE dci.sender_id
      END
      LEFT JOIN LATERAL (
        SELECT message, created_at
        FROM direct_messages dm
        WHERE (dm.sender_id = $1 AND dm.receiver_id = u.id)
           OR (dm.sender_id = u.id AND dm.receiver_id = $1)
        ORDER BY dm.created_at DESC
        LIMIT 1
      ) lm ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*) AS count
        FROM direct_messages dm2
        WHERE dm2.sender_id = u.id AND dm2.receiver_id = $1 AND dm2.is_read = false
      ) unread ON true
      WHERE dci.status = 'accepted'
        AND (dci.sender_id = $1 OR dci.receiver_id = $1)
      ORDER BY lm.created_at DESC NULLS LAST
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send a chat invite to another user
router.post('/invite/:userId', authenticateToken, async (req, res) => {
  const senderId = req.user.id;
  const receiverId = parseInt(req.params.userId, 10);

  if (senderId === receiverId) {
    return res.status(400).json({ error: 'Cannot invite yourself' });
  }

  try {
    // Check that both users share at least one community
    const commonCommunity = await pool.query(`
      SELECT 1 FROM community_members cm1
      JOIN community_members cm2 ON cm1.community_id = cm2.community_id
      WHERE cm1.user_id = $1 AND cm2.user_id = $2
      LIMIT 1
    `, [senderId, receiverId]);

    if (commonCommunity.rows.length === 0) {
      return res.status(403).json({ error: 'You must share at least one community to send a chat invite' });
    }

    // Check if invite already exists in either direction
    const existingInvite = await pool.query(`
      SELECT id, status FROM direct_chat_invites
      WHERE (sender_id = $1 AND receiver_id = $2)
         OR (sender_id = $2 AND receiver_id = $1)
    `, [senderId, receiverId]);

    if (existingInvite.rows.length > 0) {
      const invite = existingInvite.rows[0];
      if (invite.status === 'accepted') {
        return res.status(400).json({ error: 'Already connected' });
      }
      if (invite.status === 'pending') {
        return res.status(400).json({ error: 'Invite already pending' });
      }
    }

    const result = await pool.query(
      'INSERT INTO direct_chat_invites (sender_id, receiver_id) VALUES ($1, $2) RETURNING id',
      [senderId, receiverId]
    );

    res.status(201).json({ message: 'Chat invite sent', inviteId: result.rows[0].id });
  } catch (err) {
    console.error('Error sending chat invite:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Accept a pending invite
router.post('/invites/:id/accept', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const inviteId = req.params.id;
  try {
    const invite = await pool.query(
      'SELECT * FROM direct_chat_invites WHERE id = $1 AND receiver_id = $2 AND status = $3',
      [inviteId, userId, 'pending']
    );

    if (invite.rows.length === 0) {
      return res.status(404).json({ error: 'Invite not found or already handled' });
    }

    await pool.query(
      'UPDATE direct_chat_invites SET status = $1 WHERE id = $2',
      ['accepted', inviteId]
    );

    res.json({ message: 'Invite accepted' });
  } catch (err) {
    console.error('Error accepting invite:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reject a pending invite
router.post('/invites/:id/reject', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const inviteId = req.params.id;
  try {
    const invite = await pool.query(
      'SELECT * FROM direct_chat_invites WHERE id = $1 AND receiver_id = $2 AND status = $3',
      [inviteId, userId, 'pending']
    );

    if (invite.rows.length === 0) {
      return res.status(404).json({ error: 'Invite not found or already handled' });
    }

    await pool.query(
      'UPDATE direct_chat_invites SET status = $1 WHERE id = $2',
      ['rejected', inviteId]
    );

    res.json({ message: 'Invite rejected' });
  } catch (err) {
    console.error('Error rejecting invite:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Dynamic /:userId routes come AFTER static routes ──

// Get all messages between current user and target user
router.get('/:userId', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const otherUserId = parseInt(req.params.userId, 10);
  try {
    // Verify accepted invite exists
    const invite = await pool.query(`
      SELECT id FROM direct_chat_invites
      WHERE status = 'accepted'
        AND ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))
    `, [userId, otherUserId]);

    if (invite.rows.length === 0) {
      return res.status(403).json({ error: 'No accepted chat invite with this user' });
    }

    // Mark unread messages from the other user as read
    await pool.query(
      'UPDATE direct_messages SET is_read = true WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false',
      [otherUserId, userId]
    );

    // Fetch all messages
    const result = await pool.query(`
      SELECT id, sender_id, receiver_id, message, is_read, created_at
      FROM direct_messages
      WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
      ORDER BY created_at ASC
    `, [userId, otherUserId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send a message to target user
router.post('/:userId', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const receiverId = parseInt(req.params.userId, 10);
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  if (message.length > 2000) {
    return res.status(400).json({ error: 'Message cannot exceed 2000 characters' });
  }

  try {
    // Verify accepted invite exists
    const invite = await pool.query(`
      SELECT id FROM direct_chat_invites
      WHERE status = 'accepted'
        AND ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))
    `, [userId, receiverId]);

    if (invite.rows.length === 0) {
      return res.status(403).json({ error: 'No accepted chat invite with this user' });
    }

    const sanitizedMessage = sanitizeHtml(message.trim());

    const result = await pool.query(
      'INSERT INTO direct_messages (sender_id, receiver_id, message) VALUES ($1, $2, $3) RETURNING id, sender_id, receiver_id, message, is_read, created_at',
      [userId, receiverId, sanitizedMessage]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
