import { readFileSync, existsSync } from 'node:fs'

export const ROOT = process.cwd()

export function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

export function loadJsonIfExists<T>(path: string, fallback: T): T {
  return existsSync(path) ? readJson<T>(path) : fallback
}

export interface Blueprint {
  domains: {
    id: number
    name: string
    weight: number
    taskStatements: { id: string; title: string }[]
  }[]
  targets: {
    totalQuestions: number
    perDomain: Record<string, number>
    typeSplit: { single: number; multiple: number }
    difficultySplit: { easy: number; medium: number; hard: number }
  }
  inScopeServices?: Record<string, string[]>
  outOfScopeServices?: Record<string, string[]>
}

export const blueprint = (): Blueprint => readJson<Blueprint>(`${ROOT}/src/data/blueprint.json`)
