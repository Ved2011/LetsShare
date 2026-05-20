const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { name, email, password, phone, dob, address, city, state, locality, country } = req.body;

  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const blacklistCheck = await pool.query('SELECT 1 FROM blacklisted_emails WHERE email = $1', [email]);
    if (blacklistCheck.rows.length > 0) {
      return res.status(403).json({ error: 'Registration is not allowed for this email address' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    const result = await pool.query(
      'INSERT INTO users (name, email, password, phone, dob, address, city, state, locality, country, verification_code, is_verified) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id',
      [name, email, hashedPassword, phone, dob || null, address || null, city || null, state || null, locality || null, country || 'India', verificationCode, false]
    );

    // Send verification email
    try {
      const { sendEmail } = require('../utils/email');
      await sendEmail(
        email,
        'Welcome to LetsShare! Verify your email',
        `Welcome to LetsShare! Your verification code is: ${verificationCode}`,
        `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2>Welcome to LetsShare!</h2>
          <p>Thank you for joining our community. To complete your registration, please verify your email address using the code below:</p>
          <h1 style="color: #4f7cde; letter-spacing: 5px;">${verificationCode}</h1>
          <p>If you did not request this, you can safely ignore this email.</p>
        </div>`
      );
    } catch (mailErr) {
      console.error('Failed to send verification email:', mailErr);
    }

    res.status(201).json({ 
      message: 'User registered successfully. Please check your email for the verification code.', 
      userId: result.rows[0].id 
    });
  } catch (err) {
    console.error('Register error:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify Email
router.post('/verify-email', async (req, res) => {
  const { userId, verificationCode } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const user = result.rows[0];
    if (user.verification_code === verificationCode) {
      await pool.query('UPDATE users SET is_verified = true, verification_code = NULL WHERE id = $1', [userId]);
      res.json({ message: 'Email verified successfully! You can now log in.' });
    } else {
      res.status(400).json({ error: 'Invalid verification code' });
    }
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR name = $1 OR username = $1',
      [identifier]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    
    if (!user.is_verified) {
      return res.status(403).json({ 
        error: 'Please verify your email before logging in.', 
        userId: user.id,
        unverified: true 
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    if (user.two_factor_enabled) {
      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

      await pool.query(
        'UPDATE users SET otp_code = $1, otp_expires = $2 WHERE id = $3',
        [otp, expires, user.id]
      );

      // Send OTP via email
      try {
        const { sendEmail } = require('../utils/email');
        await sendEmail(
          user.email,
          'Your LetsShare Verification Code',
          `Your OTP code is: ${otp}`,
          `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2>Verification Code</h2>
            <p>Your LetsShare login verification code is:</p>
            <h1 style="color: #4f7cde; letter-spacing: 5px;">${otp}</h1>
            <p>This code will expire in 10 minutes.</p>
          </div>`
        );
      } catch (mailErr) {
        console.error('Failed to send OTP email:', mailErr);
      }

      return res.json({ 
        twoFactorRequired: true, 
        userId: user.id,
        message: 'Please enter the OTP sent to your registered email.' 
      });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify 2FA
router.post('/verify-2fa', async (req, res) => {
  const { userId, otpCode } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid user' });
    }

    const user = result.rows[0];
    if (user.otp_code !== otpCode || new Date() > new Date(user.otp_expires)) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Clear OTP
    await pool.query('UPDATE users SET otp_code = NULL, otp_expires = NULL WHERE id = $1', [userId]);

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('2FA verification error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query('SELECT id, name, email, phone, dob, address FROM users WHERE id = $1', [decoded.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Me error:', err);
    res.status(403).json({ error: 'Invalid token' });
  }
});

module.exports = router;