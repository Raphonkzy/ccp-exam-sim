import type { Question } from '../types/question'
import { DOMAINS, EXAM_TOTAL, domainWeight } from './scoring'

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Largest-remainder allocation of `total` seats following the domain weights, capped by availability. */
export function allocate(total: number, available: Record<number, number>): Record<number, number> {
  const out: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }
  const exact = DOMAINS.map((d) => ({ d, x: (total * domainWeight(d)) / 100 }))
  for (const e of exact) out[e.d] = Math.min(Math.floor(e.x), available[e.d] ?? 0)
  let left = total - DOMAINS.reduce((a, d) => a + out[d], 0)
  const order = [...exact].sort((a, b) => (b.x % 1) - (a.x % 1))
  while (left > 0) {
    let progressed = false
    for (const e of order) {
      if (left === 0) break
      if (out[e.d] < (available[e.d] ?? 0)) { out[e.d]++; left--; progressed = true }
    }
    if (!progressed) break
  }
  return out
}

export function examSize(bank: Question[]): number {
  return Math.min(EXAM_TOTAL, bank.length)
}

/** Builds a shuffled exam whose domain mix follows the official weights. */
export function buildExam(bank: Question[]): Question[] {
  const total = examSize(bank)
  const available: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }
  for (const q of bank) available[q.domain]++
  const plan = allocate(total, available)
  const picked: Question[] = []
  for (const d of DOMAINS) picked.push(...shuffle(bank.filter((q) => q.domain === d)).slice(0, plan[d]))
  return shuffle(picked)
}

export const newId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}
