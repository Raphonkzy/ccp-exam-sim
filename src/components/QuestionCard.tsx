import { useEffect, useMemo } from 'react'
import { useT } from '../i18n'
import { localize } from '../lib/questionService'
import type { Question } from '../types/question'
import type { DictKey } from '../i18n/en'

interface Props {
  question: Question
  selected: string[]
  onChange?: (ids: string[]) => void
  /** Review mode: options are locked and coloured by correctness */
  reveal?: boolean
  index?: number
  total?: number
  /** Enables 1-5 / A-E keyboard shortcuts */
  keyboard?: boolean
}

export function QuestionCard({ question: q, selected, onChange, reveal = false, index, total, keyboard = true }: Props) {
  const { t } = useT()
  const loc = useMemo(() => localize(q), [q])
  const multiple = q.type === 'multiple'
  const need = q.correctOptionIds.length

  const toggle = (id: string) => {
    if (reveal || !onChange) return
    if (!multiple) return onChange([id])
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])
  }

  useEffect(() => {
    if (!keyboard || reveal || !onChange) return
    const handler = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const k = e.key.toUpperCase()
      const byDigit = /^[1-9]$/.test(k) ? q.options[Number(k) - 1] : undefined
      const byLetter = q.options.find((o) => o.id === k)
      const opt = byDigit ?? byLetter
      if (opt) { e.preventDefault(); toggle(opt.id) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  const typeKey: DictKey = multiple ? 'type.multiple' : 'type.single'

  return (
    <section aria-labelledby={`q-${q.id}`} className="card fade-up">
      <div className="mb-3.5 flex flex-wrap items-center gap-2">
        {index !== undefined && total !== undefined && (
          <span className="chip chip-primary !text-[11px] font-bold">
            {t('question.number', { i: index, n: total })}
          </span>
        )}
        <span className="chip !text-[11px] font-semibold">{t(`domain.short.${q.domain}` as DictKey)}</span>
        <span className="chip !text-[11px] font-semibold">{t(`difficulty.${q.difficulty}` as DictKey)}</span>
      </div>

      <h2 id={`q-${q.id}`} className="text-base sm:text-lg font-semibold leading-relaxed text-[var(--color-forest-ink)]">
        {loc.question}
      </h2>

      <p className="mt-3.5 text-xs font-semibold text-[var(--color-forest-ink)]/70 font-mono" id={`hint-${q.id}`}>
        {t(typeKey, { n: need })}
        {!reveal && onChange ? ` · ${t('question.selectHint')}` : ''}
      </p>

      <div
        role={multiple ? 'group' : 'radiogroup'}
        aria-labelledby={`q-${q.id}`}
        aria-describedby={`hint-${q.id}`}
        className="mt-3.5 grid gap-2.5"
      >
        {loc.options.map((o) => {
          const isSel = selected.includes(o.id)
          const isRight = q.correctOptionIds.includes(o.id)
          const cls = reveal ? (isRight ? 'is-correct' : isSel ? 'is-wrong' : '') : ''
          return (
            <button
              key={o.id}
              type="button"
              role={multiple ? 'checkbox' : 'radio'}
              aria-checked={isSel}
              disabled={reveal}
              onClick={() => toggle(o.id)}
              className={`option ${cls}`}
            >
              <span className="letter" aria-hidden="true">{o.id}</span>
              <span className="min-w-0 flex-1">
                <span className="block leading-snug text-sm sm:text-base font-normal">{o.text}</span>
                {reveal && (isRight || isSel) && (
                  <span className="mt-1.5 block text-xs font-bold uppercase tracking-wider">
                    {isRight ? t('review.optionRight') : t('review.optionWrong')}
                    {isSel ? ` · ${t('review.yourPick')}` : ''}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
