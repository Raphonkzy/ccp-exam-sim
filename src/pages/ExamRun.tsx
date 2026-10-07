import { useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useT } from '../i18n'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { QuestionCard } from '../components/QuestionCard'
import { Timer, useCountdown } from '../components/Timer'
import { getQuestion } from '../lib/questionService'
import { isCorrect, summarize } from '../lib/scoring'
import type { Question } from '../types/question'

export default function ExamRun() {
  const { t } = useT()
  const { data, setActiveExam, recordAnswer, addSession } = useApp()
  const navigate = useNavigate()
  const exam = data.activeExam
  const [confirm, setConfirm] = useState(false)
  const [timeUp, setTimeUp] = useState(false)

  const questions = useMemo(
    () => (exam?.questionIds ?? []).map(getQuestion).filter((q): q is Question => !!q),
    [exam?.questionIds],
  )

  const submit = () => {
    if (!exam) return
    for (const q of questions) {
      const sel = exam.selections[q.id] ?? []
      recordAnswer(q.id, sel, isCorrect(q, sel), 'exam')
    }
    const session = summarize(exam.id, 'exam', exam.startedAt, questions, exam.selections, exam.flagged)
    addSession(session)
    setActiveExam(null)
    navigate(`/results/${session.id}`, { replace: true })
  }

  // The countdown effect captures its callback once, so route through a ref to always call the latest submit.
  const submitRef = useRef(submit)
  submitRef.current = submit
  const left = useCountdown(exam?.deadline ?? null, () => {
    setTimeUp(true)
    window.setTimeout(() => submitRef.current(), 1500)
  })

  if (!exam || questions.length === 0) return <Navigate to="/exam" replace />

  const q = questions[exam.index]
  const sel = exam.selections[q.id] ?? []
  const flagged = exam.flagged.includes(q.id)
  const answeredCount = questions.filter((x) => (exam.selections[x.id] ?? []).length > 0).length

  const patch = (p: Partial<typeof exam>) => setActiveExam({ ...exam, ...p })
  const go = (i: number) => patch({ index: Math.max(0, Math.min(questions.length - 1, i)) })

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_16rem]">
      <div className="grid gap-4">
        <div className="card flex flex-wrap items-center gap-3 !py-3">
          <Timer seconds={left} label={t('exam.timeLeft')} />
          <span className="text-xs text-[var(--color-forest-ink)]/70 font-mono font-medium">{t('exam.answered')}: {answeredCount}/{questions.length}</span>
          <button type="button" className="btn-primary !py-1.5 !px-4 !text-xs ml-auto" onClick={() => setConfirm(true)}>{t('exam.submit')}</button>
        </div>

        {timeUp && <p className="chip chip-bad !whitespace-normal !text-sm" role="alert">{t('exam.timeUp')}</p>}

        <QuestionCard
          key={q.id}
          question={q}
          selected={sel}
          index={exam.index + 1}
          total={questions.length}
          onChange={(v) => patch({ selections: { ...exam.selections, [q.id]: v } })}
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <button type="button" className="btn !rounded-[6px]" disabled={exam.index === 0} onClick={() => go(exam.index - 1)}>← {t('common.previous')}</button>
          <button
            type="button"
            className="btn !rounded-[6px] inline-flex items-center gap-1.5 text-xs font-semibold"
            aria-pressed={flagged}
            onClick={() => patch({ flagged: flagged ? exam.flagged.filter((x) => x !== q.id) : [...exam.flagged, q.id] })}
          >
            {flagged ? (
              <>
                <svg className="h-4 w-4 fill-[var(--color-terracotta)] text-[var(--color-terracotta)]" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                </svg>
                <span>{t('exam.unflag')}</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                <span>{t('exam.flag')}</span>
              </>
            )}
          </button>
          <button type="button" className="btn-primary" disabled={exam.index === questions.length - 1} onClick={() => go(exam.index + 1)}>{t('common.next')} →</button>
        </div>
      </div>

      <aside className="card h-fit lg:sticky lg:top-28" aria-labelledby="nav-h">
        <h2 id="nav-h" className="h2 mb-3 text-[var(--color-forest-ink)]">{t('exam.navigator')}</h2>
        <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-10 lg:grid-cols-5">
          {questions.map((x, i) => {
            const a = (exam.selections[x.id] ?? []).length > 0
            const f = exam.flagged.includes(x.id)
            const cur = i === exam.index
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => go(i)}
                aria-current={cur ? 'true' : undefined}
                aria-label={`${i + 1}${a ? ', ' + t('exam.answered') : ''}${f ? ', ' + t('exam.flagged') : ''}`}
                className="relative grid aspect-square place-items-center rounded-md border text-xs font-semibold font-mono transition-all hover:scale-105"
                style={{
                  borderColor: cur ? 'var(--color-forest-ink)' : a ? 'var(--color-forest-ink)' : 'var(--color-pencil-gray)',
                  borderWidth: cur ? 2 : 1,
                  background: cur ? 'var(--color-highlighter-yellow)' : a ? 'var(--color-sticky-note-mint)' : 'var(--surface)',
                  color: 'var(--color-forest-ink)',
                }}
              >
                {i + 1}
                {f && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[var(--color-terracotta)]" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
        <dl className="mt-4 grid gap-1.5 text-xs text-[var(--color-forest-ink)]/70 font-mono">
          <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded border border-[var(--color-forest-ink)] bg-[var(--color-sticky-note-mint)]" />{t('exam.answered')}</div>
          <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded border border-[var(--color-pencil-gray)] bg-[var(--surface)]" />{t('exam.unanswered')}</div>
          <div className="flex items-center gap-2"><span className="inline-block h-2 w-2 rounded-full bg-[var(--color-terracotta)]" aria-hidden="true" />{t('exam.flagged')}: {exam.flagged.length}</div>
        </dl>
      </aside>

      <ConfirmDialog
        open={confirm}
        title={t('exam.submitTitle')}
        confirmLabel={t('exam.submit')}
        cancelLabel={t('exam.submitKeep')}
        onCancel={() => setConfirm(false)}
        onConfirm={() => { setConfirm(false); submit() }}
      >
        {t('exam.submitBody', { a: answeredCount, n: questions.length, f: exam.flagged.length })}
      </ConfirmDialog>
    </div>
  )
}
