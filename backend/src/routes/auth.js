// backend/src/routes/auth.js
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const SESSION_DAYS = 30;

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

  try {
    const hash = await bcrypt.hash(password, 12);
    const normalizedEmail = email.toLowerCase().trim();
    const role = normalizedEmail === process.env.ADMIN_EMAIL?.toLowerCase()?.trim() ? 'admin' : 'user';
    const result = await query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
      [normalizedEmail, hash, role]
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'An account with this email already exists. Try signing in.', code: 'EMAIL_EXISTS' });
    console.error(err);
    if (err.code === 'ECONNREFUSED') return res.status(503).json({ error: 'Database service is currently unreachable.' });
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const userResult = await query(
      'SELECT id, email, role, password_hash FROM users WHERE email = $1',
      [normalizedEmail]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'No account found with this email.', code: 'USER_NOT_FOUND' });
    }

    const user = userResult.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.', code: 'INVALID_PASSWORD' });
    }

    // Create session token
    const token = crypto.randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400 * 1000);
    await query(
      'INSERT INTO auth_sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );

    const isSecure = process.env.COOKIE_SECURE === 'true' || req.secure || req.headers['x-forwarded-proto'] === 'https';
    res.cookie('session_token', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      expires: expiresAt,
    });

    res.json({ user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'Database service is currently unreachable.' });
    }
    res.status(500).json({ error: 'Server error during sign in.' });
  }
});

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req, res) => {
  const token = req.cookies?.session_token;
  if (token) {
    await query('DELETE FROM auth_sessions WHERE token = $1', [token]);
  }
  res.clearCookie('session_token');
  res.json({ ok: true });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (!req.user) return res.status(401).json({ user: null });
  res.json({ user: req.user });
});

// POST /api/auth/request-reset
// Homelab mode: token returned directly in response (no email server)
router.post('/request-reset', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const userResult = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    if (userResult.rows.length === 0) {
      return res.json({ ok: true }); // no token, avoid enumeration
    }

    await query('DELETE FROM reset_tokens WHERE user_id = $1', [userResult.rows[0].id]);

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await query(
      'INSERT INTO reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userResult.rows[0].id, token, expiresAt]
    );

    res.json({ ok: true, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and password required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be 8+ characters' });

  try {
    const tokenResult = await query(
      'SELECT user_id FROM reset_tokens WHERE token = $1 AND expires_at > now()',
      [token]
    );
    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const userId = tokenResult.rows[0].user_id;
    const hash = await bcrypt.hash(password, 12);

    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId]);
    await query('DELETE FROM reset_tokens WHERE user_id = $1', [userId]);
    await query('DELETE FROM auth_sessions WHERE user_id = $1', [userId]);

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
