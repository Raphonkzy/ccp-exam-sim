import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useT } from '../i18n'
import type { DictKey } from '../i18n/en'
import { allQuestions } from '../lib/questionService'
import { shuffle } from '../lib/examBuilder'
import { DOMAINS } from '../lib/scoring'
import { latestWrongIds } from '../lib/stats'

const COUNTS = [5, 10, 20, 40]

export default function PracticeSetup() {
  const { t } = useT()
  const { data } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const preset = (location.state as { domain?: number } | null)?.domain
  const [domains, setDomains] = useState<number[]>(preset ? [preset] : [...DOMAINS])
  const [count, setCount] = useState<number>(10)
  const [unanswered, setUnanswered] = useState(false)
  const [wrongOnly, setWrongOnly] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)

  const pool = useMemo(() => {
    const wrong = new Set(latestWrongIds(data))
    return allQuestions.filter((q) => {
      if (!domains.includes(q.domain)) return false
      if (unanswered && (data.answers[q.id]?.length ?? 0) > 0) return false
      if (wrongOnly && !wrong.has(q.id)) return false
      if (bookmarked && !data.bookmarks.includes(q.id)) return false
      return true
    })
  }, [domains, unanswered, wrongOnly, bookmarked, data])

  const toggleDomain = (d: number) => setDomains((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]))

  const start = () => {
    const take = count === 0 ? pool.length : Math.min(count, pool.length)
    const ids = shuffle(pool).slice(0, take).map((q) => q.id)
    navigate('/practice/run', { state: { ids } })
  }

  const check = (id: string, label: string, v: boolean, set: (b: boolean) => void) => (
    <label
      key={id}
      className={`flex cursor-pointer items-center gap-3 rounded-[6px] border p-3 transition-colors ${
        v ? 'border-[var(--color-forest-ink)] bg-[var(--surface-highlight)]/20' : 'border-[var(--color-pencil-gray)]/60 bg-[var(--surface)] hover:bg-[var(--surface-2)]'
      }`}
    >
      <input type="checkbox" className="h-4.5 w-4.5 accent-[var(--color-forest-ink)]" checked={v} onChange={(e) => set(e.target.checked)} />
      <span className="text-sm font-semibold text-[var(--color-forest-ink)]">{label}</span>
    </label>
  )

  return (
    <div className="grid gap-6">
      <div className="fade-up">
        <h1 className="h1 text-[var(--color-forest-ink)]">{t('practice.title')}</h1>
        <p className="text-sm text-[var(--color-forest-ink)]/70 mt-1">{t('practice.subtitle')}</p>
      </div>

      <fieldset className="card">
        <legend className="h2 mb-3 px-1 text-[var(--color-forest-ink)]">{t('practice.domains')}</legend>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {DOMAINS.map((d) => check(`d${d}`, t(`domain.${d}` as DictKey), domains.includes(d), () => toggleDomain(d)))}
        </div>
      </fieldset>

      <fieldset className="card">
        <legend className="h2 mb-3 px-1 text-[var(--color-forest-ink)]">{t('practice.count')}</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('practice.count')}>
          {[...COUNTS, 0].map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={count === c}
              onClick={() => setCount(c)}
              className={`btn !px-4 text-xs font-semibold ${
                count === c ? 'btn-primary' : ''
              }`}
            >
              {c === 0 ? t('practice.countAll') : c}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="card">
        <legend className="h2 mb-3 px-1 text-[var(--color-forest-ink)]">{t('practice.filters')}</legend>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {check('f1', t('practice.filterUnanswered'), unanswered, setUnanswered)}
          {check('f2', t('practice.filterWrong'), wrongOnly, setWrongOnly)}
          {check('f3', t('practice.filterBookmarked'), bookmarked, setBookmarked)}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <button type="button" className="btn-primary inline-flex items-center gap-1.5" disabled={pool.length === 0} onClick={start}>
          <span>{t('practice.start')}</span>
          <span className="font-mono">→</span>
        </button>
        <p className="text-xs text-[var(--color-forest-ink)]/70 font-mono" role="status">
          {pool.length === 0 ? t('practice.noMatch') : t('practice.available', { n: pool.length })}
        </p>
      </div>
    </div>
  )
}
