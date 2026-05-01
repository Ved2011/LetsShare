const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        image BYTEA,
        status TEXT DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS borrows (
        id SERIAL PRIMARY KEY,
        borrow_id VARCHAR(20) UNIQUE,
        item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
        borrower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        due_date TIMESTAMP,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS returns (
        id SERIAL PRIMARY KEY,
        borrow_id INTEGER REFERENCES borrows(id) ON DELETE CASCADE,
        condition TEXT,
        notes TEXT,
        returned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS complaints (
        id SERIAL PRIMARY KEY,
        borrow_id INTEGER REFERENCES borrows(id) ON DELETE CASCADE,
        complainant_id INTEGER REFERENCES users(id),
        accused_id INTEGER REFERENCES users(id),
        issue TEXT NOT NULL,
        description TEXT,
        before_image BYTEA,
        after_image BYTEA,
        status TEXT DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
      ALTER TABLE items ADD COLUMN IF NOT EXISTS image BYTEA;
      ALTER TABLE items ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available';
      ALTER TABLE borrows ADD COLUMN IF NOT EXISTS borrow_id VARCHAR(20) UNIQUE;
      ALTER TABLE borrows ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
      ALTER TABLE returns ADD COLUMN IF NOT EXISTS condition TEXT;
      ALTER TABLE returns ADD COLUMN IF NOT EXISTS notes TEXT;
      ALTER TABLE complaints ADD COLUMN IF NOT EXISTS issue TEXT;
      ALTER TABLE complaints ADD COLUMN IF NOT EXISTS description TEXT;
      ALTER TABLE complaints ADD COLUMN IF NOT EXISTS before_image BYTEA;
      ALTER TABLE complaints ADD COLUMN IF NOT EXISTS after_image BYTEA;
      ALTER TABLE complaints ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';
    `);

    console.log('Tables created successfully');
  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    client.release();
  }
};

module.exports = { pool, createTables };