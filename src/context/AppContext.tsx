import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ActiveExam, AppData, SessionMode, Session, Settings } from '../types/progress'
import { defaultData, loadData, saveData } from '../lib/storage'
import { useAuth } from './AuthContext'

interface AppContextValue {
  data: AppData
  dbSyncing: boolean
  lastSyncedAt: Date | null
  syncWithDatabase: () => Promise<void>
  setSettings: (patch: Partial<Settings>) => void
  recordAnswer: (qid: string, selected: string[], correct: boolean, mode: SessionMode) => void
  toggleBookmark: (qid: string) => void
  toggleConfusing: (qid: string) => void
  addSession: (s: Session) => void
  deleteSession: (id: string) => void
  setActiveExam: (e: ActiveExam | null) => void
  replaceData: (d: AppData) => void
  resetData: () => Promise<void>
}

const Ctx = createContext<AppContextValue | null>(null)

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [data, setData] = useState<AppData>(loadData)
  const [dbSyncing, setDbSyncing] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)

  // Save guest data to localStorage
  useEffect(() => {
    if (!user) {
      saveData(data)
    }
  }, [data, user])

  // Always ensure clean light theme
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.removeAttribute('data-theme')
  }, [])

  // html lang attribute
  useEffect(() => {
    document.documentElement.lang = 'en'
  }, [])

  // Sync complete state with PostgreSQL database
  const syncWithDatabase = useCallback(async () => {
    if (!user) return
    setDbSyncing(true)
    try {
      const res = await fetch('/api/user/full-state', { credentials: 'include' })
      if (!res.ok) return
      const serverState = await res.json()

      const mappedSessions: Session[] = (serverState.attempts || []).map((a: {
        id: string
        score: number
        total: number
        passed: boolean
        answers: Record<string, string[]> | string
        domain_scores: Record<number, { correct: number; total: number }> | string
        started_at: string | null
        finished_at: string | null
      }) => {
        const startedAt = a.started_at ? new Date(a.started_at).getTime() : Date.now()
        const finishedAt = a.finished_at ? new Date(a.finished_at).getTime() : Date.now()
        let selections: Record<string, string[]> = {}
        try {
          selections = typeof a.answers === 'string' ? JSON.parse(a.answers) : (a.answers ?? {})
        } catch {
          selections = {}
        }
        let domainStats: Record<number, { correct: number; total: number }> = {}
        try {
          domainStats = typeof a.domain_scores === 'string' ? JSON.parse(a.domain_scores) : (a.domain_scores ?? {})
        } catch {
          domainStats = {}
        }
        return {
          id: a.id,
          mode: 'exam' as const,
          startedAt,
          finishedAt,
          durationSec: Math.max(0, Math.round((finishedAt - startedAt) / 1000)),
          questionIds: Object.keys(selections),
          selections,
          flagged: [],
          correctCount: a.score,
          total: a.total,
          domainStats,
          estScore: a.total ? Math.round(100 + (a.score / a.total) * 900) : 100,
          passed: a.passed,
        }
      })

      const serverEmpty =
        mappedSessions.length === 0 &&
        (!serverState.bookmarks || serverState.bookmarks.length === 0) &&
        Object.keys(serverState.progress?.answers || {}).length === 0

      setData((prev) => {
        // If server is clean brand new but user had local guest progress, upload to DB
        if (serverEmpty && (prev.sessions.length > 0 || prev.bookmarks.length > 0 || Object.keys(prev.answers).length > 0)) {
          fetch('/api/user/sync', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              attempts: prev.sessions,
              bookmarks: prev.bookmarks,
              answers: prev.answers,
              confusing: prev.confusing,
              settings: prev.settings,
            }),
          }).catch(() => {})
          return prev
        }

        return {
          version: 1,
          settings: { ...defaultData().settings, ...(serverState.progress?.settings || {}) },
          answers: serverState.progress?.answers || {},
          bookmarks: Array.isArray(serverState.bookmarks) ? serverState.bookmarks : [],
          confusing: Array.isArray(serverState.progress?.confusing) ? serverState.progress.confusing : [],
          sessions: mappedSessions,
          activeExam: null,
        }
      })
      setLastSyncedAt(new Date())
    } catch (e) {
      console.warn('Failed to sync with database:', e)
    } finally {
      setDbSyncing(false)
    }
  }, [user])

  // When user signs in or signs out
  useEffect(() => {
    if (user) {
      syncWithDatabase()
    } else {
      setData(loadData())
    }
  }, [user, syncWithDatabase])

  const setSettings = useCallback(
    (patch: Partial<Settings>) => {
      setData((d) => {
        const nextSettings = { ...d.settings, ...patch }
        if (user) {
          fetch('/api/user/sync', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings: nextSettings }),
          }).catch(() => {})
        }
        return { ...d, settings: nextSettings }
      })
    },
    [user],
  )

  const recordAnswer = useCallback(
    (qid: string, selected: string[], correct: boolean, mode: SessionMode) => {
      setData((d) => ({
        ...d,
        answers: { ...d.answers, [qid]: [...(d.answers[qid] ?? []), { ts: Date.now(), selected, correct, mode }] },
      }))
      if (user) {
        fetch('/api/user/answer', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qid, selected, correct, mode }),
        }).catch(() => {})
      }
    },
    [user],
  )

  const toggleBookmark = useCallback(
    (qid: string) => {
      setData((d) => {
        const next = toggle(d.bookmarks, qid)
        const isAdding = next.includes(qid)
        if (user) {
          fetch(`/api/user/bookmarks/${encodeURIComponent(qid)}`, {
            method: isAdding ? 'POST' : 'DELETE',
            credentials: 'include',
          }).catch(() => {})
        }
        return { ...d, bookmarks: next }
      })
    },
    [user],
  )

  const toggleConfusing = useCallback(
    (qid: string) => {
      setData((d) => {
        const next = toggle(d.confusing, qid)
        if (user) {
          fetch('/api/user/sync', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ confusing: next }),
          }).catch(() => {})
        }
        return { ...d, confusing: next }
      })
    },
    [user],
  )

  const addSession = useCallback(
    (s: Session) => {
      setData((d) => ({ ...d, sessions: [s, ...d.sessions.filter((x) => x.id !== s.id)] }))
      if (user) {
        fetch('/api/user/attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            score: s.correctCount,
            total: s.total,
            answers: s.selections,
            domain_scores: s.domainStats,
            started_at: s.startedAt,
            finished_at: s.finishedAt,
          }),
        }).catch(() => {})
      }
    },
    [user],
  )

  const deleteSession = useCallback(
    (id: string) => {
      setData((d) => {
        const session = d.sessions.find((s) => s.id === id)
        // Also remove the answered questions that belong to this session
        const qidsToRemove = new Set(session ? Object.keys(session.selections ?? {}) : [])
        const nextAnswers = qidsToRemove.size > 0
          ? Object.fromEntries(Object.entries(d.answers).filter(([k]) => !qidsToRemove.has(k)))
          : d.answers
        return {
          ...d,
          sessions: d.sessions.filter((s) => s.id !== id),
          answers: nextAnswers,
        }
      })
      if (user) {
        // Backend now handles scrubbing answers from user_progress too
        fetch(`/api/user/attempts/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          credentials: 'include',
        }).catch(() => {})
      }
    },
    [user],
  )

  const setActiveExam = useCallback(
    (e: ActiveExam | null) => setData((d) => ({ ...d, activeExam: e })),
    [],
  )

  const replaceData = useCallback((nd: AppData) => setData(nd), [])

  const resetData = useCallback(async () => {
    if (user) {
      try {
        await fetch('/api/user/reset', { method: 'DELETE', credentials: 'include' })
      } catch (err) {
        console.error('Failed to reset DB data:', err)
      }
    }
    // Always wipe localStorage — for guests this is their only storage,
    // for DB users we don't want stale local data to re-sync on next login
    const { STORAGE_KEY } = await import('../lib/storage')
    localStorage.removeItem(STORAGE_KEY)
    const clean = defaultData()
    setData(clean)
    setLastSyncedAt(null)
  }, [user])

  const value = useMemo(
    () => ({
      data,
      dbSyncing,
      lastSyncedAt,
      syncWithDatabase,
      setSettings,
      recordAnswer,
      toggleBookmark,
      toggleConfusing,
      addSession,
      deleteSession,
      setActiveExam,
      replaceData,
      resetData,
    }),
    [
      data,
      dbSyncing,
      lastSyncedAt,
      syncWithDatabase,
      setSettings,
      recordAnswer,
      toggleBookmark,
      toggleConfusing,
      addSession,
      deleteSession,
      setActiveExam,
      replaceData,
      resetData,
    ],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp(): AppContextValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp must be used inside AppProvider')
  return v
}
