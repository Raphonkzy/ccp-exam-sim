// npm run stats
import { readdirSync, existsSync } from 'node:fs'
import { ROOT, blueprint, readJson } from './lib/common'
import type { Question } from '../src/types/question'

const bp = blueprint()
const qDir = `${ROOT}/src/data/questions`
const questions: Question[] = existsSync(qDir)
  ? readdirSync(qDir).filter((f) => /^d[1-4]\.json$/.test(f)).flatMap((f) => readJson<Question[]>(`${qDir}/${f}`))
  : []

const count = <T>(items: T[], key: (t: T) => string) => {
  const m: Record<string, number> = {}
  for (const i of items) m[key(i)] = (m[key(i)] ?? 0) + 1
  return m
}
const table = (title: string, m: Record<string, number>) => {
  console.log(`\n${title}`)
  for (const k of Object.keys(m).sort()) console.log(`  ${k.padEnd(14)} ${m[k]}`)
}

console.log(`Total questions: ${questions.length} / ${bp.targets.totalQuestions}`)
table('Per domain (target in brackets)', Object.fromEntries(bp.domains.map((d) => [
  `D${d.id} [${bp.targets.perDomain[String(d.id)]}]`, questions.filter((q) => q.domain === d.id).length,
])))
table('Per task statement', Object.fromEntries(bp.domains.flatMap((d) => d.taskStatements.map((t) => [
  t.id, questions.filter((q) => q.taskStatement === t.id).length,
]))))
table('Per type', count(questions, (q) => q.type))
table('Per difficulty', count(questions, (q) => q.difficulty))
table('Verification', count(questions, (q) => (q.verified ? 'verified' : 'unverified')))
table('Needs review', count(questions, (q) => (q.needsReview ? 'needsReview' : 'ok')))
table('Correct-answer letters', (() => {
  const m: Record<string, number> = {}
  for (const q of questions) for (const c of q.correctOptionIds) m[c] = (m[c] ?? 0) + 1
  return m
})())
