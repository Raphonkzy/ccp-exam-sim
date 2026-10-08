const fs = require("fs");
const path = require("path");

const DATA_DIR = path.resolve("src/data/questions");
const OUT_FILE = "C:/Users/Raph/.gemini/antigravity-ide/brain/171f3206-526f-4181-a953-eacba081c1cc/question_audit.md";
const DOMAIN_TARGETS = { 1: 132, 2: 165, 3: 187, 4: 66 };
const DOMAIN_NAMES = { 1: "Cloud Concepts (24%)", 2: "Security and Compliance (30%)", 3: "Cloud Technology and Services (34%)", 4: "Billing, Pricing, and Support (12%)" };
const BP = { 1: 24, 2: 30, 3: 34, 4: 12 };

const DEF_PATS = [
  /which is (the|a|an)\s/i,
  /that (allows|enables|provides|lets|helps|manages|stores|monitors|analyzes|detects|controls|handles|offers|gives)\s/i,
  /,\s+which\s/i,
  /is a service that/i,
  /is an aws service/i,
  /\(a managed service\)/i,
  /\(free tier/i
];
const STEM_PATS = [
  /which of the following (best )?describes/i,
  /what is (the definition|the meaning|meant by)/i,
  /which statement is (true|false|correct|incorrect) about/i,
  /what (does|is|are) [A-Z]+ (stand for|stands for)/i
];
const FAKE_PATS = [
  /aws (data.?vault|cloudkeeper|securesync|autoguard|servermonitor|cloudguard)/i,
  /azure|google cloud|gcp\b/i
];
const TRIVIAL = ["invalid", "not supported", "does not exist", "no such", "deprecated"];

const all = [];
for (const f of ["d1.json","d2.json","d3.json","d4.json"]) {
  const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), "utf8"));
  const arr = Array.isArray(raw) ? raw : (raw.questions || []);
  all.push(...arr);
}
console.log("Loaded " + all.length + " questions");

const sv = [], di = [], sev = new Map();
function addSev(q, pts, r) {
  const e = sev.get(q.id) || { q, score: 0, reasons: [] };
  e.score += pts; e.reasons.push(r); sev.set(q.id, e);
}

for (const q of all) {
  const wrong = q.options.filter(o => !q.correctOptionIds.includes(o.id));
  const correct = q.options.filter(o => q.correctOptionIds.includes(o.id));

  for (const o of q.options) {
    const txt = o.text.trim();
    const wc = txt.split(/\s+/).length;
    if (wc > 20) {
      sv.push({ qid: q.id, domain: q.domain, issue: "Option " + o.id + " is " + wc + " words (>20)", text: txt.slice(0, 100) });
      addSev(q, 2, "Option " + o.id + " too long (" + wc + "w)");
    }
    for (const p of DEF_PATS) {
      if (p.test(txt)) {
        sv.push({ qid: q.id, domain: q.domain, issue: "Option " + o.id + " defines/explains the service", text: txt.slice(0, 100) });
        addSev(q, 3, "Option " + o.id + " has definition pattern");
        break;
      }
    }
  }

  for (const p of STEM_PATS) {
    if (p.test(q.question)) {
      sv.push({ qid: q.id, domain: q.domain, issue: "Textbook/definition stem phrasing", text: q.question.slice(0, 120) });
      addSev(q, 4, "Textbook stem");
      break;
    }
  }
  const stemWc = q.question.split(/\s+/).length;
  if (stemWc < 10) {
    sv.push({ qid: q.id, domain: q.domain, issue: "Stem too short (" + stemWc + " words)", text: q.question });
    addSev(q, 3, "Short stem");
  }

  for (const o of wrong) {
    for (const p of FAKE_PATS) {
      if (p.test(o.text)) {
        di.push({ qid: q.id, domain: q.domain, issue: "Fake/non-AWS service in distractor", offending: [o.text] });
        addSev(q, 5, "Fake service in " + o.id);
        break;
      }
    }
  }

  if (q.options.length < 4) {
    di.push({ qid: q.id, domain: q.domain, issue: "Only " + q.options.length + " options (need >=4)", offending: [] });
    addSev(q, 10, "Too few options");
  }

  if (correct.length === 1 && wrong.length >= 2) {
    const bad = wrong.filter(o => TRIVIAL.some(m => o.text.toLowerCase().includes(m)));
    if (bad.length > 0) {
      di.push({ qid: q.id, domain: q.domain, issue: "Wrong options say 'invalid/not supported' -- obviously wrong", offending: bad.map(o => o.text.slice(0, 80)) });
      addSev(q, 4, "Trivially obvious distractors");
    }
  }
}

const dc = { 1: 0, 2: 0, 3: 0, 4: 0 };
for (const q of all) { dc[q.domain] = (dc[q.domain] || 0) + 1; }
const total = all.length;
const worst = [...sev.values()].sort((a, b) => b.score - a.score).slice(0, 20);

const L = [];
L.push("# AWS CCP Question Bank Audit Report");
L.push("Generated: " + new Date().toISOString() + " | Total: **" + total + "** questions");
L.push("");
L.push("## 1. Summary");
L.push("| Metric | Value |"); L.push("|--------|-------|");
L.push("| Total questions | " + total + " |");
L.push("| Qs with style violations | " + new Set(sv.map(v => v.qid)).size + " |");
L.push("| Qs with distractor issues | " + new Set(di.map(v => v.qid)).size + " |");
L.push("| Total style violation instances | " + sv.length + " |");
L.push("| Total distractor issue instances | " + di.length + " |");
L.push("");
L.push("### Domain Distribution vs Blueprint");
L.push("| Domain | Target | Actual | Actual% | Blueprint% | Status |");
L.push("|--------|--------|--------|---------|------------|--------|");
for (const d of [1,2,3,4]) {
  const a = dc[d] || 0, t = DOMAIN_TARGETS[d], pct = Math.round(a / total * 100), b = BP[d];
  const st = Math.abs(pct - b) <= 3 ? "OK" : pct > b ? "OVER" : "UNDER";
  L.push("| D" + d + ": " + DOMAIN_NAMES[d] + " | " + t + " | " + a + " | " + pct + "% | " + b + "% | " + st + " |");
}
L.push("");
L.push("## 2. Style Violations");
L.push("");
const byType = {};
for (const v of sv) {
  const k = v.issue;
  byType[k] = byType[k] || [];
  byType[k].push(v);
}
const sortedTypes = Object.entries(byType).sort((a, b) => b[1].length - a[1].length);
for (const [type, items] of sortedTypes) {
  L.push("### " + type + " -- " + items.length + " instances");
  for (const v of items.slice(0, 25)) {
    L.push("- **[" + v.qid + "]** D" + v.domain + " -- " + v.text.replace(/\|/g, "/"));
  }
  if (items.length > 25) L.push("*(+" + (items.length - 25) + " more)*");
  L.push("");
}
L.push("## 3. Distractor Issues");
L.push("");
for (const v of di.slice(0, 100)) {
  L.push("- **[" + v.qid + "]** D" + v.domain + " -- " + v.issue);
  for (const o of v.offending) { L.push('  - "' + o.replace(/"/g,"'") + '"'); }
}
if (di.length > 100) L.push("*(+" + (di.length - 100) + " more)*");
L.push("");
L.push("## 4. Coverage Analysis");
L.push("");
L.push("| | D1 | D2 | D3 | D4 |");
L.push("|-|----|----|----|-----|");
L.push("| Blueprint % | 24% | 30% | 34% | 12% |");
L.push("| Actual % | " + Math.round(dc[1]/total*100) + "% | " + Math.round(dc[2]/total*100) + "% | " + Math.round(dc[3]/total*100) + "% | " + Math.round(dc[4]/total*100) + "% |");
L.push("| Target count | 132 | 165 | 187 | 66 |");
L.push("| Actual count | " + dc[1] + " | " + dc[2] + " | " + dc[3] + " | " + dc[4] + " |");
L.push("| Gap | " + (132-dc[1]) + " | " + (165-dc[2]) + " | " + (187-dc[3]) + " | " + (66-dc[4]) + " |");
L.push("");
L.push("Target total: 550 | Actual: " + total + " | Overall gap: " + (550 - total));
L.push("");
L.push("## 5. Top 20 Worst Offenders");
L.push("");
for (let i = 0; i < worst.length; i++) {
  const { q, score, reasons } = worst[i];
  L.push("### #" + (i+1) + " -- [" + q.id + "] D" + q.domain + " -- Severity: " + score);
  L.push("");
  L.push("**Issues:** " + reasons.join(" | "));
  L.push("");
  L.push("**Stem:** " + q.question);
  L.push("");
  L.push("**Options:**");
  for (const o of q.options) {
    const c = q.correctOptionIds.includes(o.id);
    L.push("- " + (c ? "[CORRECT]" : "[WRONG]  ") + " " + o.id + ": " + o.text);
  }
  L.push("");
  L.push("**Fix:** Shorten all options to max 12 words. Remove any text that defines/explains the service. Make all wrong options plausible AWS services that could answer this question.");
  L.push("");
  L.push("---");
  L.push("");
}

fs.writeFileSync(OUT_FILE, L.join("\n"), "utf8");
console.log("Report written: " + OUT_FILE);
console.log("Style violations: " + sv.length + " in " + new Set(sv.map(v => v.qid)).size + " questions");
console.log("Distractor issues: " + di.length + " in " + new Set(di.map(v => v.qid)).size + " questions");

