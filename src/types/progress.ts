import type { Lang } from './question'

export type ThemeSetting = 'light' | 'dark' | 'system'
export type SessionMode = 'practice' | 'exam'

export interface Settings {
  lang: Lang
  showEnglish: boolean
  theme: ThemeSetting
}

export interface AnswerRecord {
  ts: number
  selected: string[]
  correct: boolean
  mode: SessionMode
}

export interface DomainStat {
  correct: number
  total: number
}

export interface Session {
  id: string
  mode: SessionMode
  startedAt: number
  finishedAt: number
  durationSec: number
  questionIds: string[]
  selections: Record<string, string[]>
  flagged: string[]
  correctCount: number
  total: number
  domainStats: Record<number, DomainStat>
  /** Estimated scaled score 100-1000 (exam mode only) */
  estScore?: number
  passed?: boolean
}

/** An exam that is currently running; persisted so reloads do not lose the timer. */
export interface ActiveExam {
  id: string
  questionIds: string[]
  selections: Record<string, string[]>
  flagged: string[]
  startedAt: number
  deadline: number
  index: number
}

/** A practice session that is in progress; persisted so navigation does not lose answers. */
export interface ActivePractice {
  id: string
  questionIds: string[]
  selections: Record<string, string[]>
  checked: string[]   // question IDs that have been submitted/checked
  startedAt: number
  index: number
}

export interface AppData {
  version: 1
  settings: Settings
  answers: Record<string, AnswerRecord[]>
  bookmarks: string[]
  confusing: string[]
  sessions: Session[]
  activeExam: ActiveExam | null
  activePractice: ActivePractice | null
}

export interface BackupFile {
  app: 'clf02-practice'
  version: 1
  exportedAt: string
  data: AppData
}
