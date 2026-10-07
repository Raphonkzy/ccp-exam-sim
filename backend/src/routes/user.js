// backend/src/routes/user.js
import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// ── Exam Attempts ─────────────────────────────────────────────────────────────

// GET /api/user/attempts - get current user's exam history
router.get('/attempts', requireAuth, async (req, res) => {
  const result = await query(
    `SELECT id, score, total, passed, answers, domain_scores, started_at, finished_at
     FROM exam_attempts WHERE user_id = $1 ORDER BY finished_at DESC`,
    [req.user.id]
  );
  res.json(result.rows);
});

// POST /api/user/attempts - save a completed exam attempt
router.post('/attempts', requireAuth, async (req, res) => {
  const { score, total, answers, domain_scores, started_at, finished_at } = req.body;
  const startIso = started_at ? new Date(started_at).toISOString() : null;
  const finishIso = finished_at ? new Date(finished_at).toISOString() : new Date().toISOString();
  const result = await query(
    `INSERT INTO exam_attempts (user_id, score, total, answers, domain_scores, started_at, finished_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [req.user.id, score, total, JSON.stringify(answers ?? {}), JSON.stringify(domain_scores ?? {}), startIso, finishIso]
  );
  res.status(201).json({ id: result.rows[0].id });
});

// DELETE /api/user/attempts/:id - delete a session
router.delete('/attempts/:id', requireAuth, async (req, res) => {
  await query('DELETE FROM exam_attempts WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  res.json({ ok: true });
});

// ── Bookmarks ─────────────────────────────────────────────────────────────────

// GET /api/user/bookmarks
router.get('/bookmarks', requireAuth, async (req, res) => {
  const result = await query(
    'SELECT question_id, created_at FROM bookmarks WHERE user_id = $1 ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json(result.rows.map(r => r.question_id));
});

// POST /api/user/bookmarks/:questionId
router.post('/bookmarks/:questionId', requireAuth, async (req, res) => {
  try {
    await query(
      'INSERT INTO bookmarks (user_id, question_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, req.params.questionId]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/user/bookmarks/:questionId
router.delete('/bookmarks/:questionId', requireAuth, async (req, res) => {
  await query(
    'DELETE FROM bookmarks WHERE user_id = $1 AND question_id = $2',
    [req.user.id, req.params.questionId]
  );
  res.json({ ok: true });
});

// ── Mistakes ──────────────────────────────────────────────────────────────────

// GET /api/user/mistakes
router.get('/mistakes', requireAuth, async (req, res) => {
  const result = await query(
    'SELECT question_id, times_wrong, last_seen FROM mistakes WHERE user_id = $1 ORDER BY times_wrong DESC',
    [req.user.id]
  );
  res.json(result.rows);
});

// POST /api/user/mistakes/:questionId - increment or insert
router.post('/mistakes/:questionId', requireAuth, async (req, res) => {
  await query(
    `INSERT INTO mistakes (user_id, question_id, times_wrong, last_seen)
     VALUES ($1, $2, 1, now())
     ON CONFLICT (user_id, question_id)
     DO UPDATE SET times_wrong = mistakes.times_wrong + 1, last_seen = now()`,
    [req.user.id, req.params.questionId]
  );
  res.json({ ok: true });
});

// ── Admin ─────────────────────────────────────────────────────────────────────

// GET /api/user/admin/users - list all users (admin only)
router.get('/admin/users', requireAdmin, async (req, res) => {
  const result = await query(
    'SELECT id, email, role, created_at FROM users ORDER BY created_at DESC',
    []
  );
  res.json(result.rows);
});

// GET /api/user/admin/stats - aggregate stats (admin only)
router.get('/admin/stats', requireAdmin, async (req, res) => {
  const [users, attempts] = await Promise.all([
    query('SELECT COUNT(*) as total FROM users', []),
    query('SELECT COUNT(*) as total, AVG(score::float/total) as avg_score FROM exam_attempts WHERE user_id IS NOT NULL', [])
  ]);
  res.json({
    total_users: users.rows[0].total,
    total_attempts: attempts.rows[0].total,
    avg_score: parseFloat(attempts.rows[0].avg_score || 0).toFixed(2)
  });
});

export default router;
