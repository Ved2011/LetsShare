const express = require('express');
const multer = require('multer');
const { pool } = require('../db');
const { authenticateToken, authenticateTokenOptional } = require('../middleware/auth');

const router = express.Router();

// Multer setup for image upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create item
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  const { owner_name, name, brand, category, age, condition, description, price_per_day, exclusive_community_id } = req.body;
  const image = req.file ? req.file.buffer : null;
  const ownerId = req.user.id;

  try {
    // Start transaction
    await pool.query('BEGIN');

    // Get user's plan and balance
    const userResult = await pool.query('SELECT plan_type, wallet_balance FROM users WHERE id = $1', [ownerId]);
    if (userResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }
    const { plan_type, wallet_balance } = userResult.rows[0];

    // Get current listing count
    const itemCountResult = await pool.query('SELECT COUNT(*) FROM items WHERE owner_id = $1', [ownerId]);
    const itemCount = parseInt(itemCountResult.rows[0].count);

    // Determine limit
    let limit = 5;
    if (plan_type === 'Pro') limit = 15;
    if (plan_type === 'Premium') limit = 30;

    let fee = 0;
    if (itemCount >= limit) {
      fee = 20;
      if (wallet_balance < fee) {
        await pool.query('ROLLBACK');
        return res.status(400).json({ error: `Listing limit reached for ${plan_type} plan (${limit} items). You need Rs. 20 in your wallet for additional listings.` });
      }

      // Deduct fee
      await pool.query('UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2', [fee, ownerId]);
      
      // Record transaction
      await pool.query(
        'INSERT INTO transactions (user_id, amount, type, category, description) VALUES ($1, $2, $3, $4, $5)',
        [ownerId, fee, 'debit', 'listing_fee', `Extra listing fee beyond ${limit} items limit`]
      );
    }

    // Enforce max price
    const price = Math.min(parseFloat(price_per_day) || 0, 100);

    const itemResult = await pool.query(
      'INSERT INTO items (owner_id, owner_name, name, price_per_day, exclusive_community_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [ownerId, owner_name || null, name, price, exclusive_community_id || null]
    );
    
    const itemId = itemResult.rows[0].id;
    
    await pool.query(
      'INSERT INTO item_details (item_id, brand, category, age, condition, description, image) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [itemId, brand || null, category || null, age || null, condition || null, description || null, image]
    );
    
    await pool.query('COMMIT');
    res.status(201).json({ 
      message: fee > 0 ? `Item created successfully! (Rs. ${fee} charged for extra listing)` : 'Item created successfully!', 
      itemId 
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Create item error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all items (filtered by community if logged in)
router.get('/', authenticateTokenOptional, async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const { community_id } = req.query;
    
    let query;
    let params;

    if (community_id) {
        query = `
          SELECT i.*, d.brand, d.category, d.age, d.condition, d.description, d.image
          FROM items i
          LEFT JOIN item_details d ON i.id = d.item_id
          WHERE i.owner_id IN (
            SELECT user_id FROM community_members WHERE community_id = $1
          )
        `;
        params = [community_id];
    } else {
        query = `
          SELECT i.*, d.brand, d.category, d.age, d.condition, d.description, d.image
          FROM items i
          LEFT JOIN item_details d ON i.id = d.item_id
          WHERE $1::int IS NULL OR i.owner_id = $1 OR EXISTS (
            SELECT 1 FROM community_members cm1
            JOIN community_members cm2 ON cm1.community_id = cm2.community_id
            WHERE cm1.user_id = i.owner_id AND cm2.user_id = $1
          )
        `;
        params = [userId];
    }

    const result = await pool.query(query, params);
    const items = result.rows.map(item => {
      if (item.image) {
        item.imageBase64 = `data:image/jpeg;base64,${item.image.toString('base64')}`;
      }
      return item;
    });
    res.json(items);
  } catch (err) {
    console.error('Get all items error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get items by user ID (restricted to shared communities)
router.get('/user/:userId', authenticateToken, async (req, res) => {
  const { userId: targetUserId } = req.params;
  const viewerId = req.user.id;

  try {
    const query = `
      SELECT i.*, d.brand, d.category, d.age, d.condition, d.description, d.image
      FROM items i
      LEFT JOIN item_details d ON i.id = d.item_id
      WHERE i.owner_id = $1 
      AND (
        -- Case 1: Item is exclusive to a specific community the viewer is in
        (i.exclusive_community_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM community_members cm 
          WHERE cm.community_id = i.exclusive_community_id AND cm.user_id = $2
        ))
        OR
        -- Case 2: Item is public but only visible if they share ANY community
        (i.exclusive_community_id IS NULL AND EXISTS (
          SELECT 1 FROM community_members cm1
          JOIN community_members cm2 ON cm1.community_id = cm2.community_id
          WHERE cm1.user_id = i.owner_id AND cm2.user_id = $2
        ))
      )
      ORDER BY i.created_at DESC
    `;
    const result = await pool.query(query, [targetUserId, viewerId]);
    const items = result.rows.map(item => {
      if (item.image) {
        item.imageBase64 = `data:image/jpeg;base64,${item.image.toString('base64')}`;
      }
      return item;
    });
    res.json(items);
  } catch (err) {
    console.error('Get user items error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get item by id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT i.*, d.brand, d.category, d.age, d.condition, d.description, d.image
      FROM items i
      LEFT JOIN item_details d ON i.id = d.item_id
      WHERE i.id = $1
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    const item = result.rows[0];
    if (item.image) {
      item.imageBase64 = `data:image/jpeg;base64,${item.image.toString('base64')}`;
    }
    res.json(item);
  } catch (err) {
    console.error('Get item by id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update item
router.put('/:id', authenticateToken, upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { name, description, category, brand, age, condition, price_per_day, exclusive_community_id } = req.body;
  const image = req.file ? req.file.buffer : null;
  const ownerId = req.user.id;

  try {
    // Check if item belongs to user
    const itemResult = await pool.query('SELECT owner_id FROM items WHERE id = $1', [id]);
    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    if (itemResult.rows[0].owner_id !== ownerId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await pool.query('BEGIN');

    // Update main items table
    const price = price_per_day !== undefined ? Math.min(parseFloat(price_per_day) || 0, 100) : undefined;
    let mainQuery = 'UPDATE items SET ';
    let mainParams = [];
    let mIdx = 1;

    if (name !== undefined) {
      mainQuery += `name = $${mIdx++}, `;
      mainParams.push(name);
    }
    if (price !== undefined) {
      mainQuery += `price_per_day = $${mIdx++}, `;
      mainParams.push(price);
    }
    if (exclusive_community_id !== undefined) {
      mainQuery += `exclusive_community_id = $${mIdx++}, `;
      mainParams.push(exclusive_community_id || null);
    }

    if (mainParams.length > 0) {
      mainQuery = mainQuery.slice(0, -2); // remove last comma
      mainQuery += ` WHERE id = $${mIdx}`;
      mainParams.push(id);
      await pool.query(mainQuery, mainParams);
    }

    // Update item_details table
    let detailQuery = 'UPDATE item_details SET ';
    let detailParams = [];
    let dIdx = 1;

    const fields = { brand, category, age, condition, description };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        detailQuery += `${key} = $${dIdx++}, `;
        detailParams.push(value);
      }
    }

    if (req.file) {
      detailQuery += `image = $${dIdx++}, `;
      detailParams.push(req.file.buffer);
    }

    if (detailParams.length > 0) {
      detailQuery = detailQuery.slice(0, -2);
      detailQuery += ` WHERE item_id = $${dIdx}`;
      detailParams.push(id);
      await pool.query(detailQuery, detailParams);
    }

    await pool.query('COMMIT');
    res.json({ message: 'Item updated successfully' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Update item error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete item
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user.id;

  try {
    // Check if item belongs to user
    const itemResult = await pool.query(`
      SELECT i.owner_id, i.name, i.status, u.email 
      FROM items i 
      JOIN users u ON i.owner_id = u.id 
      WHERE i.id = $1
    `, [id]);
    
    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    if (itemResult.rows[0].owner_id !== ownerId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (itemResult.rows[0].status === 'borrowed') {
      return res.status(400).json({ error: 'Cannot delete borrowed item' });
    }

    const itemName = itemResult.rows[0].name;
    const userEmail = itemResult.rows[0].email;

    await pool.query('DELETE FROM items WHERE id = $1', [id]);
    
    // Send automated email
    try {
      const { sendEmail } = require('../utils/email');
      await sendEmail(
        userEmail,
        'Item Deleted from LetsShare',
        `Your item "${itemName}" has been successfully deleted from your LetsShare account.`,
        `<div style="font-family: sans-serif; padding: 20px;">
          <h2>Item Deleted</h2>
          <p>Your item <strong>${itemName}</strong> has been deleted and is no longer available on the platform.</p>
        </div>`
      );
    } catch (mailErr) {
      console.error('Failed to send item deletion email:', mailErr);
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;