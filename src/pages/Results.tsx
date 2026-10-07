import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { AuthModal } from '../components/AuthModal'
import { useT } from '../i18n'
import { DomainChart } from '../components/DomainChart'
import { ReviewItem } from '../components/ReviewItem'
import { getQuestion } from '../lib/questionService'
import { isCorrect, PASS_SCORE } from '../lib/scoring'
import { formatDuration } from '../lib/stats'
import type { Question } from '../types/question'

type Tab = 'wrong' | 'flagged' | 'all'

export default function Results() {
  const { t } = useT()
  const { data } = useApp()
  const { user } = useAuth()
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: 'login' | 'register' }>({ open: false, mode: 'register' })
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('wrong')
  const session = data.sessions.find((s) => s.id === id)

  const questions = useMemo(() => {
    const ids =
      session?.questionIds && session.questionIds.length > 0
        ? session.questionIds
        : Object.keys(session?.selections ?? {})
    return ids.map(getQuestion).filter((q): q is Question => !!q)
  }, [session])

  if (!session) {
    return (
      <div className="card max-w-xl">
        <p>{t('results.notFound')}</p>
        <Link to="/history" className="btn mt-4 no-underline">{t('results.backHistory')}</Link>
      </div>
    )
  }

  const wrong = questions.filter((q) => !isCorrect(q, session.selections[q.id] ?? []))
  const flagged = questions.filter((q) => session.flagged.includes(q.id))
  const list = tab === 'wrong' ? wrong : tab === 'flagged' ? flagged : questions
  const isExam = session.mode === 'exam'
  const pct = session.total ? Math.round((session.correctCount / session.total) * 100) : 0
  const scorePct = isExam && session.estScore ? ((session.estScore - 100) / 900) * 100 : pct
  const passLinePct = ((PASS_SCORE - 100) / 900) * 100

  const tabs: { key: Tab; label: string; n: number }[] = [
    { key: 'wrong', label: t('results.wrong'), n: wrong.length },
    ...(isExam ? [{ key: 'flagged' as Tab, label: t('results.flagged'), n: flagged.length }] : []),
    { key: 'all', label: t('results.all'), n: questions.length },
  ]

  return (
    <div className="grid gap-6">
      <div className="fade-up flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="chip mb-2 !text-[11px] font-mono font-semibold">{t(isExam ? 'results.mode.exam' : 'results.mode.practice')} · {new Date(session.finishedAt).toLocaleString()}</p>
          <h1 className="h1 text-[var(--color-forest-ink)]">{isExam ? t('results.title') : t('results.practiceSummary')}</h1>
        </div>
        <Link to="/history" className="btn btn-sm text-xs no-underline">{t('results.backHistory')}</Link>
      </div>

      <section className="card grid gap-6 md:grid-cols-[auto_1fr] md:items-center" aria-label={t('results.title')}>
        <div
          className="mx-auto grid h-44 w-44 place-items-center rounded-full"
          style={{
            background: `conic-gradient(${isExam && session.passed === false ? 'var(--bad-border)' : 'var(--color-forest-ink)'} ${scorePct * 3.6}deg, var(--surface-2) 0)`,
          }}
        >
          <div className="grid h-36 w-36 place-items-center rounded-full text-center bg-[var(--surface-cream)] border border-[var(--color-pencil-gray)]/40">
            <div>
              <div className="text-4xl font-extrabold tabular-nums text-[var(--color-forest-ink)]" style={{ fontFamily: 'var(--font-display)' }}>{isExam ? session.estScore : `${pct}%`}</div>
              <div className="text-xs text-[var(--color-forest-ink)]/70 font-mono">{isExam ? t('results.estimatedScore') : t('results.correct', { c: session.correctCount, n: session.total })}</div>
            </div>
          </div>
        </div>
        <div>
          {isExam && (
            <p className={`chip ${session.passed ? 'chip-good' : 'chip-bad'} !px-3 !py-1.5 !text-sm font-bold`}>
              {session.passed ? t('results.passEstimate') : t('results.failEstimate')}
            </p>
          )}
          <p className="mt-3 text-lg font-semibold text-[var(--color-forest-ink)]">{t('results.correct', { c: session.correctCount, n: session.total })}</p>
          <p className="text-sm text-[var(--color-forest-ink)]/70">{t('results.duration', { time: formatDuration(session.durationSec) })}</p>
          {isExam && (
            <>
              <div className="relative mt-4 h-2.5 rounded-full overflow-hidden bg-[var(--surface-2)] border border-[var(--color-pencil-gray)]/50" aria-hidden="true">
                <div className="h-full rounded-full" style={{ width: `${scorePct}%`, background: 'var(--color-forest-ink)' }} />
                <div className="absolute top-0 h-full w-0.5 bg-[var(--color-forest-ink)]" style={{ left: `${passLinePct}%` }} />
              </div>
              <p className="text-xs text-[var(--color-forest-ink)]/70 mt-1 font-mono">100 — {PASS_SCORE} (Pass) — 1000</p>
              <p className="mt-3 rounded-lg border border-[var(--color-pencil-gray)]/50 p-3 text-xs text-[var(--color-forest-ink)]/80 leading-relaxed" role="note">{t('results.disclaimer')}</p>
            </>
          )}
          {wrong.length > 0 && (
            <button type="button" className="btn-primary mt-4 inline-flex items-center gap-1.5" onClick={() => navigate('/practice/run', { state: { ids: wrong.map((q) => q.id) } })}>
              <span>{t('results.retryWrong')} ({wrong.length})</span>
              <span className="font-mono">→</span>
            </button>
          )}
        </div>
      </section>

      {!user && (
        <section className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-[1.5px] border-[var(--color-pencil-gray)] bg-[#fbf9f3]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-full bg-[#ffe95c] border border-[#1a3300]/25 px-2 py-0.5 text-[10px] font-mono font-bold text-[#1a3300]">
                SAVE RESULT
              </span>
              <span className="text-sm font-bold text-[var(--color-forest-ink)]">
                Save your progress online & track score trends
              </span>
            </div>
            <p className="text-xs text-[var(--color-forest-ink)]/75">
              Sign in or create an account to save your exam history online, track recurring mistakes, and review detailed answer breakdowns anytime.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-center">
            <button
              type="button"
              onClick={() => setAuthModal({ open: true, mode: 'login' })}
              className="btn-outline !h-8 !py-1 !px-3 !text-xs font-semibold whitespace-nowrap bg-white/70 flex-1 sm:flex-initial text-center"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthModal({ open: true, mode: 'register' })}
              className="btn-primary !h-8 !py-1 !px-3.5 !text-xs font-semibold whitespace-nowrap flex-1 sm:flex-initial text-center"
            >
              Create Free Account →
            </button>
          </div>
        </section>
      )}

      <section className="card" aria-labelledby="dom-b">
        <h2 id="dom-b" className="h2 mb-4 text-[var(--color-forest-ink)]">{t('results.domainBreakdown')}</h2>
        <DomainChart
          data={[1, 2, 3, 4].map((d) => {
            const s = session.domainStats[d]
            return { domain: d, pct: s && s.total ? Math.round((s.correct / s.total) * 100) : null, detail: s && s.total ? `${s.correct}/${s.total}` : undefined }
          })}
        />
      </section>

      <section aria-labelledby="rev-h">
        <h2 id="rev-h" className="sr-only">{t('results.all')}</h2>
        <div role="tablist" className="mb-4 flex flex-wrap gap-2">
          {tabs.map((x) => (
            <button key={x.key} role="tab" type="button" aria-selected={tab === x.key} onClick={() => setTab(x.key)} className={`btn !px-4 text-xs font-semibold ${tab === x.key ? 'btn-primary' : ''}`}>
              {x.label} ({x.n})
            </button>
          ))}
        </div>
        {list.length === 0 ? (
          <p className="card muted">{tab === 'wrong' ? t('results.noWrong') : t('results.noFlagged')}</p>
        ) : (
          <ul className="grid gap-6 p-0 list-none">
            {list.map((q) => (
              <li key={`${tab}-${q.id}`} className="list-none">
                <ReviewItem
                  question={q}
                  selected={session.selections[q.id] ?? []}
                  index={questions.indexOf(q) + 1}
                  total={questions.length}
                  defaultOpen={list.length <= 3}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <AuthModal
        open={authModal.open}
        onClose={() => setAuthModal((prev) => ({ ...prev, open: false }))}
        initialMode={authModal.mode}
      />
    </div>
  )
}
