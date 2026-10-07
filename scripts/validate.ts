// npm run validate [-- --partial]
// --partial: skip distribution / answer-position checks (used while the bank is incomplete).
import { readdirSync, existsSync } from 'node:fs'
import { ROOT, blueprint, readJson } from './lib/common'
import { questionSchema, type Question } from '../src/types/question'
import { similarity, normalize } from '../src/lib/similarity'
import { en } from '../src/i18n/en'

const partial = process.argv.includes('--partial')
const SIM_THRESHOLD = 0.8
const DIST_TOLERANCE = 5 // percentage points
const MAX_LETTER_SHARE = 35

const errors: string[] = []
const warnings: string[] = []
const err = (m: string) => errors.push(m)

const bp = blueprint()
const tsByDomain = new Map(bp.domains.map((d) => [d.id, new Set(d.taskStatements.map((t) => t.id))]))

// ---------- Questions ----------
const questions: Question[] = []
const seenIds = new Set<string>()
const qDir = `${ROOT}/src/data/questions`
const qFiles = existsSync(qDir) ? readdirSync(qDir).filter((f) => /^d[1-4]\.json$/.test(f)) : []

for (const file of qFiles) {
  const domainFromFile = Number(file[1])
  let raw: unknown
  try {
    raw = readJson<unknown>(`${qDir}/${file}`)
  } catch (e) {
    err(`[${file}] invalid JSON: ${(e as Error).message}`)
    continue
  }
  if (!Array.isArray(raw)) {
    err(`[${file}] must contain a JSON array`)
    continue
  }
  raw.forEach((item, idx) => {
    const label = `[${file}#${idx}${(item as { id?: string })?.id ? ' ' + (item as { id: string }).id : ''}]`
    const parsed = questionSchema.safeParse(item)
    if (!parsed.success) {
      for (const issue of parsed.error.issues) err(`${label} schema: ${issue.path.join('.')} - ${issue.message}`)
      return
    }
    const q = parsed.data
    if (seenIds.has(q.id)) err(`${label} duplicate id`)
    seenIds.add(q.id)
    if (q.domain !== domainFromFile) err(`${label} domain ${q.domain} does not match file ${file}`)
    if (!q.id.startsWith(`d${q.domain}-`)) err(`${label} id prefix does not match domain ${q.domain}`)
    if (!tsByDomain.get(q.domain)?.has(q.taskStatement))
      err(`${label} taskStatement ${q.taskStatement} is not in domain ${q.domain} of the exam guide`)

    const optIds = q.options.map((o) => o.id)
    if (new Set(optIds).size !== optIds.length) err(`${label} duplicate option ids`)
    const expectedOpts = q.type === 'single' ? 4 : 5
    if (q.options.length !== expectedOpts) err(`${label} ${q.type} needs ${expectedOpts} options, has ${q.options.length}`)
    const expectedCorrect = q.type === 'single' ? 1 : 2
    if (q.correctOptionIds.length !== expectedCorrect)
      err(`${label} ${q.type} needs exactly ${expectedCorrect} correct option(s), has ${q.correctOptionIds.length}`)
    if (new Set(q.correctOptionIds).size !== q.correctOptionIds.length) err(`${label} duplicate correctOptionIds`)
    for (const c of q.correctOptionIds) if (!optIds.includes(c)) err(`${label} correctOptionId "${c}" not in options`)
    for (const o of optIds) if (!q.optionExplanations[o]) err(`${label} missing optionExplanations for "${o}"`)
    for (const k of Object.keys(q.optionExplanations)) if (!optIds.includes(k)) err(`${label} optionExplanations has unknown key "${k}"`)

    let host = ''
    try { host = new URL(q.sourceUrl).hostname } catch { /* schema already reports */ }
    const awsHost = host === 'aws.amazon.com' || host.endsWith('.aws.amazon.com') || host === 'awsstatic.com' || host.endsWith('.awsstatic.com')
    if (!awsHost) err(`${label} sourceUrl is not an official AWS URL: ${q.sourceUrl}`)

    const lower = q.options.map((o) => o.text.toLowerCase())
    if (lower.some((t) => /all of the above|none of the above/.test(t))) err(`${label} uses "all/none of the above"`)
    questions.push(q)
  })
}

// near-duplicates
const norm = questions.map((q) => normalize(q.question))
for (let i = 0; i < questions.length; i++) {
  for (let j = i + 1; j < questions.length; j++) {
    if (norm[i] === norm[j]) {
      err(`duplicate question text: ${questions[i].id} and ${questions[j].id}`)
      continue
    }
    const s = similarity(questions[i].question, questions[j].question)
    if (s >= SIM_THRESHOLD) err(`near-duplicate (${s.toFixed(2)}): ${questions[i].id} and ${questions[j].id}`)
  }
}

// distributions
const total = questions.length
const pct = (n: number) => (total ? (n / total) * 100 : 0)
if (!partial) {
  if (total !== bp.targets.totalQuestions) err(`total questions ${total} != target ${bp.targets.totalQuestions}`)
  const check = (name: string, actual: number, target: number) => {
    const dev = Math.abs(pct(actual) - target * 100)
    if (dev > DIST_TOLERANCE) err(`distribution: ${name} is ${pct(actual).toFixed(1)}% (target ${(target * 100).toFixed(1)}%, tolerance +/-${DIST_TOLERANCE})`)
  }
  for (const d of bp.domains)
    check(`domain ${d.id}`, questions.filter((q) => q.domain === d.id).length, bp.targets.perDomain[String(d.id)] / bp.targets.totalQuestions)
  for (const t of ['single', 'multiple'] as const)
    check(`type ${t}`, questions.filter((q) => q.type === t).length, bp.targets.typeSplit[t])
  for (const df of ['easy', 'medium', 'hard'] as const)
    check(`difficulty ${df}`, questions.filter((q) => q.difficulty === df).length, bp.targets.difficultySplit[df])
  for (const d of bp.domains)
    for (const ts of d.taskStatements)
      if (!questions.some((q) => q.taskStatement === ts.id)) err(`task statement ${ts.id} has no questions`)

  const letters: Record<string, number> = {}
  let totalCorrect = 0
  for (const q of questions) for (const c of q.correctOptionIds) { letters[c] = (letters[c] ?? 0) + 1; totalCorrect++ }
  for (const [l, n] of Object.entries(letters)) {
    const share = (n / totalCorrect) * 100
    if (share > MAX_LETTER_SHARE) err(`correct-answer position skew: "${l}" is ${share.toFixed(1)}% (max ${MAX_LETTER_SHARE}%)`)
  }
}

// ---------- i18n dictionaries ----------
const enKeys = new Set(Object.keys(en))
for (const [k, v] of Object.entries(en)) if (!String(v).trim()) err(`i18n: en value for "${k}" is empty`)

// ---------- Report ----------
for (const w of warnings) console.warn(`WARN  ${w}`)
if (errors.length) {
  for (const e of errors) console.error(`ERROR ${e}`)
  console.error(`\nValidation FAILED: ${errors.length} error(s).`)
  process.exit(1)
}
console.log(`Validation passed${partial ? ' (partial mode: distribution checks skipped)' : ''}: ${total} questions, ${enKeys.size} i18n keys.`)

