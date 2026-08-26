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
const adminRoutes = require('./routes/admin');
const chatRoutes = require('./routes/chat');
const useragent = require('express-useragent');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(useragent.express());

// Content Security Policy — allow Google reCAPTCHA + self resources
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.google.com https://www.gstatic.com",
      "frame-src 'self' https://www.google.com https://www.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://www.google.com",
    ].join('; ')
  );
  next();
});

// Ensure all /api/* routes return JSON (prevents CORB on error responses)
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
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
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', adminRoutes);

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

// 404 handler for unmatched API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
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