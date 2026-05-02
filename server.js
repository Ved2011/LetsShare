require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, createTables } = require('./db');
const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const borrowRoutes = require('./routes/borrows');
const userRoutes = require('./routes/users');
const returnRoutes = require('./routes/returns');
const complaintRoutes = require('./routes/complaints');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/borrows', borrowRoutes);
app.use('/api/users', userRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/stats', statsRoutes);

// Root route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Test route
app.get('/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT 1');
    res.json({ message: 'Server and DB are working', db: result.rows });
  } catch (err) {
    console.error('DB test error:', err);
    res.status(500).json({ error: 'DB error' });
  }
});

// Initialize database
createTables();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});