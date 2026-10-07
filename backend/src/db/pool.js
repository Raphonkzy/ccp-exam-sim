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

