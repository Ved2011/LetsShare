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
    // Start transaction
    await pool.query('BEGIN');
    
    const itemResult = await pool.query(
      'INSERT INTO items (owner_id, owner_name, name) VALUES ($1, $2, $3) RETURNING id',
      [ownerId, owner_name || null, name]
    );
    
    const itemId = itemResult.rows[0].id;
    
    await pool.query(
      'INSERT INTO item_details (item_id, brand, category, age, condition, description, image) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [itemId, brand || null, category || null, age || null, condition || null, description || null, image]
    );
    
    await pool.query('COMMIT');
    res.status(201).json({ message: 'Item created successfully', itemId });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Create item error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all items
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT i.*, d.brand, d.category, d.age, d.condition, d.description, d.image
      FROM items i
      LEFT JOIN item_details d ON i.id = d.item_id
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Get all items error:', err);
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
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get item by id error:', err);
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

    await pool.query('BEGIN');

    // Update main items table if name is provided
    if (name !== undefined) {
      await pool.query('UPDATE items SET name = $1 WHERE id = $2', [name, id]);
    }

    // Update item_details table
    const detailFields = [];
    const detailValues = [];
    let dIdx = 1;

    if (description !== undefined) { detailFields.push(`description = $${dIdx++}`); detailValues.push(description); }
    if (category !== undefined) { detailFields.push(`category = $${dIdx++}`); detailValues.push(category); }
    if (brand !== undefined) { detailFields.push(`brand = $${dIdx++}`); detailValues.push(brand); }
    if (age !== undefined) { detailFields.push(`age = $${dIdx++}`); detailValues.push(age); }
    if (condition !== undefined) { detailFields.push(`condition = $${dIdx++}`); detailValues.push(condition); }
    if (image !== null) { detailFields.push(`image = $${dIdx++}`); detailValues.push(image); }

    if (detailFields.length > 0) {
      detailValues.push(id);
      const detailQuery = `UPDATE item_details SET ${detailFields.join(', ')} WHERE item_id = $${dIdx}`;
      await pool.query(detailQuery, detailValues);
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