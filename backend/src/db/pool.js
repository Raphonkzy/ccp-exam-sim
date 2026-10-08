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

    // 5. Ensure site_visitors table exists
    await query(`
      CREATE TABLE IF NOT EXISTS site_visitors (
        visitor_id  TEXT PRIMARY KEY,
        user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
        ip_hash     TEXT,
        user_agent  TEXT,
        browser     TEXT,
        os          TEXT,
        device      TEXT DEFAULT 'desktop',
        last_path   TEXT DEFAULT '/',
        visit_count INT DEFAULT 1,
        first_seen  TIMESTAMPTZ DEFAULT now(),
        last_seen   TIMESTAMPTZ DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_site_visitors_last_seen ON site_visitors(last_seen);
      CREATE INDEX IF NOT EXISTS idx_site_visitors_user_id ON site_visitors(user_id);
    `);

    // 6. Ensure page_views table exists
    await query(`
      CREATE TABLE IF NOT EXISTS page_views (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        visitor_id  TEXT REFERENCES site_visitors(visitor_id) ON DELETE CASCADE,
        user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
        path        TEXT NOT NULL,
        referrer    TEXT,
        created_at  TIMESTAMPTZ DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);
      CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path);
      CREATE INDEX IF NOT EXISTS idx_page_views_visitor_id ON page_views(visitor_id);
    `);
  } catch (err) {
    console.warn('[db] initDb notice:', err.message);
  }
}

