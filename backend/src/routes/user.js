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

// DELETE /api/user/attempts/:id - delete a session and scrub its answers from progress
router.delete('/attempts/:id', requireAuth, async (req, res) => {
  try {
    // 1. Fetch the attempt first so we know which question IDs to scrub
    const attemptRes = await query(
      'SELECT answers FROM exam_attempts WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (attemptRes.rows.length === 0) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    // 2. Delete the attempt
    await query('DELETE FROM exam_attempts WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);

    // 3. Scrub each answered question from user_progress.answers
    let answers = attemptRes.rows[0].answers;
    if (typeof answers === 'string') {
      try { answers = JSON.parse(answers); } catch { answers = {}; }
    }
    const qids = Object.keys(answers || {});
    if (qids.length > 0) {
      // Build a jsonb - operator chain to remove all keys in one query
      // e.g. answers - 'q1' - 'q2' - ...
      const removes = qids.map((_, i) => `- $${i + 2}::text`).join(' ');
      await query(
        `UPDATE user_progress SET answers = answers ${removes}, updated_at = now() WHERE user_id = $1`,
        [req.user.id, ...qids]
      );
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to delete attempt:', err);
    res.status(500).json({ error: 'Failed to delete attempt' });
  }
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

// DELETE /api/user/mistakes/:questionId - remove single mistake
router.delete('/mistakes/:questionId', requireAuth, async (req, res) => {
  await query('DELETE FROM mistakes WHERE user_id = $1 AND question_id = $2', [req.user.id, req.params.questionId]);
  res.json({ ok: true });
});

// DELETE /api/user/mistakes - clear all mistakes for user
router.delete('/mistakes', requireAuth, async (req, res) => {
  await query('DELETE FROM mistakes WHERE user_id = $1', [req.user.id]);
  res.json({ ok: true });
});

// ── Full User State Sync ─────────────────────────────────────────────────────

// GET /api/user/full-state - return all user data from PostgreSQL in one shot
router.get('/full-state', requireAuth, async (req, res) => {
  try {
    const [attemptsRes, bookmarksRes, mistakesRes, progressRes] = await Promise.all([
      query(
        `SELECT id, score, total, passed, answers, domain_scores, started_at, finished_at
         FROM exam_attempts WHERE user_id = $1 ORDER BY finished_at DESC`,
        [req.user.id]
      ),
      query(
        `SELECT question_id FROM bookmarks WHERE user_id = $1 ORDER BY created_at DESC`,
        [req.user.id]
      ),
      query(
        `SELECT question_id, times_wrong, last_seen FROM mistakes WHERE user_id = $1 ORDER BY times_wrong DESC`,
        [req.user.id]
      ),
      query(
        `SELECT answers, confusing, settings, updated_at FROM user_progress WHERE user_id = $1`,
        [req.user.id]
      ),
    ]);

    const progress = progressRes.rows[0] || { answers: {}, confusing: [], settings: {} };

    res.json({
      attempts: attemptsRes.rows,
      bookmarks: bookmarksRes.rows.map(r => r.question_id),
      mistakes: mistakesRes.rows,
      progress: {
        answers: progress.answers || {},
        confusing: progress.confusing || [],
        settings: progress.settings || {},
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user state from database' });
  }
});

// POST /api/user/answer - record answer directly in PostgreSQL
router.post('/answer', requireAuth, async (req, res) => {
  const { qid, selected, correct, mode } = req.body;
  if (!qid) return res.status(400).json({ error: 'Question ID required' });

  try {
    // 1. If wrong, record in mistakes table
    if (!correct) {
      await query(
        `INSERT INTO mistakes (user_id, question_id, times_wrong, last_seen)
         VALUES ($1, $2, 1, now())
         ON CONFLICT (user_id, question_id)
         DO UPDATE SET times_wrong = mistakes.times_wrong + 1, last_seen = now()`,
        [req.user.id, qid]
      );
    }

    // 2. Append answer record to user_progress
    const answerEntry = { ts: Date.now(), selected, correct, mode };
    await query(
      `INSERT INTO user_progress (user_id, answers, updated_at)
       VALUES ($1, jsonb_build_object($2::text, jsonb_build_array($3::jsonb)), now())
       ON CONFLICT (user_id)
       DO UPDATE SET
         answers = jsonb_set(
           COALESCE(user_progress.answers, '{}'::jsonb),
           ARRAY[$2::text],
           COALESCE(user_progress.answers->$2::text, '[]'::jsonb) || $3::jsonb,
           true
         ),
         updated_at = now()`,
      [req.user.id, qid, JSON.stringify(answerEntry)]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record answer in database' });
  }
});

// POST /api/user/sync - bulk sync entire study state into PostgreSQL
router.post('/sync', requireAuth, async (req, res) => {
  const { attempts, bookmarks, answers, confusing, settings } = req.body;

  try {
    // Sync bookmarks
    if (Array.isArray(bookmarks) && bookmarks.length > 0) {
      for (const qid of bookmarks) {
        await query(
          'INSERT INTO bookmarks (user_id, question_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [req.user.id, qid]
        );
      }
    }

    // Sync progress
    await query(
      `INSERT INTO user_progress (user_id, answers, confusing, settings, updated_at)
       VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb, now())
       ON CONFLICT (user_id)
       DO UPDATE SET
         answers = COALESCE(user_progress.answers, '{}'::jsonb) || $2::jsonb,
         confusing = $3::jsonb,
         settings = $4::jsonb,
         updated_at = now()`,
      [
        req.user.id,
        JSON.stringify(answers || {}),
        JSON.stringify(confusing || []),
        JSON.stringify(settings || {})
      ]
    );

    // Sync attempts
    if (Array.isArray(attempts) && attempts.length > 0) {
      for (const a of attempts) {
        if (!a.id) continue;
        const startIso = a.startedAt ? new Date(a.startedAt).toISOString() : null;
        const finishIso = a.finishedAt ? new Date(a.finishedAt).toISOString() : new Date().toISOString();
        await query(
          `INSERT INTO exam_attempts (id, user_id, score, total, answers, domain_scores, started_at, finished_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO NOTHING`,
          [
            a.id,
            req.user.id,
            a.correctCount ?? a.score ?? 0,
            a.total ?? 0,
            JSON.stringify(a.selections ?? a.answers ?? {}),
            JSON.stringify(a.domainStats ?? a.domain_scores ?? {}),
            startIso,
            finishIso
          ]
        );
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to sync data into database' });
  }
});

// DELETE /api/user/reset - reset all study data for current user in PostgreSQL
router.delete('/reset', requireAuth, async (req, res) => {
  try {
    await Promise.all([
      query('DELETE FROM exam_attempts WHERE user_id = $1', [req.user.id]),
      query('DELETE FROM bookmarks WHERE user_id = $1', [req.user.id]),
      query('DELETE FROM mistakes WHERE user_id = $1', [req.user.id]),
      query('DELETE FROM user_progress WHERE user_id = $1', [req.user.id]),
    ]);
    res.json({ ok: true, message: 'All user data wiped from database' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reset database data' });
  }
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
