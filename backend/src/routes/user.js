// backend/src/routes/user.js
import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Exam attempts

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

// Bookmarks

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
  } catch {
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

// Mistakes

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

// Full user state sync

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

    // Sync mistakes if any wrong answers exist
    if (answers && typeof answers === 'object') {
      for (const [qid, records] of Object.entries(answers)) {
        if (Array.isArray(records)) {
          const wrongCount = records.filter(r => r && r.correct === false).length;
          if (wrongCount > 0) {
            await query(
              `INSERT INTO mistakes (user_id, question_id, times_wrong, last_seen)
               VALUES ($1, $2, $3, now())
               ON CONFLICT (user_id, question_id)
               DO UPDATE SET times_wrong = mistakes.times_wrong + $3, last_seen = now()`,
              [req.user.id, qid, wrongCount]
            );
          }
        }
      }
    }

    // Sync attempts
    if (Array.isArray(attempts) && attempts.length > 0) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      for (const a of attempts) {
        if (!a) continue;
        const startIso = a.startedAt ? new Date(a.startedAt).toISOString() : null;
        const finishIso = a.finishedAt ? new Date(a.finishedAt).toISOString() : new Date().toISOString();
        const score = Number(a.correctCount ?? a.score ?? 0);
        const total = Number(a.total ?? 0);
        const answersJson = JSON.stringify(a.selections ?? a.answers ?? {});
        const domainJson = JSON.stringify(a.domainStats ?? a.domain_scores ?? {});

        if (a.id && uuidRegex.test(a.id)) {
          await query(
            `INSERT INTO exam_attempts (id, user_id, score, total, answers, domain_scores, started_at, finished_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            [a.id, req.user.id, score, total, answersJson, domainJson, startIso, finishIso]
          );
        } else {
          await query(
            `INSERT INTO exam_attempts (user_id, score, total, answers, domain_scores, started_at, finished_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [req.user.id, score, total, answersJson, domainJson, startIso, finishIso]
          );
        }
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

// Admin / Developer Endpoints

// GET /api/user/admin/overview - comprehensive platform & student performance metrics
router.get('/admin/overview', requireAdmin, async (req, res) => {
  try {
    const [countsRes, recentRes, mistakesRes, domainsRes] = await Promise.all([
      query(`
        SELECT
          (SELECT COUNT(*) FROM users) AS total_users,
          (SELECT COUNT(*) FROM exam_attempts WHERE user_id IS NOT NULL) AS total_attempts,
          (SELECT COUNT(*) FROM exam_attempts WHERE user_id IS NOT NULL AND (passed = true OR (total > 0 AND score::float / total >= 0.70))) AS passed_attempts,
          (SELECT COALESCE(ROUND(AVG(CASE WHEN total > 0 THEN (score::float / total * 100) ELSE NULL END)::numeric, 1), 0) FROM exam_attempts WHERE user_id IS NOT NULL) AS avg_score_pct,
          (SELECT COUNT(*) FROM bookmarks) AS total_bookmarks,
          (SELECT COUNT(*) FROM mistakes) AS total_mistakes
      `, []),
      query(`
        SELECT a.id, a.user_id, u.username, u.email, a.score, a.total, a.passed,
               a.domain_scores, a.started_at, a.finished_at
        FROM exam_attempts a
        JOIN users u ON u.id = a.user_id
        ORDER BY a.finished_at DESC
        LIMIT 25
      `, []),
      query(`
        SELECT question_id, SUM(times_wrong)::int AS times_wrong, COUNT(DISTINCT user_id)::int AS student_count
        FROM mistakes
        GROUP BY question_id
        ORDER BY times_wrong DESC
        LIMIT 10
      `, []),
      query(`
        SELECT domain_scores
        FROM exam_attempts
        WHERE user_id IS NOT NULL AND domain_scores IS NOT NULL
        ORDER BY finished_at DESC
        LIMIT 100
      `, [])
    ]);

    // Aggregate domain metrics across recent attempts
    const domainTotals = {
      1: { correct: 0, total: 0 },
      2: { correct: 0, total: 0 },
      3: { correct: 0, total: 0 },
      4: { correct: 0, total: 0 },
    };

    for (const row of domainsRes.rows) {
      let ds = row.domain_scores;
      if (typeof ds === 'string') {
        try { ds = JSON.parse(ds); } catch { ds = null; }
      }
      if (ds && typeof ds === 'object') {
        for (const [d, stat] of Object.entries(ds)) {
          const dNum = Number(d);
          if (domainTotals[dNum] && stat && typeof stat.total === 'number') {
            domainTotals[dNum].correct += Number(stat.correct || 0);
            domainTotals[dNum].total += Number(stat.total || 0);
          }
        }
      }
    }

    const domainBenchmarks = Object.entries(domainTotals).map(([d, stat]) => ({
      domain: Number(d),
      accuracy: stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : null,
      total_questions: stat.total,
    }));

    const counts = countsRes.rows[0] || {};

    res.json({
      summary: {
        total_users: Number(counts.total_users || 0),
        total_attempts: Number(counts.total_attempts || 0),
        passed_attempts: Number(counts.passed_attempts || 0),
        pass_rate_pct: Number(counts.total_attempts) > 0
          ? Math.round((Number(counts.passed_attempts) / Number(counts.total_attempts)) * 100)
          : 0,
        avg_score_pct: parseFloat(counts.avg_score_pct || 0),
        total_bookmarks: Number(counts.total_bookmarks || 0),
        total_mistakes: Number(counts.total_mistakes || 0),
      },
      recent_activity: recentRes.rows,
      top_missed: mistakesRes.rows,
      domain_benchmarks: domainBenchmarks,
    });
  } catch (err) {
    console.error('Failed to get admin overview:', err);
    res.status(500).json({ error: 'Failed to load monitoring dashboard data.' });
  }
});

// GET /api/user/admin/users - list registered users with activity stats
router.get('/admin/users', requireAdmin, async (req, res) => {
  try {
    const result = await query(`
      SELECT
        u.id,
        u.username,
        u.email,
        u.role,
        u.created_at,
        COUNT(DISTINCT a.id)::int AS attempts_count,
        COALESCE(ROUND(AVG(CASE WHEN a.total > 0 THEN (a.score::float / a.total * 100) ELSE NULL END)::numeric, 1), 0)::float AS avg_score_pct,
        COUNT(DISTINCT CASE WHEN a.passed = true OR (a.total > 0 AND a.score::float / a.total >= 0.70) THEN a.id END)::int AS passed_count,
        COUNT(DISTINCT b.question_id)::int AS bookmarks_count,
        COUNT(DISTINCT m.question_id)::int AS mistakes_count,
        MAX(GREATEST(a.finished_at, m.last_seen, p.updated_at)) AS last_active
      FROM users u
      LEFT JOIN exam_attempts a ON a.user_id = u.id
      LEFT JOIN bookmarks b ON b.user_id = u.id
      LEFT JOIN mistakes m ON m.user_id = u.id
      LEFT JOIN user_progress p ON p.user_id = u.id
      GROUP BY u.id, u.username, u.email, u.role, u.created_at
      ORDER BY u.created_at DESC
    `, []);

    res.json(result.rows);
  } catch (err) {
    console.error('Failed to get admin users:', err);
    res.status(500).json({ error: 'Failed to load users directory.' });
  }
});

// GET /api/user/admin/users/:id - get detailed user profile & activity
router.get('/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const userRes = await query(
      'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = $1',
      [req.params.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const [attemptsRes, bookmarksRes, mistakesRes, progressRes] = await Promise.all([
      query(
        `SELECT id, score, total, passed, answers, domain_scores, started_at, finished_at
         FROM exam_attempts WHERE user_id = $1 ORDER BY finished_at DESC`,
        [req.params.id]
      ),
      query(
        `SELECT question_id, created_at FROM bookmarks WHERE user_id = $1 ORDER BY created_at DESC`,
        [req.params.id]
      ),
      query(
        `SELECT question_id, times_wrong, last_seen FROM mistakes WHERE user_id = $1 ORDER BY times_wrong DESC`,
        [req.params.id]
      ),
      query(
        `SELECT answers, confusing, settings, updated_at FROM user_progress WHERE user_id = $1`,
        [req.params.id]
      )
    ]);

    const progress = progressRes.rows[0] || { answers: {}, confusing: [], settings: {} };

    res.json({
      user: userRes.rows[0],
      attempts: attemptsRes.rows,
      bookmarks: bookmarksRes.rows,
      mistakes: mistakesRes.rows,
      progress: {
        answers: progress.answers || {},
        confusing: progress.confusing || [],
        settings: progress.settings || {},
        updated_at: progress.updated_at || null,
      }
    });
  } catch (err) {
    console.error('Failed to get user details:', err);
    res.status(500).json({ error: 'Failed to load student details.' });
  }
});

// PATCH /api/user/admin/users/:id/role - promote or demote user
router.patch('/admin/users/:id/role', requireAdmin, async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Role must be "user" or "admin".' });
  }

  if (req.user.id === req.params.id) {
    return res.status(400).json({ error: 'You cannot change your own role.' });
  }

  try {
    const result = await query(
      'UPDATE users SET role = $1, updated_at = now() WHERE id = $2 RETURNING id, username, email, role',
      [role, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ ok: true, user: result.rows[0] });
  } catch (err) {
    console.error('Failed to update user role:', err);
    res.status(500).json({ error: 'Failed to update user role.' });
  }
});

// POST /api/user/admin/users/:id/reset - reset student test and progress data
router.post('/admin/users/:id/reset', requireAdmin, async (req, res) => {
  try {
    const userCheck = await query('SELECT id FROM users WHERE id = $1', [req.params.id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await Promise.all([
      query('DELETE FROM exam_attempts WHERE user_id = $1', [req.params.id]),
      query('DELETE FROM bookmarks WHERE user_id = $1', [req.params.id]),
      query('DELETE FROM mistakes WHERE user_id = $1', [req.params.id]),
      query('DELETE FROM user_progress WHERE user_id = $1', [req.params.id]),
    ]);

    res.json({ ok: true, message: 'Student study and exam data has been reset.' });
  } catch (err) {
    console.error('Failed to reset user data:', err);
    res.status(500).json({ error: 'Failed to reset student data.' });
  }
});

// DELETE /api/user/admin/users/:id - delete a user account and associated data
router.delete('/admin/users/:id', requireAdmin, async (req, res) => {
  if (req.user.id === req.params.id) {
    return res.status(400).json({ error: 'You cannot delete your own account from the user directory.' });
  }

  try {
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id, username, email', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ ok: true, message: 'User account successfully deleted.' });
  } catch (err) {
    console.error('Failed to delete user:', err);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// Keep backward-compatible GET /api/user/admin/stats
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
