import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const VISITOR_ID_KEY = 'clf02_vid'
const HEARTBEAT_INTERVAL_MS = 45000 // 45 seconds

/**
 * Get or initialize persistent visitor ID
 */
export function getOrCreateVisitorId(): string {
  try {
    let vid = localStorage.getItem(VISITOR_ID_KEY)
    if (vid && /^[a-zA-Z0-9_-]{8,64}$/.test(vid)) {
      return vid
    }
    vid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `v_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    localStorage.setItem(VISITOR_ID_KEY, vid)
    return vid
  } catch {
    return 'anon_guest'
  }
}

/**
 * Send beacon / heartbeat to backend
 */
async function sendPing(path: string, isPageView: boolean, referrer?: string) {
  try {
    const vid = getOrCreateVisitorId()
    await fetch('/api/visitors/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        visitorId: vid,
        path,
        referrer: referrer || document.referrer || '',
        isPageView,
      }),
      // keepalive helps pings complete during page unloads
      keepalive: true,
    })
  } catch {
    // Non-blocking: fail silently if network or backend offline
  }
}

/**
 * React hook to track route views and active-session heartbeats.
 * Excludes administrators and dev routes completely.
 */
export function useVisitorTracker() {
  const { user } = useAuth()
  const location = useLocation()
  const lastPingTime = useRef<number>(Date.now())
  const prevPath = useRef<string>('')

  const isAdmin = user?.role === 'admin'
  const isDevRoute = location.pathname.startsWith('/dev')

  // 1. Trigger page view whenever route changes (skip for admin)
  useEffect(() => {
    if (isAdmin || isDevRoute) return

    const currentPath = location.pathname + location.search
    if (currentPath !== prevPath.current) {
      prevPath.current = currentPath
      sendPing(location.pathname, true)
      lastPingTime.current = Date.now()
    }
  }, [location.pathname, location.search, isAdmin, isDevRoute])

  // 2. Periodic heartbeat while user is actively viewing the tab (skip for admin)
  useEffect(() => {
    if (isAdmin || isDevRoute) return

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        sendPing(location.pathname, false)
        lastPingTime.current = Date.now()
      }
    }, HEARTBEAT_INTERVAL_MS)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - lastPingTime.current
        // If tab was inactive for > 30s and reopened, ping right away
        if (elapsed > 30000) {
          sendPing(location.pathname, false)
          lastPingTime.current = Date.now()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [location.pathname, isAdmin, isDevRoute])
}
