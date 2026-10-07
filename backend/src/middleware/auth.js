// backend/src/middleware/auth.js
import { query } from '../db/pool.js';

/**
 * Middleware: attach req.user if a valid session token exists in cookie.
 * Non-blocking: routes still work without auth.
 */
export async function authMiddleware(req, res, next) {
  const token = req.cookies?.session_token;
  if (!token) return next();

  try {
    const result = await query(
      `SELECT u.id, u.email, u.role
       FROM auth_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = $1 AND s.expires_at > now()`,
      [token]
    );
    if (result.rows.length > 0) {
      req.user = result.rows[0];
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
  }
  next();
}

/**
 * Middleware: require authenticated user.
 */
export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

/**
 * Middleware: require admin role.
 */
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}
