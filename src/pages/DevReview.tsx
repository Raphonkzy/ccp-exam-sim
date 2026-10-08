import { useMemo, useState } from 'react'
import { useT } from '../i18n'
import type { DictKey } from '../i18n/en'
import { allQuestions } from '../lib/questionService'
import type { Question } from '../types/question'

type StatusFilter = 'all' | 'unverified' | 'verified' | 'needsReview'

interface ReviewNote {
  verified?: boolean
  needsReview?: boolean
  note?: string
}
const NOTES_KEY = 'clf02-dev-notes'
function loadNotes(): Record<string, ReviewNote> {
  try { return JSON.parse(localStorage.getItem(NOTES_KEY) ?? '{}') } catch { return {} }
}
function saveNotes(n: Record<string, ReviewNote>) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(n))
}

export default function DevReview() {
  const { t } = useT()
  const [notes, setNotes] = useState<Record<string, ReviewNote>>(loadNotes)
  const [domain, setDomain] = useState<number | 'all'>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const patchNote = (id: string, patch: Partial<ReviewNote>) => {
    setNotes((n) => {
      const updated = { ...n, [id]: { ...n[id], ...patch } }
      saveNotes(updated)
      return updated
    })
  }

  const results = useMemo<Question[]>(() => {
    const q = query.trim().toLowerCase()
    return allQuestions.filter((x) => {
      if (domain !== 'all' && x.domain !== domain) return false
      const n = notes[x.id]
      if (status === 'verified' && !n?.verified) return false
      if (status === 'unverified' && n?.verified) return false
      if (status === 'needsReview' && !n?.needsReview) return false
      if (q) return x.id.includes(q) || x.question.toLowerCase().includes(q) || x.tags.some((t) => t.includes(q))
      return true
    })
  }, [domain, status, query, notes])

  const toggle = (id: string) =>
    setExpanded((s) => {
      const n = new Set(s)
      if (n.has(id)) {
        n.delete(id)
      } else {
        n.add(id)
      }
      return n
    })

  const exportNotes = () => {
    const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `clf02-review-notes-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }

  const statusOpts: { value: StatusFilter; key: DictKey }[] = [
    { value: 'all', key: 'dev.statusAll' },
    { value: 'unverified', key: 'dev.statusUnverified' },
    { value: 'verified', key: 'dev.statusVerified' },
    { value: 'needsReview', key: 'dev.statusNeedsReview' },
  ]

  return (
    <div className="grid gap-6">
      <div className="fade-up flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="chip chip-warn mb-2">Development only</p>
          <h1 className="h1 text-[var(--color-forest-ink)]">{t('dev.title')}</h1>
          <p className="text-sm text-[var(--color-forest-ink)]/70 mt-1">{t('dev.subtitle')}</p>
        </div>
        <button type="button" className="btn-pill !py-1.5 !px-4 !text-xs" onClick={exportNotes}>{t('dev.exportNotes')}</button>
      </div>

      <div className="card grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label mb-1 block" htmlFor="dev-search">{t('dev.search')}</label>
          <input id="dev-search" type="search" className="field" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div>
          <label className="label mb-1 block" htmlFor="dev-domain">{t('dev.domain')}</label>
          <select id="dev-domain" className="field" value={domain} onChange={(e) => setDomain(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
            <option value="all">{t('browse.allDomains')}</option>
            {[1, 2, 3, 4].map((d) => <option key={d} value={d}>{t(`domain.${d}` as DictKey)}</option>)}
          </select>
        </div>
        <div>
          <label className="label mb-1 block" htmlFor="dev-status">{t('dev.status')}</label>
          <select id="dev-status" className="field" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
            {statusOpts.map((o) => <option key={o.value} value={o.value}>{t(o.key)}</option>)}
          </select>
        </div>
      </div>

      <p className="text-xs text-[#64748b]">{t('dev.count', { n: results.length })}</p>

      <ul className="grid gap-3 p-0 list-none">
        {results.map((q) => {
          const n = notes[q.id] ?? {}
          const isExp = expanded.has(q.id)
          return (
            <li key={q.id} className="card list-none">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap gap-2">
                    <span className="chip font-mono !text-[11px] font-bold text-[#2563eb] bg-[#eff6ff] border-[#bfdbfe]">{q.id}</span>
                    <span className="chip !text-[11px]">{t(`domain.short.${q.domain}` as DictKey)}</span>
                    {n.verified && <span className="chip chip-good !text-[11px]">{t('dev.verified')}</span>}
                    {n.needsReview && <span className="chip chip-bad !text-[11px]">{t('dev.needsReview')}</span>}
                  </div>
                  <p className="line-clamp-2 text-sm font-medium leading-snug text-[#0f172a]">{q.question}</p>
                </div>
                <button type="button" className="btn btn-sm !rounded-full flex-none text-xs font-semibold" onClick={() => toggle(q.id)}>
                  {isExp ? t('browse.hide') : t('browse.show')}
                </button>
              </div>

              {isExp && (
                <div className="mt-4 grid gap-3 border-t pt-4 border-[#e2e8f0]">
                  <div>
                    <p className="label mb-1">{t('dev.answerKey')}</p>
                    <p className="font-mono text-sm font-bold text-[#2563eb]">{q.correctOptionIds.join(', ')}</p>
                  </div>

                  {q.sourceUrl && (
                    <div>
                      <p className="label mb-1">{t('dev.sourceUrl')}</p>
                      <a href={q.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-sm underline text-[#2563eb]">
                        {q.sourceUrl}
                      </a>
                    </div>
                  )}

                  <div>
                    <p className="label mb-2">{t('dev.english')}</p>
                    <p className="rounded-lg p-3 text-sm text-[#0f172a] bg-[#f8fafc] border border-[#e2e8f0]">{q.question}</p>
                    {q.options.map((o) => (
                      <p key={o.id} className="mt-1 text-sm text-[#334155]"><span className="font-bold text-[#0f172a]">{o.id}.</span> {o.text}</p>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 border-[#e2e8f0]">
                      <input type="checkbox" className="h-4 w-4 accent-[#059669]" checked={!!n.verified} onChange={(e) => patchNote(q.id, { verified: e.target.checked })} />
                      <span className="text-xs font-semibold">{t('dev.verified')}</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 border-[#e2e8f0]">
                      <input type="checkbox" className="h-4 w-4 accent-[#ef4444]" checked={!!n.needsReview} onChange={(e) => patchNote(q.id, { needsReview: e.target.checked })} />
                      <span className="text-xs font-semibold">{t('dev.needsReview')}</span>
                    </label>
                  </div>
                  <div>
                    <label className="label mb-1 block" htmlFor={`note-${q.id}`}>{t('dev.note')}</label>
                    <textarea
                      id={`note-${q.id}`}
                      rows={2}
                      className="field"
                      value={n.note ?? ''}
                      onChange={(e) => patchNote(q.id, { note: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
