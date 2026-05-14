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
const communitiesRoutes = require('./routes/communities');

const useragent = require('express-useragent');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(useragent.express());

// Request Logging
app.use((req, res, next) => {
  console.log('--- Incoming Request ---');
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Headers:', req.headers.authorization ? 'Bearer [hidden]' : 'None');
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/borrows', borrowRoutes);
app.use('/api/users', userRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/communities', communitiesRoutes);

// Static File Routing
const publicStatic = express.static('public', { index: 'welcome.html' });
const mobileStatic = express.static('public_mobile', { index: 'welcome.html' });

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  if (req.useragent.isMobile || (req.hostname && req.hostname.startsWith('mobile.'))) {
    mobileStatic(req, res, next);
  } else {
    publicStatic(req, res, next);
  }
});

// Root route
app.get('/', (req, res) => {
  if (req.useragent.isMobile || (req.hostname && req.hostname.startsWith('mobile.'))) {
    res.sendFile(__dirname + '/public_mobile/welcome.html');
  } else {
    res.sendFile(__dirname + '/public/welcome.html');
  }
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

// --- SINGLE INITIALIZATION BLOCK ---
console.log('Initializing Database...');

createTables()
  .then(() => {
    console.log('Database Initialized.');
    // Start server ONLY after DB is ready
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is LIVE on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database Initialization Failed:', err);
    // Exit so you can fix the tunnel/config
    process.exit(1);
  });