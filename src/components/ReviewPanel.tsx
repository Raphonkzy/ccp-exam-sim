import { useApp } from '../context/AppContext'
import { useT } from '../i18n'
import { isCorrect } from '../lib/scoring'
import type { Question } from '../types/question'

interface Props {
  question: Question
  selected: string[]
}

function Pill({ ok, children }: { ok: boolean; children: string }) {
  return <span className={`chip ${ok ? 'chip-good' : 'chip-bad'}`}>{children}</span>
}

export function ReviewPanel({ question: q, selected }: Props) {
  const { t } = useT()
  const { data, toggleBookmark, toggleConfusing } = useApp()
  const answered = selected.length > 0
  const correct = answered && isCorrect(q, selected)
  const bookmarked = data.bookmarks.includes(q.id)
  const confusing = data.confusing.includes(q.id)

  return (
    <section className="card fade-up mt-4" aria-label={t('review.explanation')}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Pill ok={correct}>{!answered ? t('review.notAnswered') : correct ? t('review.correct') : t('review.incorrect')}</Pill>
        <span className="muted text-sm">
          {t('review.correctAnswer')}: <strong>{q.correctOptionIds.join(', ')}</strong>
          {answered && <> · {t('review.yourAnswer')}: <strong>{[...selected].sort().join(', ')}</strong></>}
        </span>
      </div>

      <h3 className="h2 mb-1">{t('review.explanation')}</h3>
      <p className="leading-relaxed">{q.explanation}</p>

      <h3 className="h2 mb-2 mt-5">{t('review.whyEach')}</h3>
      <ul className="grid gap-2">
        {q.options.map((o) => {
          const right = q.correctOptionIds.includes(o.id)
          return (
            <li
              key={o.id}
              className="rounded-lg border p-3 text-sm leading-relaxed"
              style={{
                background: right ? 'var(--good-bg)' : 'var(--surface-2)',
                borderColor: right ? 'var(--good-border)' : 'var(--border)',
              }}
            >
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <span className="letter" aria-hidden="true">{o.id}</span>
                <span className="text-[var(--color-forest-ink)]">{o.text}</span>
                <span className={`chip !text-[11px] ml-auto ${right ? 'chip-good' : 'chip-bad'}`}>
                  {right ? t('review.optionRight') : t('review.optionWrong')}
                </span>
              </div>
              <p className="text-[var(--color-forest-ink)]/80 mt-1">{q.optionExplanations[o.id]}</p>
            </li>
          )
        })}
      </ul>

      <div className="mt-5 rounded-lg border border-[var(--color-highlighter-yellow)] p-4 bg-[var(--surface-highlight)]/30">
        <div className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-forest-ink)]">{t('review.keyConcept')}</div>
        <p className="mt-1 font-semibold text-sm leading-relaxed text-[var(--color-forest-ink)]">{q.keyConcept}</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <a className="btn btn-sm inline-flex items-center gap-1.5" href={q.sourceUrl} target="_blank" rel="noopener noreferrer">
          <span>{t('review.source')}</span>
          <svg className="h-3.5 w-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
        <button type="button" className="btn btn-sm inline-flex items-center gap-1.5" aria-pressed={bookmarked} onClick={() => toggleBookmark(q.id)}>
          {bookmarked ? (
            <>
              <svg className="h-3.5 w-3.5 fill-[var(--color-terracotta)] text-[var(--color-terracotta)]" viewBox="0 0 20 20">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
              <span>{t('review.bookmarked')}</span>
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5 text-[var(--color-forest-ink)]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span>{t('review.bookmark')}</span>
            </>
          )}
        </button>
        <button type="button" className="btn btn-sm inline-flex items-center gap-1.5" aria-pressed={confusing} onClick={() => toggleConfusing(q.id)}>
          {confusing ? (
            <>
              <svg className="h-3.5 w-3.5 fill-[#dc2626] text-[#dc2626]" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{t('review.markedConfusing')}</span>
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5 text-[var(--color-forest-ink)]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{t('review.confusing')}</span>
            </>
          )}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5" aria-label={t('review.tags')}>
        {q.tags.map((tag) => <span key={tag} className="chip">#{tag}</span>)}
      </div>
    </section>
  )
}
