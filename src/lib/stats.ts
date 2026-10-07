import type { AppData } from '../types/progress'
import { allQuestions } from './questionService'
import { DOMAINS } from './scoring'

export function dayKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

export function computeStreak(data: AppData, now = Date.now()): number {
  const days = new Set<string>()
  for (const recs of Object.values(data.answers)) for (const r of recs) days.add(dayKey(r.ts))
  let streak = 0
  let cursor = now
  // allow the streak to continue if the last study day was yesterday
  if (!days.has(dayKey(cursor))) cursor -= 86400000
  while (days.has(dayKey(cursor))) {
    streak++
    cursor -= 86400000
  }
  return streak
}

export function latestWrongIds(data: AppData): string[] {
  return Object.entries(data.answers)
    .filter(([, recs]) => recs.length > 0 && !recs[recs.length - 1].correct)
    .map(([id]) => id)
    .filter((id) => allQuestions.some((q) => q.id === id))
}

export function wrongCount(data: AppData, qid: string): number {
  return (data.answers[qid] ?? []).filter((r) => !r.correct).length
}

export interface DomainAccuracy {
  domain: number
  correct: number
  total: number
  pct: number | null
}

export function domainAccuracy(data: AppData): DomainAccuracy[] {
  return DOMAINS.map((d) => {
    let correct = 0
    let total = 0
    for (const q of allQuestions) {
      if (q.domain !== d) continue
      for (const r of data.answers[q.id] ?? []) {
        total++
        if (r.correct) correct++
      }
    }
    return { domain: d, correct, total, pct: total ? Math.round((correct / total) * 100) : null }
  })
}

export function overall(data: AppData) {
  let correct = 0
  let total = 0
  let answeredUnique = 0
  for (const q of allQuestions) {
    const recs = data.answers[q.id] ?? []
    if (recs.length) answeredUnique++
    for (const r of recs) {
      total++
      if (r.correct) correct++
    }
  }
  return { correct, total, answeredUnique, pct: total ? Math.round((correct / total) * 100) : null }
}

export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  const mm = String(m).padStart(h ? 2 : 1, '0')
  const ss = String(s).padStart(2, '0')
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}
