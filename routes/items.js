const express = require('express');
const multer = require('multer');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Multer setup for image upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create item
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  const { owner_name, name, brand, category, age, condition, description } = req.body;
  const image = req.file ? req.file.buffer : null;
  const ownerId = req.user.id;

  try {
    const result = await pool.query(
      'INSERT INTO items (owner_id, owner_name, name, brand, category, age, condition, description, image) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      [ownerId, owner_name || null, name, brand || null, category || null, age || null, condition || null, description || null, image]
    );
    res.status(201).json({ message: 'Item created successfully', itemId: result.rows[0].id });
  } catch (err) {
    console.error('Create item error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all items
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM items');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get item by id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM items WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update item
router.put('/:id', authenticateToken, upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { name, description, category, brand, age, condition } = req.body;
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

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (category !== undefined) {
      updateFields.push(`category = $${paramIndex++}`);
      values.push(category);
    }
    if (brand !== undefined) {
      updateFields.push(`brand = $${paramIndex++}`);
      values.push(brand);
    }
    if (age !== undefined) {
      updateFields.push(`age = $${paramIndex++}`);
      values.push(age);
    }
    if (condition !== undefined) {
      updateFields.push(`condition = $${paramIndex++}`);
      values.push(condition);
    }
    if (image !== null) {
      updateFields.push(`image = $${paramIndex++}`);
      values.push(image);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const query = `UPDATE items SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;

    await pool.query(query, values);
    res.json({ message: 'Item updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete item
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user.id;

  try {
    // Check if item belongs to user
    const itemResult = await pool.query('SELECT owner_id, status FROM items WHERE id = $1', [id]);
    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    if (itemResult.rows[0].owner_id !== ownerId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (itemResult.rows[0].status === 'borrowed') {
      return res.status(400).json({ error: 'Cannot delete borrowed item' });
    }

    await pool.query('DELETE FROM items WHERE id = $1', [id]);
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;