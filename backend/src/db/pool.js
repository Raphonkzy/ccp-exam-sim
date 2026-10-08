// backend/src/db/pool.js
import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function query(text, params) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

export async function initDb() {
  try {
    // 1. Ensure username column exists on users table
    await query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
    `);

    // 2. Backfill username for existing accounts if null
    await query(`
      UPDATE users
      SET username = LOWER(SPLIT_PART(email, '@', 1))
      WHERE username IS NULL;
    `);

    // 3. Ensure index exists
    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `);

    // 4. Ensure user_progress table exists
    await query(`
      CREATE TABLE IF NOT EXISTS user_progress (
        user_id     UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        answers     JSONB NOT NULL DEFAULT '{}',
        confusing   JSONB NOT NULL DEFAULT '[]',
        settings    JSONB NOT NULL DEFAULT '{}',
        updated_at  TIMESTAMPTZ DEFAULT now()
      );
    `);
  } catch (err) {
    console.warn('[db] initDb notice:', err.message);
  }
}

