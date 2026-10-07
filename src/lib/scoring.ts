import blueprint from '../data/blueprint.json'
import type { Question } from '../types/question'
import type { DomainStat, Session } from '../types/progress'

export const DOMAINS = [1, 2, 3, 4] as const
export const EXAM_TOTAL = blueprint.exam.totalQuestions
export const EXAM_MINUTES = blueprint.exam.durationMinutes
export const PASS_SCORE = blueprint.exam.passingScore
export const domainWeight = (d: number): number => blueprint.domains.find((x) => x.id === d)?.weight ?? 0

export function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const s = new Set(a)
  return b.every((x) => s.has(x))
}

export const isCorrect = (q: Question, selected: string[]): boolean => sameSet(q.correctOptionIds, selected)

export function emptyDomainStats(): Record<number, DomainStat> {
  return { 1: { correct: 0, total: 0 }, 2: { correct: 0, total: 0 }, 3: { correct: 0, total: 0 }, 4: { correct: 0, total: 0 } }
}

export function computeDomainStats(questions: Question[], selections: Record<string, string[]>): Record<number, DomainStat> {
  const stats = emptyDomainStats()
  for (const q of questions) {
    stats[q.domain].total++
    if (isCorrect(q, selections[q.id] ?? [])) stats[q.domain].correct++
  }
  return stats
}

/**
 * Approximate scaled score: domain accuracy weighted by the official domain weights
 * (re-normalised over domains that appear in the attempt), mapped linearly to 100-1000.
 */
export function estimateScore(stats: Record<number, DomainStat>): number {
  let weightSum = 0
  let acc = 0
  for (const d of DOMAINS) {
    const s = stats[d]
    if (!s || s.total === 0) continue
    const w = domainWeight(d)
    weightSum += w
    acc += w * (s.correct / s.total)
  }
  const rate = weightSum ? acc / weightSum : 0
  return Math.round(100 + rate * 900)
}

export function summarize(
  id: string,
  mode: Session['mode'],
  startedAt: number,
  questions: Question[],
  selections: Record<string, string[]>,
  flagged: string[],
): Session {
  const domainStats = computeDomainStats(questions, selections)
  const correctCount = questions.filter((q) => isCorrect(q, selections[q.id] ?? [])).length
  const finishedAt = Date.now()
  const s: Session = {
    id, mode, startedAt, finishedAt,
    durationSec: Math.max(0, Math.round((finishedAt - startedAt) / 1000)),
    questionIds: questions.map((q) => q.id),
    selections, flagged, correctCount, total: questions.length, domainStats,
  }
  if (mode === 'exam') {
    s.estScore = estimateScore(domainStats)
    s.passed = s.estScore >= PASS_SCORE
  }
  return s
}
