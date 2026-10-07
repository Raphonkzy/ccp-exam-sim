import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ActiveExam, AppData, SessionMode, Session, Settings } from '../types/progress'
import { defaultData, loadData, saveData } from '../lib/storage'
import { useAuth } from './AuthContext'

interface AppContextValue {
  data: AppData
  setSettings: (patch: Partial<Settings>) => void
  recordAnswer: (qid: string, selected: string[], correct: boolean, mode: SessionMode) => void
  toggleBookmark: (qid: string) => void
  toggleConfusing: (qid: string) => void
  addSession: (s: Session) => void
  deleteSession: (id: string) => void
  setActiveExam: (e: ActiveExam | null) => void
  replaceData: (d: AppData) => void
  resetData: () => void
}

const Ctx = createContext<AppContextValue | null>(null)

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [data, setData] = useState<AppData>(loadData)

  useEffect(() => saveData(data), [data])

  // Always ensure clean light theme
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.removeAttribute('data-theme')
  }, [])

  // html lang attribute
  useEffect(() => {
    document.documentElement.lang = 'en'
  }, [])

  // Sync with backend database when logged in
  useEffect(() => {
    if (!user) return
    let active = true

    // 1. Fetch server attempts
    fetch('/api/user/attempts', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then(
        (
          serverAttempts: Array<{
            id: string
            score: number
            total: number
            passed: boolean
            answers: Record<string, string[]> | string
            domain_scores: Record<number, { correct: number; total: number }> | string
            started_at: string | null
            finished_at: string | null
          }>,
        ) => {
          if (!active || !Array.isArray(serverAttempts)) return
          setData((prev) => {
            const mappedSessions: Session[] = serverAttempts.map((a) => {
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
                mode: 'exam',
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

            const existingIds = new Set(prev.sessions.map((s) => s.id))
            const newFromDb = mappedSessions.filter((s) => !existingIds.has(s.id))
            if (newFromDb.length === 0) return prev
            return {
              ...prev,
              sessions: [...newFromDb, ...prev.sessions],
            }
          })
        },
      )
      .catch(() => {})

    // 2. Fetch server bookmarks
    fetch('/api/user/bookmarks', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then((serverBookmarks: string[]) => {
        if (!active || !Array.isArray(serverBookmarks)) return
        setData((prev) => {
          const merged = Array.from(new Set([...prev.bookmarks, ...serverBookmarks]))
          if (merged.length === prev.bookmarks.length) return prev
          return { ...prev, bookmarks: merged }
        })
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [user])

  const setSettings = useCallback(
    (patch: Partial<Settings>) => setData((d) => ({ ...d, settings: { ...d.settings, ...patch } })),
    [],
  )

  const recordAnswer = useCallback(
    (qid: string, selected: string[], correct: boolean, mode: SessionMode) => {
      setData((d) => ({
        ...d,
        answers: { ...d.answers, [qid]: [...(d.answers[qid] ?? []), { ts: Date.now(), selected, correct, mode }] },
      }))
      if (user && !correct) {
        fetch(`/api/user/mistakes/${encodeURIComponent(qid)}`, {
          method: 'POST',
          credentials: 'include',
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
    (qid: string) => setData((d) => ({ ...d, confusing: toggle(d.confusing, qid) })),
    [],
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
      setData((d) => ({ ...d, sessions: d.sessions.filter((s) => s.id !== id) }))
      if (user) {
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

  const resetData = useCallback(
    () => setData((d) => ({ ...defaultData(), settings: d.settings })),
    [],
  )

  const value = useMemo(
    () => ({
      data,
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
