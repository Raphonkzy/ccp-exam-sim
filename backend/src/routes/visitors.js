// backend/src/routes/visitors.js
import { Router } from 'express';
import crypto from 'crypto';
import { query } from '../db/pool.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

/**
 * Lightweight User-Agent parser (no heavy dependencies)
 */
function parseUserAgent(ua = '') {
  // 1. Device category
  let device = 'desktop';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    device = 'tablet';
  } else if (
    /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)
  ) {
    device = 'mobile';
  }

  // 2. Browser detection
  let browser = 'Other';
  if (/Edg(e)?\/[0-9]+/i.test(ua)) browser = 'Edge';
  else if (/OPR\/[0-9]+|Opera/i.test(ua)) browser = 'Opera';
  else if (/Chrome\/[0-9]+/i.test(ua)) browser = 'Chrome';
  else if (/Firefox\/[0-9]+/i.test(ua)) browser = 'Firefox';
  else if (/Safari\/[0-9]+/i.test(ua)) browser = 'Safari';

  // 3. Operating System
  let os = 'Other';
  if (/Windows NT 10.0/i.test(ua) || /Windows NT 11.0/i.test(ua)) os = 'Windows 10/11';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Linux/i.test(ua)) os = 'Linux';

  return { device, browser, os };
}

/**
 * Anonymized SHA-256 IP hash for privacy-friendly tracking
 */
function hashIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress) || '127.0.0.1';
  return crypto.createHash('sha256').update(ip + 'ccp-salt').digest('hex').substring(0, 16);
}

// POST /api/visitors/ping - public beacon / heartbeat
router.post('/ping', async (req, res) => {
  try {
    let { visitorId, path, referrer, isPageView } = req.body || {};
    const ua = req.headers['user-agent'] || '';
    const ipHash = hashIp(req);
    const userId = req.user?.id || null;
    const userRole = req.user?.role || null;

    // 1. Admin users never count as visitors
    if (userRole === 'admin') {
      // Purge any accidental records previously stored under this admin
      if (userId) {
        await query('DELETE FROM site_visitors WHERE user_id = $1', [userId]);
        await query('DELETE FROM page_views WHERE user_id = $1', [userId]);
      }
      if (visitorId) {
        await query('DELETE FROM site_visitors WHERE visitor_id = $1', [visitorId]);
        await query('DELETE FROM page_views WHERE visitor_id = $1', [visitorId]);
      }
      return res.json({ ok: true, ignored: true });
    }

    // 2. Ignore internal dev routes
    if (typeof path === 'string' && path.startsWith('/dev')) {
      return res.json({ ok: true, ignored: true });
    }

    // Validate or generate persistent visitor ID
    if (!visitorId || typeof visitorId !== 'string' || !/^[a-zA-Z0-9_-]{8,64}$/.test(visitorId)) {
      visitorId = crypto.randomUUID();
    }

    const currentPath = (typeof path === 'string' && path.trim()) ? path.trim().substring(0, 255) : '/';
    const cleanReferrer = (typeof referrer === 'string' && referrer.trim()) ? referrer.trim().substring(0, 255) : null;
    const parsed = parseUserAgent(ua);

    // Check if visitor already exists in DB
    const existing = await query(
      'SELECT visitor_id, last_seen, visit_count, user_id FROM site_visitors WHERE visitor_id = $1',
      [visitorId]
    );

    if (existing.rows.length === 0) {
      // First time visiting
      await query(`
        INSERT INTO site_visitors (
          visitor_id, user_id, ip_hash, user_agent, browser, os, device, last_path, visit_count, first_seen, last_seen
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, now(), now())
        ON CONFLICT (visitor_id) DO UPDATE SET
          user_id = COALESCE(EXCLUDED.user_id, site_visitors.user_id),
          last_path = EXCLUDED.last_path,
          last_seen = now()
      `, [visitorId, userId, ipHash, ua.substring(0, 500), parsed.browser, parsed.os, parsed.device, currentPath]);
    } else {
      // Returning visitor
      const prevLastSeen = new Date(existing.rows[0].last_seen).getTime();
      // If inactive for > 30 minutes, treat as a new session/visit
      const isNewSession = (Date.now() - prevLastSeen) > 30 * 60 * 1000;
      const nextVisitCount = isNewSession ? (existing.rows[0].visit_count || 1) + 1 : (existing.rows[0].visit_count || 1);

      await query(`
        UPDATE site_visitors
        SET
          user_id = COALESCE($2, user_id),
          ip_hash = $3,
          user_agent = $4,
          browser = $5,
          os = $6,
          device = $7,
          last_path = $8,
          visit_count = $9,
          last_seen = now()
        WHERE visitor_id = $1
      `, [visitorId, userId, ipHash, ua.substring(0, 500), parsed.browser, parsed.os, parsed.device, currentPath, nextVisitCount]);
    }

    // Record page view event if flagged
    if (isPageView) {
      await query(`
        INSERT INTO page_views (visitor_id, user_id, path, referrer, created_at)
        VALUES ($1, $2, $3, $4, now())
      `, [visitorId, userId, currentPath, cleanReferrer]);
    }

    res.json({ ok: true, visitorId });
  } catch (err) {
    console.error('Visitor ping error:', err.message);
    res.status(500).json({ error: 'Failed to record ping' });
  }
});

// GET /api/visitors/stats - comprehensive visitor metrics for developer dashboard
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    // Purge any admin or dev-dashboard rows that might have existed
    await query(`
      DELETE FROM site_visitors
      WHERE user_id IN (SELECT id FROM users WHERE role = 'admin')
         OR last_path LIKE '/dev%';

      DELETE FROM page_views
      WHERE user_id IN (SELECT id FROM users WHERE role = 'admin')
         OR path LIKE '/dev%';
    `);

    const [
      summaryRes,
      topPagesRes,
      deviceRes,
      browserRes,
      osRes,
      dailyTrendRes,
      recentVisitorsRes
    ] = await Promise.all([
      // 1. High-level metric summary (strictly excludes admin and dev paths)
      query(`
        SELECT
          (SELECT COUNT(DISTINCT v.visitor_id)
           FROM site_visitors v
           LEFT JOIN users u ON u.id = v.user_id
           WHERE (u.role IS NULL OR u.role != 'admin')
             AND v.last_seen > now() - INTERVAL '5 minutes'
             AND NOT (v.last_path LIKE '/dev%'))::int AS active_now,

          (SELECT COUNT(DISTINCT v.visitor_id)
           FROM site_visitors v
           LEFT JOIN users u ON u.id = v.user_id
           WHERE (u.role IS NULL OR u.role != 'admin')
             AND NOT (v.last_path LIKE '/dev%'))::int AS total_visitors,

          (SELECT COUNT(DISTINCT v.visitor_id)
           FROM site_visitors v
           LEFT JOIN users u ON u.id = v.user_id
           WHERE (u.role IS NULL OR u.role != 'admin')
             AND v.last_seen >= CURRENT_DATE
             AND NOT (v.last_path LIKE '/dev%'))::int AS visitors_today,

          (SELECT COUNT(DISTINCT v.visitor_id)
           FROM site_visitors v
           LEFT JOIN users u ON u.id = v.user_id
           WHERE (u.role IS NULL OR u.role != 'admin')
             AND v.last_seen >= now() - INTERVAL '7 days'
             AND NOT (v.last_path LIKE '/dev%'))::int AS visitors_7d,

          (SELECT COUNT(*)
           FROM page_views pv
           LEFT JOIN users u ON u.id = pv.user_id
           WHERE (u.role IS NULL OR u.role != 'admin')
             AND NOT (pv.path LIKE '/dev%'))::int AS total_page_views,

          (SELECT COUNT(*)
           FROM page_views pv
           LEFT JOIN users u ON u.id = pv.user_id
           WHERE (u.role IS NULL OR u.role != 'admin')
             AND pv.created_at >= CURRENT_DATE
             AND NOT (pv.path LIKE '/dev%'))::int AS views_today,

          (SELECT COUNT(DISTINCT v.visitor_id)
           FROM site_visitors v
           LEFT JOIN users u ON u.id = v.user_id
           WHERE (u.role IS NULL OR u.role != 'admin')
             AND v.visit_count > 1
             AND NOT (v.last_path LIKE '/dev%'))::int AS returning_visitors
      `),

      // 2. Top visited pages
      query(`
        SELECT
          pv.path,
          COUNT(*)::int AS total_views,
          COUNT(DISTINCT pv.visitor_id)::int AS unique_visitors
        FROM page_views pv
        LEFT JOIN users u ON u.id = pv.user_id
        WHERE (u.role IS NULL OR u.role != 'admin')
          AND NOT (pv.path LIKE '/dev%')
        GROUP BY pv.path
        ORDER BY total_views DESC
        LIMIT 10
      `),

      // 3. Device breakdown
      query(`
        SELECT
          COALESCE(v.device, 'desktop') AS device,
          COUNT(*)::int AS count
        FROM site_visitors v
        LEFT JOIN users u ON u.id = v.user_id
        WHERE (u.role IS NULL OR u.role != 'admin')
          AND NOT (v.last_path LIKE '/dev%')
        GROUP BY v.device
        ORDER BY count DESC
      `),

      // 4. Browser breakdown
      query(`
        SELECT
          COALESCE(v.browser, 'Other') AS browser,
          COUNT(*)::int AS count
        FROM site_visitors v
        LEFT JOIN users u ON u.id = v.user_id
        WHERE (u.role IS NULL OR u.role != 'admin')
          AND NOT (v.last_path LIKE '/dev%')
        GROUP BY v.browser
        ORDER BY count DESC
        LIMIT 8
      `),

      // 5. OS breakdown
      query(`
        SELECT
          COALESCE(v.os, 'Other') AS os,
          COUNT(*)::int AS count
        FROM site_visitors v
        LEFT JOIN users u ON u.id = v.user_id
        WHERE (u.role IS NULL OR u.role != 'admin')
          AND NOT (v.last_path LIKE '/dev%')
        GROUP BY v.os
        ORDER BY count DESC
        LIMIT 8
      `),

      // 6. 14-day daily traffic trend
      query(`
        WITH days AS (
          SELECT generate_series(
            CURRENT_DATE - INTERVAL '13 days',
            CURRENT_DATE,
            '1 day'::interval
          )::date AS day
        ),
        daily_v AS (
          SELECT
            DATE_TRUNC('day', v.last_seen)::date AS day,
            COUNT(DISTINCT v.visitor_id)::int AS visitors
          FROM site_visitors v
          LEFT JOIN users u ON u.id = v.user_id
          WHERE (u.role IS NULL OR u.role != 'admin')
            AND NOT (v.last_path LIKE '/dev%')
            AND v.last_seen >= CURRENT_DATE - INTERVAL '13 days'
          GROUP BY 1
        ),
        daily_pv AS (
          SELECT
            DATE_TRUNC('day', pv.created_at)::date AS day,
            COUNT(*)::int AS views
          FROM page_views pv
          LEFT JOIN users u ON u.id = pv.user_id
          WHERE (u.role IS NULL OR u.role != 'admin')
            AND NOT (pv.path LIKE '/dev%')
            AND pv.created_at >= CURRENT_DATE - INTERVAL '13 days'
          GROUP BY 1
        )
        SELECT
          TO_CHAR(d.day, 'YYYY-MM-DD') AS date,
          TO_CHAR(d.day, 'Mon DD') AS label,
          COALESCE(dv.visitors, 0)::int AS visitors,
          COALESCE(dpv.views, 0)::int AS page_views
        FROM days d
        LEFT JOIN daily_v dv ON dv.day = d.day
        LEFT JOIN daily_pv dpv ON dpv.day = d.day
        ORDER BY d.day ASC
      `),

      // 7. Recent 50 visitors stream
      query(`
        SELECT
          v.visitor_id,
          v.user_id,
          u.username,
          u.email,
          u.role,
          v.browser,
          v.os,
          v.device,
          v.last_path,
          v.visit_count,
          v.first_seen,
          v.last_seen,
          (v.last_seen > now() - INTERVAL '5 minutes') AS is_active
        FROM site_visitors v
        LEFT JOIN users u ON u.id = v.user_id
        WHERE (u.role IS NULL OR u.role != 'admin')
          AND NOT (v.last_path LIKE '/dev%')
        ORDER BY v.last_seen DESC
        LIMIT 50
      `)
    ]);

    const summary = summaryRes.rows[0] || {
      active_now: 0,
      total_visitors: 0,
      visitors_today: 0,
      visitors_7d: 0,
      total_page_views: 0,
      views_today: 0,
      returning_visitors: 0,
    };

    res.json({
      summary: {
        active_now: Number(summary.active_now || 0),
        total_visitors: Number(summary.total_visitors || 0),
        visitors_today: Number(summary.visitors_today || 0),
        visitors_7d: Number(summary.visitors_7d || 0),
        total_page_views: Number(summary.total_page_views || 0),
        views_today: Number(summary.views_today || 0),
        returning_visitors: Number(summary.returning_visitors || 0),
      },
      top_pages: topPagesRes.rows,
      devices: deviceRes.rows,
      browsers: browserRes.rows,
      operating_systems: osRes.rows,
      daily_trend: dailyTrendRes.rows,
      recent_visitors: recentVisitorsRes.rows,
    });
  } catch (err) {
    console.error('Failed to get visitor stats:', err);
    res.status(500).json({ error: 'Failed to load visitor monitoring metrics.' });
  }
});

export default router;
