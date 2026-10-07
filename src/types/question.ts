import { z } from 'zod'

export const optionSchema = z.object({
  id: z.string().regex(/^[A-F]$/),
  text: z.string().min(1),
})

export const questionSchema = z
  .object({
    id: z.string().regex(/^d[1-4]-\d{4}$/),
    domain: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    taskStatement: z.string().regex(/^[1-4]\.\d$/),
    type: z.enum(['single', 'multiple']),
    question: z.string().min(10),
    options: z.array(optionSchema).min(4).max(6),
    correctOptionIds: z.array(z.string()).min(1),
    explanation: z.string().min(10),
    optionExplanations: z.record(z.string(), z.string().min(3)),
    keyConcept: z.string().min(5),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    tags: z.array(z.string()).min(1),
    sourceUrl: z.string().url(),
    verified: z.boolean(),
    needsReview: z.boolean(),
    createdBatch: z.string().min(1),
  })
  .strict()

export type Question = z.infer<typeof questionSchema>
export type Option = z.infer<typeof optionSchema>

export const translationEntrySchema = z
  .object({
    question: z.string().min(1),
    options: z.record(z.string(), z.string().min(1)),
    explanation: z.string().min(1),
    optionExplanations: z.record(z.string(), z.string().min(1)),
    keyConcept: z.string().min(1),
    translatedFromVersion: z.string().min(1),
  })
  .strict()

export type TranslationEntry = z.infer<typeof translationEntrySchema>
export type TranslationFile = Record<string, TranslationEntry>

export type Lang = 'en'
export type DomainId = 1 | 2 | 3 | 4
