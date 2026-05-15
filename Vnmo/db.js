const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: 'abc123',
});

const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        phone TEXT,
        dob DATE,
        address TEXT,
        plan_type TEXT DEFAULT 'Free',
        plan_expiry TIMESTAMP,
        borrows_this_month INTEGER DEFAULT 0,
        last_borrow_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        wallet_balance DECIMAL DEFAULT 0,
        upi_id TEXT,
        city TEXT,
        state TEXT,
        locality TEXT,
        country TEXT,
        verification_code TEXT,
        is_verified BOOLEAN DEFAULT false,
        username TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        owner_name TEXT,
        name TEXT NOT NULL,
        price_per_day DECIMAL DEFAULT 0,
        status TEXT DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS item_details (
        id SERIAL PRIMARY KEY,
        item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
        brand TEXT,
        category TEXT,
        age TEXT,
        condition TEXT DEFAULT 'available',
        description TEXT,
        image BYTEA,
        UNIQUE(item_id)
      );

      CREATE TABLE IF NOT EXISTS borrows (
        id SERIAL PRIMARY KEY,
        borrow_id VARCHAR(20) UNIQUE,
        item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
        borrower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        borrower_name TEXT,
        borrower_email TEXT,
        issue_date DATE,
        due_date DATE,
        duration_days INTEGER,
        status TEXT DEFAULT 'requested',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS follows (
        id SERIAL PRIMARY KEY,
        follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        followed_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_id, followed_user_id)
      );

      CREATE TABLE IF NOT EXISTS returns (
        id SERIAL PRIMARY KEY,
        borrow_id INTEGER REFERENCES borrows(id) ON DELETE CASCADE,
        item_name TEXT,
        owner_email TEXT,
        borrower_email TEXT,
        condition TEXT,
        notes TEXT,
        return_date DATE,
        returned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS complaints (
        id SERIAL PRIMARY KEY,
        borrow_id INTEGER REFERENCES borrows(id) ON DELETE CASCADE,
        complainant_id INTEGER REFERENCES users(id),
        accused_id INTEGER REFERENCES users(id),
        item_name TEXT,
        borrower_name TEXT,
        issue_type TEXT NOT NULL,
        severity TEXT,
        description TEXT,
        before_image BYTEA,
        after_image BYTEA,
        status TEXT DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL NOT NULL,
        type TEXT NOT NULL, -- 'credit', 'debit'
        category TEXT NOT NULL, -- 'borrow_fee', 'subscription', 'earning', 'withdrawal', 'platform_fee'
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS communities (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        description TEXT,
        max_limit INTEGER DEFAULT 100,
        is_private BOOLEAN DEFAULT false,
        chat_enabled BOOLEAN DEFAULT false,
        admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS community_members (
        id SERIAL PRIMARY KEY,
        community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(community_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS community_invites (
        id SERIAL PRIMARY KEY,
        community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
        inviter_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        invitee_email TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS community_messages (
        id SERIAL PRIMARY KEY,
        community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS dob DATE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture BYTEA;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires TIMESTAMP;
      ALTER TABLE items ADD COLUMN IF NOT EXISTS image BYTEA;
      ALTER TABLE items ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available';
      ALTER TABLE items ADD COLUMN IF NOT EXISTS owner_name TEXT;
      ALTER TABLE items ADD COLUMN IF NOT EXISTS price_per_day DECIMAL DEFAULT 0;
      ALTER TABLE items ADD COLUMN IF NOT EXISTS brand TEXT;
      ALTER TABLE items ADD COLUMN IF NOT EXISTS age TEXT;
      ALTER TABLE items ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'available';
      ALTER TABLE borrows ADD COLUMN IF NOT EXISTS borrow_id VARCHAR(20) UNIQUE;
      ALTER TABLE borrows ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
      ALTER TABLE borrows ADD COLUMN IF NOT EXISTS borrower_name TEXT;
      ALTER TABLE borrows ADD COLUMN IF NOT EXISTS borrower_email TEXT;
      ALTER TABLE borrows ADD COLUMN IF NOT EXISTS issue_date DATE;
      ALTER TABLE borrows ADD COLUMN IF NOT EXISTS due_date DATE;
      ALTER TABLE borrows ADD COLUMN IF NOT EXISTS duration_days INTEGER;
      ALTER TABLE returns ADD COLUMN IF NOT EXISTS condition TEXT;
      ALTER TABLE returns ADD COLUMN IF NOT EXISTS notes TEXT;
      ALTER TABLE returns ADD COLUMN IF NOT EXISTS item_name TEXT;
      ALTER TABLE returns ADD COLUMN IF NOT EXISTS owner_email TEXT;
      ALTER TABLE returns ADD COLUMN IF NOT EXISTS borrower_email TEXT;
      ALTER TABLE returns ADD COLUMN IF NOT EXISTS return_date DATE;
      ALTER TABLE complaints ADD COLUMN IF NOT EXISTS issue_type TEXT;
      ALTER TABLE complaints ADD COLUMN IF NOT EXISTS severity TEXT;
      ALTER TABLE complaints ADD COLUMN IF NOT EXISTS item_name TEXT;
      ALTER TABLE complaints ADD COLUMN IF NOT EXISTS borrower_name TEXT;
      ALTER TABLE complaints ADD COLUMN IF NOT EXISTS before_image BYTEA;
      ALTER TABLE complaints ADD COLUMN IF NOT EXISTS after_image BYTEA;
      ALTER TABLE complaints ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS upi_id TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'Free';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS borrows_this_month INTEGER DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_borrow_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS state TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS locality TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
    `);

    console.log('Tables created successfully');
  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    client.release();
  }
};

module.exports = { pool, createTables };