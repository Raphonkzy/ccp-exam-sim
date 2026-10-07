import { blueprint, readJson } from './lib/common.ts';

const bp = blueprint();
const questions = [
  ...readJson<any[]>('./src/data/questions/d1.json'),
  ...readJson<any[]>('./src/data/questions/d2.json'),
  ...readJson<any[]>('./src/data/questions/d3.json'),
  ...readJson<any[]>('./src/data/questions/d4.json'),
];

console.log(`=== CCP AUDIT REPORT (${questions.length} questions) ===`);

// 1. Check out-of-scope services
const outOfScopeList = Object.values(bp.outOfScopeServices ?? {}).flat();
const oosDistractors: string[] = [];
const oosCorrect: string[] = [];

for (const q of questions) {
  for (const oos of outOfScopeList) {
    const isCorrect = q.options
      .filter((o: any) => q.correctOptionIds.includes(o.id))
      .some((o: any) => o.text.includes(oos));
    const isDistractor = q.options
      .filter((o: any) => !q.correctOptionIds.includes(o.id))
      .some((o: any) => o.text.includes(oos));

    if (isCorrect) oosCorrect.push(`${q.id}: ${oos}`);
    if (isDistractor) oosDistractors.push(`${q.id}: ${oos}`);
  }
}

console.log(`- Out-of-scope services as correct answer: ${oosCorrect.length}`);
if (oosCorrect.length > 0) console.log('  ', oosCorrect);
console.log(`- Out-of-scope services used as distractors: ${oosDistractors.length}`);
if (oosDistractors.length > 0) console.log('  ', oosDistractors);

// 2. Question length statistics (real CCP questions are concise scenarios: 100-300 chars)
const lengths = questions.map((q) => q.question.length);
const avgLen = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
const minLen = Math.min(...lengths);
const maxLen = Math.max(...lengths);
console.log(`- Question lengths: Min ${minLen} chars, Avg ${avgLen} chars, Max ${maxLen} chars`);

// 3. Scenario-based vs direct definition questions
const scenarioKeywords = [
  'A company',
  'An organization',
  'A startup',
  'A developer',
  'A solutions architect',
  'A business',
  'A cloud practitioner',
  'An enterprise',
  'A team',
  'Under the',
  'According to',
  'Which of the following',
  'Which AWS service',
];
let scenarioCount = 0;
for (const q of questions) {
  if (scenarioKeywords.some((kw) => q.question.startsWith(kw))) {
    scenarioCount++;
  }
}
console.log(`- Standard CCP phrasing match: ${scenarioCount} / ${questions.length} (${Math.round((scenarioCount / questions.length) * 100)}%)`);

// 4. Multiple response check (CLF-C02 format: "Which TWO...", "Select TWO...")
const multiQuestions = questions.filter((q) => q.type === 'multiple');
const multiPhrasingValid = multiQuestions.filter((q) =>
  /TWO|THREE|2|3/i.test(q.question)
).length;
console.log(`- Multiple-response questions: ${multiQuestions.length} total, ${multiPhrasingValid} clearly specify count in question`);

// 5. Explanations completeness
const missingExp = questions.filter(
  (q) => !q.explanation || Object.keys(q.optionExplanations).length !== q.options.length
);
console.log(`- Complete explanation & option breakdown: ${questions.length - missingExp.length} / ${questions.length}`);

// 6. Source URL validity
const validUrls = questions.filter(
  (q) => q.sourceUrl && q.sourceUrl.startsWith('https://') && q.sourceUrl.includes('aws.')
);
console.log(`- Official AWS documentation citations: ${validUrls.length} / ${questions.length}`);
