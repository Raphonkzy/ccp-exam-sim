import type { AppData, BackupFile } from '../types/progress'

export const STORAGE_KEY = 'clf02:v1'

export function defaultData(): AppData {
  return {
    version: 1,
    settings: { lang: 'en', showEnglish: false, theme: 'system' },
    answers: {},
    bookmarks: [],
    confusing: [],
    sessions: [],
    activeExam: null,
    activePractice: null,
  }
}

/** Merge unknown stored data over defaults so older/partial saves never crash the app. */
export function normalizeData(raw: unknown): AppData {
  const base = defaultData()
  if (!raw || typeof raw !== 'object') return base
  const r = raw as Partial<AppData>
  const s = (r.settings ?? {}) as Partial<AppData['settings']>
  return {
    version: 1,
    settings: {
      lang: 'en',
      showEnglish: false,
      theme: s.theme === 'light' || s.theme === 'dark' ? s.theme : 'system',
    },
    answers: r.answers && typeof r.answers === 'object' ? r.answers : {},
    bookmarks: Array.isArray(r.bookmarks) ? r.bookmarks : [],
    confusing: Array.isArray(r.confusing) ? r.confusing : [],
    sessions: Array.isArray(r.sessions) ? r.sessions : [],
    activeExam: r.activeExam ?? null,
    activePractice: r.activePractice ?? null,
  }
}

export function loadData(): AppData {
  try {
    const txt = localStorage.getItem(STORAGE_KEY)
    return txt ? normalizeData(JSON.parse(txt)) : defaultData()
  } catch {
    return defaultData()
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // storage full or unavailable; keep running in memory
  }
}

export function makeBackup(data: AppData): BackupFile {
  return { app: 'clf02-practice', version: 1, exportedAt: new Date().toISOString(), data }
}

export type ParseResult = { ok: true; data: AppData } | { ok: false; reason: string }

export function parseBackup(text: string): ParseResult {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return { ok: false, reason: 'not JSON' }
  }
  const b = json as Partial<BackupFile>
  if (!b || b.app !== 'clf02-practice') return { ok: false, reason: 'unknown app' }
  if (b.version !== 1) return { ok: false, reason: `unsupported version ${String(b.version)}` }
  if (!b.data || typeof b.data !== 'object') return { ok: false, reason: 'missing data' }
  return { ok: true, data: normalizeData(b.data) }
}

export const DEV_NOTES_KEY = 'clf02:devReview'
