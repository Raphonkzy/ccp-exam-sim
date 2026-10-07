import { useCallback } from 'react'
import { en, type DictKey } from './en'

export type TFunction = (key: DictKey, params?: Record<string, string | number>) => string

export function translate(key: DictKey, params?: Record<string, string | number>): string
export function translate(lang: string, key: DictKey, params?: Record<string, string | number>): string
export function translate(a: string, b?: any, c?: any): string {
  const key: DictKey = (typeof b === 'string' ? b : a) as DictKey
  const params: Record<string, string | number> | undefined = typeof b === 'string' ? c : b
  const raw: string = en[key] ?? key
  if (!params) return raw
  return raw.replace(/\{(\w+)\}/g, (_, k: string) => (k in params ? String(params[k]) : `{${k}}`))
}

export function useT(): { t: TFunction; lang: 'en' } {
  const t = useCallback<TFunction>((key, params) => translate(key, params), [])
  return { t, lang: 'en' }
}
