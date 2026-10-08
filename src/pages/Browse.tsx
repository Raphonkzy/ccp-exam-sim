import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useT } from '../i18n'
import type { DictKey } from '../i18n/en'
import { allQuestions, allTags } from '../lib/questionService'
import { ReviewItem } from '../components/ReviewItem'
import type { Question } from '../types/question'

export default function Browse() {
  const { t } = useT()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlQ = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(urlQ)
  const [domain, setDomain] = useState<number | 'all'>('all')
  const [tag, setTag] = useState<string | 'all'>('all')
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())

  const [prevUrlQ, setPrevUrlQ] = useState(urlQ)
  if (urlQ !== prevUrlQ) {
    setPrevUrlQ(urlQ)
    setQuery(urlQ)
  }

  const handleQueryChange = (val: string) => {
    setQuery(val)
    if (val.trim()) {
      setSearchParams({ q: val.trim() }, { replace: true })
    } else {
      setSearchParams({}, { replace: true })
    }
  }

  const results = useMemo<Question[]>(() => {
    const q = query.trim().toLowerCase()
    return allQuestions.filter((x) => {
      if (domain !== 'all' && x.domain !== domain) return false
      if (tag !== 'all' && !x.tags.includes(tag)) return false
      if (!q) return true
      return (
        x.question.toLowerCase().includes(q) ||
        x.tags.some((t) => t.toLowerCase().includes(q)) ||
        x.id.toLowerCase().includes(q) ||
        x.options.some((o) => o.text.toLowerCase().includes(q))
      )
    })
  }, [query, domain, tag])

  const toggle = (id: string) =>
    setOpenIds((s) => {
      const n = new Set(s)
      if (n.has(id)) {
        n.delete(id)
      } else {
        n.add(id)
      }
      return n
    })

  return (
    <div className="grid gap-6">
      <div className="fade-up">
        <h1 className="h1 text-[var(--color-forest-ink)]">{t('browse.title')}</h1>
        <p className="text-sm text-[var(--color-forest-ink)]/70 mt-1">{t('browse.subtitle')}</p>
      </div>

      <div className="card grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label mb-1.5 block text-xs uppercase tracking-wider text-[var(--color-forest-ink)]/70" htmlFor="q-search">
            {t('common.search')}
          </label>
          <input
            id="q-search"
            type="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="field"
            placeholder={t('browse.searchPlaceholder')}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
          />
        </div>
        <div>
          <label className="label mb-1.5 block text-xs uppercase tracking-wider text-[var(--color-forest-ink)]/70" htmlFor="q-domain">
            {t('browse.domain')}
          </label>
          <select
            id="q-domain"
            className="field"
            value={domain}
            onChange={(e) => setDomain(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          >
            <option value="all">{t('browse.allDomains')}</option>
            {[1, 2, 3, 4].map((d) => (
              <option key={d} value={d}>
                {t(`domain.${d}` as DictKey)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label mb-1.5 block text-xs uppercase tracking-wider text-[var(--color-forest-ink)]/70" htmlFor="q-tag">
            {t('browse.tag')}
          </label>
          <select id="q-tag" className="field" value={tag} onChange={(e) => setTag(e.target.value)}>
            <option value="all">{t('browse.allTags')}</option>
            {allTags.map((tg) => (
              <option key={tg} value={tg}>
                {tg}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--color-forest-ink)]/70 font-mono" role="status">
        <span>{results.length === 0 ? t('browse.noResults') : t('browse.results', { n: results.length })}</span>
        {query && (
          <button
            type="button"
            onClick={() => handleQueryChange('')}
            className="font-semibold text-[var(--color-forest-ink)] underline hover:no-underline"
          >
            Clear search
          </button>
        )}
      </div>

      {results.length > 0 && (
        <ul className="grid gap-3.5 p-0 list-none">
          {results.map((q) => (
            <li key={q.id} className="card card-hover list-none !p-4.5 sm:!p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="chip chip-primary !text-[11px] font-bold">
                      {q.id}
                    </span>
                    <span className="chip !text-[11px]">{t(`domain.short.${q.domain}` as DictKey)}</span>
                    <span className="chip !text-[11px]">{t(`difficulty.${q.difficulty}` as DictKey)}</span>
                    <span className="chip !text-[11px] !bg-transparent text-[var(--color-forest-ink)]/60">
                      {q.tags.slice(0, 2).join(' · ')}
                    </span>
                  </div>
                  <p className="font-semibold leading-relaxed text-[var(--color-forest-ink)] text-sm sm:text-base">
                    {q.question}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-sm flex-none text-xs font-semibold"
                  aria-expanded={openIds.has(q.id)}
                  aria-controls={`bq-${q.id}`}
                  onClick={() => toggle(q.id)}
                >
                  {openIds.has(q.id) ? t('browse.hide') : t('browse.show')}
                </button>
              </div>
              {openIds.has(q.id) && (
                <div id={`bq-${q.id}`} className="mt-4 pt-4 border-t border-[var(--color-pencil-gray)]/40">
                  <ReviewItem
                    question={q}
                    selected={q.correctOptionIds}
                    showLabel={t('browse.show')}
                    hideLabel={t('browse.hide')}
                    defaultOpen
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
