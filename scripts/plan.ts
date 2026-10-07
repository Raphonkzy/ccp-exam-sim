// npm run plan — how many questions each task statement needs to reach the targets.
import { writeFileSync, mkdirSync } from 'node:fs'
import { blueprint, ROOT } from './lib/common'

const bp = blueprint()
const { perDomain, typeSplit, difficultySplit } = bp.targets

/** Largest-remainder split of `total` into `parts` near-equal integers. */
function splitEven(total: number, parts: number): number[] {
  const base = Math.floor(total / parts)
  const rem = total - base * parts
  // give the extra units to the later task statements deterministically
  return Array.from({ length: parts }, (_, i) => base + (i >= parts - rem ? 1 : 0))
}

interface Row {
  taskStatement: string
  domain: number
  total: number
  single: number
  multiple: number
  easy: number
  medium: number
  hard: number
  batches: number
}

const rows: Row[] = []
let cum = 0
let prevMulti = 0
let prevEasy = 0
let prevMed = 0

for (const d of bp.domains) {
  const counts = splitEven(perDomain[String(d.id)], d.taskStatements.length)
  d.taskStatements.forEach((ts, i) => {
    const n = counts[i]
    cum += n
    // cumulative rounding keeps global ratios exact and per-row errors <= 1
    const multiCum = Math.round(cum * typeSplit.multiple)
    const easyCum = Math.round(cum * difficultySplit.easy)
    const medCum = Math.round(cum * (difficultySplit.easy + difficultySplit.medium))
    const multiple = multiCum - prevMulti
    const easy = easyCum - prevEasy
    const medium = medCum - easyCum - prevMed
    const hard = n - easy - medium
    prevMulti = multiCum
    prevEasy = easyCum
    prevMed = medCum - easyCum
    rows.push({
      taskStatement: ts.id, domain: d.id, total: n,
      single: n - multiple, multiple, easy, medium, hard,
      batches: Math.ceil(n / 10),
    })
  })
}

console.log('TS    D  total single multi easy med hard batches')
for (const r of rows) {
  console.log(
    `${r.taskStatement.padEnd(5)} ${r.domain}  ${String(r.total).padStart(5)} ${String(r.single).padStart(6)} ${String(r.multiple).padStart(5)} ${String(r.easy).padStart(4)} ${String(r.medium).padStart(3)} ${String(r.hard).padStart(4)} ${String(r.batches).padStart(7)}`,
  )
}
const sum = (k: keyof Row) => rows.reduce((a, r) => a + (r[k] as number), 0)
console.log(
  `TOTAL    ${String(sum('total')).padStart(5)} ${String(sum('single')).padStart(6)} ${String(sum('multiple')).padStart(5)} ${String(sum('easy')).padStart(4)} ${String(sum('medium')).padStart(3)} ${String(sum('hard')).padStart(4)} ${String(sum('batches')).padStart(7)}`,
)

mkdirSync(`${ROOT}/data-qa`, { recursive: true })
writeFileSync(`${ROOT}/data-qa/plan.json`, JSON.stringify(rows, null, 2))
