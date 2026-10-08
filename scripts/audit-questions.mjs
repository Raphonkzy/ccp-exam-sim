// audit-questions.mjs  –  node scripts/audit-questions.mjs
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '../src/data/questions')
const outPath = join(__dirname, '../audit-report.md')

const files = ['d1.json','d2.json','d3.json','d4.json']
let all = []
for (const f of files) {
  const raw = JSON.parse(readFileSync(join(dataDir, f), 'utf8'))
  const qs = Array.isArray(raw) ? raw : (raw.questions ?? raw.data ?? [])
  all.push(...qs)
}
console.log(`Loaded ${all.length} questions`)

const WORD_LIMIT = 20
const DEF_PATS = [
  /which is (the|a|an) /i,
  /,\s*(which|that) (is|are|allows|provides|enables|manages|controls|stores|runs|handles)/i,
  /\(a (managed|serverless|fully managed|cloud.native|distributed|global)/i,
  /\(an? (AWS|Amazon) /i,
  /is (the|a|an) AWS service that/i,
  /\(free tier/i,
  /Identity and Access Management/i,
  /Simple Storage Service/i,
  /Elastic Compute Cloud/i,
  /Virtual Private Cloud/i,
]
const STEM_PATS = [
  /^What is (the|a|an) /i,
  /^Which of the following (best )?describes/i,
  /^Which statement (best )?describes/i,
  /^Define /i,
  /^What does .{1,30} stand for\?/i,
  /^What (is|are) the (primary |main |key )?benefits? of /i,
  /^Which of the following is (NOT|not) (true|correct|accurate)/i,
]

function checkOption(text) {
  const issues = []
  if (text.trim().split(/\s+/).length > WORD_LIMIT) issues.push(`TOO_LONG`)
  if (DEF_PATS.some(p => p.test(text))) issues.push('DEFINES_SERVICE')
  return issues
}

const domainCounts = {1:0,2:0,3:0,4:0}
const styleViolations = []
const stemIssues = []
const distractorIssues = []

for (const q of all) {
  const id = q.id ?? q.questionId ?? '?'
  const domain = q.domain ?? q.domainId ?? 0
  const stem = q.question ?? q.stem ?? q.text ?? ''
  const options = q.options ?? q.choices ?? []
  const correctIds = new Set(q.correctOptionIds ?? q.correctIds ?? (Array.isArray(q.answer)?q.answer:[q.answer]) ?? [])
  if (domain>=1&&domain<=4) domainCounts[domain]++
  // stem
  if (STEM_PATS.some(p=>p.test(stem))) stemIssues.push({id,domain,stem:stem.slice(0,120)})
  // options
  for (const opt of options) {
    const text = opt.text ?? opt.label ?? ''
    const optId = opt.id ?? opt.key ?? ''
    const issues = checkOption(text)
    if (issues.length) styleViolations.push({qId:id,domain,optId,isCorrect:correctIds.has(optId),issues,text:text.slice(0,150)})
  }
  // distractors: duplicate prefix check
  const wrong = options.filter(o=>!correctIds.has(o.id??o.key??''))
  const pfx = wrong.map(o=>(o.text??o.label??'').slice(0,30).toLowerCase())
  if (new Set(pfx).size < pfx.length) distractorIssues.push({id,domain,issue:'DUPLICATE_DISTRACTORS'})
}

const total = all.length
const expected = {1:0.24,2:0.30,3:0.34,4:0.12}
const byQ = {}
for (const v of styleViolations) { if(!byQ[v.qId]) byQ[v.qId]=[]; byQ[v.qId].push(v) }
const qScores = {}
for (const v of styleViolations) qScores[v.qId]=(qScores[v.qId]??0)+(v.issues.includes('DEFINES_SERVICE')?3:1)
for (const s of stemIssues) qScores[s.id]=(qScores[s.id]??0)+2
for (const d of distractorIssues) qScores[d.id]=(qScores[d.id]??0)+2

const worst20 = Object.entries(qScores).sort(([,a],[,b])=>b-a).slice(0,20).map(([id,score])=>{
  const q=all.find(x=>(x.id??x.questionId)===id)
  return {id,score,domain:q?.domain,stem:(q?.question??q?.stem??'').slice(0,120),
    options:(q?.options??q?.choices??[]).map(o=>`  - [${o.id??o.key}] ${(o.text??o.label??'').slice(0,100)}`)}
})

const qsWithStyle = Object.keys(byQ).length
const defCount = styleViolations.filter(v=>v.issues.includes('DEFINES_SERVICE')).length
const longCount = styleViolations.filter(v=>v.issues.includes('TOO_LONG')).length
const overallScore = Math.max(0,100-Math.round((qsWithStyle/total)*40+(stemIssues.length/total)*30+(distractorIssues.length/total)*30))

const lines = []
lines.push(`# AWS CCP CLF-C02 Question Bank — Quality Audit Report\n`)
lines.push(`Generated: ${new Date().toLocaleString()} | Total questions: **${total}**\n`)
lines.push(`---\n`)
lines.push(`## 1. Summary\n`)
lines.push(`| Metric | Value |`)
lines.push(`|--------|-------|`)
lines.push(`| Total questions | **${total}** |`)
lines.push(`| Questions with style violations | **${qsWithStyle}** (${((qsWithStyle/total)*100).toFixed(1)}%) |`)
lines.push(`| "Defines service" violations (option texts) | **${defCount}** |`)
lines.push(`| "Too long" option violations | **${longCount}** |`)
lines.push(`| Textbook-style stems | **${stemIssues.length}** |`)
lines.push(`| Distractor issues | **${distractorIssues.length}** |`)
lines.push(`| **Overall Quality Score** | **${overallScore}/100** |`)
lines.push(``)
lines.push(overallScore>=80?'?? Good':overallScore>=60?'?? Fair — significant rewrite needed':'?? Poor — widespread violations, major rewrite required')
lines.push(`\n---\n`)

lines.push(`## 2. Coverage Analysis\n`)
lines.push(`| Domain | Name | Target% | Actual% | Count | Delta | Status |`)
lines.push(`|--------|------|---------|---------|-------|-------|--------|`)
const dNames={1:'Cloud Concepts',2:'Security & Compliance',3:'Cloud Technology & Services',4:'Billing, Pricing & Support'}
for (const [d,count] of Object.entries(domainCounts)) {
  const pct=(count/total*100).toFixed(1)
  const target=(expected[d]*100).toFixed(0)
  const delta=(parseFloat(pct)-expected[d]*100).toFixed(1)
  const flag=Math.abs(delta)>4?'??':'?'
  lines.push(`| D${d} | ${dNames[d]} | ${target}% | ${pct}% | ${count} | ${delta>0?'+':''}${delta}% | ${flag} |`)
}
lines.push(`\n---\n`)

lines.push(`## 3. Style Violations — Answer Options\n`)
lines.push(`**${defCount}** options define/explain the service. **${longCount}** are too long (>${WORD_LIMIT} words).\n`)
lines.push(`Showing first 100 violating questions:\n`)
for (const [qId,vs] of Object.entries(byQ).slice(0,100)) {
  const q=all.find(x=>(x.id??x.questionId)===qId)
  const stem=(q?.question??q?.stem??'').slice(0,100)
  lines.push(`**Q${qId}** (D${vs[0].domain}) — *${stem}...*`)
  for (const v of vs) {
    lines.push(`  - Option \`${v.optId}\`${v.isCorrect?' [CORRECT]':' [wrong]'}: **${v.issues.join(', ')}**`)
    lines.push(`    > "${v.text}"`)
  }
  lines.push('')
}
if (Object.keys(byQ).length>100) lines.push(`\n... and ${Object.keys(byQ).length-100} more questions with style violations.\n`)
lines.push(`---\n`)

lines.push(`## 4. Textbook-Style Stems (first 50)\n`)
for (const s of stemIssues.slice(0,50)) lines.push(`- **Q${s.id}** (D${s.domain}): *"${s.stem}..."*`)
lines.push(`\n---\n`)

lines.push(`## 5. Distractor Issues (first 30)\n`)
for (const d of distractorIssues.slice(0,30)) lines.push(`- **Q${d.id}** (D${d.domain}): ${d.issue}`)
lines.push(`\n---\n`)

lines.push(`## 6. Top 20 Worst Offenders\n`)
worst20.forEach(({id,score,domain,stem,options},i)=>{
  lines.push(`### ${i+1}. Q${id} — Severity Score: ${score} | D${domain}`)
  lines.push(`**Stem:** *${stem}...*`)
  lines.push(`**Options:**`)
  options.forEach(o=>lines.push(o))
  const vs=byQ[id]??[]
  if (vs.length) {
    lines.push(`**Rewrite suggestions:**`)
    for (const v of vs) {
      const stripped=(v.text??'')
        .replace(/,?\s*(which|that)\s+(is|are|allows|provides|enables|manages|controls|stores|runs|handles)[^,.;]*/gi,'')
        .replace(/\s*\([^)]*\)/g,'').replace(/\s+/g,' ').trim()
      lines.push(`  - Option \`${v.optId}\`: ? *"${stripped.slice(0,80)}"*`)
    }
  }
  lines.push('')
})
lines.push(`---\n`)

lines.push(`## 7. Recommendations\n`)
lines.push(`1. **Strip service definitions from all answer options** — "AWS IAM" not "AWS IAM, which is the Identity and Access Management service..."`)
lines.push(`2. **Rewrite textbook stems to scenario-based** — "A company needs to..." instead of "What is..."`)
lines.push(`3. **Ensure all distractors are plausible in-scope AWS services** from the blueprint`)
lines.push(`4. **Rebalance domain coverage** to match 24/30/34/12% blueprint weights (±3%)`)
lines.push(`5. **Remove any out-of-scope service references** from the blueprint outOfScopeServices list`)

writeFileSync(outPath, lines.join('\n'), 'utf8')
console.log(`Report written to: ${outPath}`)
console.log(`  Total: ${total} | Style violations: ${qsWithStyle} | Stems: ${stemIssues.length} | Distractors: ${distractorIssues.length} | Score: ${overallScore}/100`)
