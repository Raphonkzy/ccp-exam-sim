import type { Lang, Question, TranslationEntry } from '../types/question'

const qModules = import.meta.glob('../data/questions/*.json', { eager: true, import: 'default' }) as Record<string, Question[]>

export const allQuestions: Question[] = Object.keys(qModules)
  .sort()
  .flatMap((k) => qModules[k])

const byId = new Map(allQuestions.map((q) => [q.id, q]))

export const getQuestion = (id: string): Question | undefined => byId.get(id)
export const getTranslation = (_id: string, _lang?: Lang): TranslationEntry | undefined => undefined

export interface LocalizedQuestion {
  question: string
  options: { id: string; text: string; english: string }[]
  explanation: string
  optionExplanations: Record<string, string>
  keyConcept: string
  translated: boolean
  missingTranslation: boolean
  english: {
    question: string
    explanation: string
    optionExplanations: Record<string, string>
    keyConcept: string
  }
}

export function localize(q: Question, _lang?: Lang): LocalizedQuestion {
  const english = {
    question: q.question,
    explanation: q.explanation,
    optionExplanations: q.optionExplanations,
    keyConcept: q.keyConcept,
  }
  return {
    question: q.question,
    options: q.options.map((o) => ({ id: o.id, text: o.text, english: o.text })),
    explanation: q.explanation,
    optionExplanations: q.optionExplanations,
    keyConcept: q.keyConcept,
    translated: false,
    missingTranslation: false,
    english,
  }
}

export const allTags: string[] = Array.from(new Set(allQuestions.flatMap((q) => q.tags))).sort((a, b) => a.localeCompare(b))
