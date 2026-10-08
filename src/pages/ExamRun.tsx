import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  const { data, setActiveExam, discardExam, recordAnswersBatch, addSession } = useApp()
  const navigate = useNavigate()
  const exam = data.activeExam
  const [confirm, setConfirm] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [timeUp, setTimeUp] = useState(false)
  const [isEnding, setIsEnding] = useState(false)

  const questions = useMemo(
    () => (exam?.questionIds ?? []).map(getQuestion).filter((q): q is Question => !!q),
    [exam?.questionIds],
  )

  const submit = useCallback(() => {
    if (!exam || isEnding) return
    setIsEnding(true)
    const toRecord = questions.map((q) => {
      const sel = exam.selections[q.id] ?? []
      return {
        qid: q.id,
        selected: sel,
        correct: isCorrect(q, sel),
        mode: 'exam' as const,
      }
    })
    recordAnswersBatch(toRecord)
    const session = summarize(exam.id, 'exam', exam.startedAt, questions, exam.selections, exam.flagged)
    addSession(session)
    setActiveExam(null)
    navigate(`/results/${session.id}`, { replace: true, state: { session } })
  }, [exam, isEnding, questions, recordAnswersBatch, addSession, setActiveExam, navigate])

  const discard = () => {
    discardExam()
    navigate('/exam', { replace: true })
  }

  const submitRef = useRef(submit)
  useEffect(() => {
    submitRef.current = submit
  }, [submit])

  const left = useCountdown(exam?.deadline ?? null, () => {
    setTimeUp(true)
    window.setTimeout(() => submitRef.current(), 1500)
  })

  if (!exam || questions.length === 0) {
    if (isEnding) return null
    return <Navigate to="/exam" replace />
  }

  const q = questions[exam.index]
  const sel = exam.selections[q.id] ?? []
  const flagged = exam.flagged.includes(q.id)
  const answeredCount = questions.filter((x) => (exam.selections[x.id] ?? []).length > 0).length
  const unansweredCount = questions.length - answeredCount
  const isLast = exam.index === questions.length - 1

  const patch = (p: Partial<typeof exam>) => setActiveExam({ ...exam, ...p })
  const go = (i: number) => patch({ index: Math.max(0, Math.min(questions.length - 1, i)) })

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_16rem]">
      <div className="grid gap-4">
        <div className="card flex flex-wrap items-center justify-between gap-2.5 !py-2.5 sm:!py-3 px-3 sm:px-5">
          <Timer seconds={left} label={t('exam.timeLeft')} />
          <span className="text-xs text-[var(--color-forest-ink)]/70 font-mono font-medium">{t('exam.answered')}: {answeredCount}/{questions.length}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-sm text-xs text-[var(--color-terracotta)]"
              onClick={() => setConfirmDiscard(true)}
            >
              {t('exam.discard')}
            </button>
            <button type="button" className="btn-primary !py-1.5 !px-3.5 sm:!px-4 !text-xs" onClick={() => setConfirm(true)}>
              {t('exam.submit')}
            </button>
          </div>
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

        <div className="flex items-center justify-between gap-2">
          <button type="button" className="btn !rounded-[6px] !px-3 sm:!px-4 !text-xs sm:!text-sm" disabled={exam.index === 0} onClick={() => go(exam.index - 1)}>← {t('common.previous')}</button>
          <button
            type="button"
            className="btn !rounded-[6px] inline-flex items-center gap-1.5 !px-2.5 sm:!px-4 text-xs font-semibold"
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
          {isLast ? (
            <button
              type="button"
              className="btn-primary !px-4 sm:!px-5 !text-xs sm:!text-sm font-semibold inline-flex items-center shadow-sm"
              onClick={() => setConfirm(true)}
            >
              <span>{t('exam.submit')}</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary !px-3 sm:!px-4 !text-xs sm:!text-sm"
              onClick={() => go(exam.index + 1)}
            >
              {t('common.next')} →
            </button>
          )}
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
        confirmLabel={t('exam.submitConfirm')}
        cancelLabel={t('exam.submitKeep')}
        onCancel={() => setConfirm(false)}
        onConfirm={() => { setConfirm(false); submit() }}
      >
        <div className="space-y-3.5 pt-1 text-left">
          <p className="text-xs text-[var(--color-forest-ink)]/80 leading-relaxed">
            Please double-check your answers before submitting. Once submitted, your exam will be finalized and graded immediately.
          </p>

          <div className="grid grid-cols-3 gap-2 rounded-lg border border-[var(--color-pencil-gray)]/70 bg-[var(--surface)] p-3 text-center shadow-xs">
            <div className="space-y-0.5">
              <div className="text-base sm:text-lg font-bold font-mono text-[var(--color-forest-ink)]">{answeredCount}</div>
              <div className="text-[11px] font-medium text-[var(--color-forest-ink)]/70">{t('exam.answered')}</div>
            </div>
            <div className="space-y-0.5">
              <div className={`text-base sm:text-lg font-bold font-mono ${unansweredCount > 0 ? 'text-[var(--color-terracotta)]' : 'text-[var(--color-forest-ink)]'}`}>
                {unansweredCount}
              </div>
              <div className="text-[11px] font-medium text-[var(--color-forest-ink)]/70">{t('exam.unanswered')}</div>
            </div>
            <div className="space-y-0.5">
              <div className={`text-base sm:text-lg font-bold font-mono ${exam.flagged.length > 0 ? 'text-[var(--accent)]' : 'text-[var(--color-forest-ink)]'}`}>
                {exam.flagged.length}
              </div>
              <div className="text-[11px] font-medium text-[var(--color-forest-ink)]/70">{t('exam.flagged')}</div>
            </div>
          </div>

          {unansweredCount > 0 ? (
            <div className="rounded-lg border border-[var(--color-terracotta)]/40 bg-[var(--color-terracotta)]/10 px-3.5 py-2.5 text-xs text-[var(--color-forest-ink)]">
              <strong className="block font-semibold text-[var(--color-terracotta)]">
                {unansweredCount} {unansweredCount === 1 ? 'question remains' : 'questions remain'} unanswered
              </strong>
              <p className="mt-1 text-[var(--color-forest-ink)]/80 leading-relaxed">
                Unanswered questions are scored as zero. Review your unanswered questions before submitting if time permits.
              </p>
            </div>
          ) : exam.flagged.length > 0 ? (
            <div className="rounded-lg border border-[var(--color-pencil-gray)] bg-[var(--surface-2)] px-3.5 py-2.5 text-xs text-[var(--color-forest-ink)]">
              <strong className="block font-semibold">
                {exam.flagged.length} flagged {exam.flagged.length === 1 ? 'question' : 'questions'}
              </strong>
              <p className="mt-1 text-[var(--color-forest-ink)]/80 leading-relaxed">
                You marked questions for review. Select &ldquo;Check answers first&rdquo; to re-inspect them.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-xs text-[var(--color-forest-ink)]">
              <p className="font-medium text-[var(--color-forest-ink)]/90">
                All {questions.length} questions are answered. Select &ldquo;Submit exam&rdquo; to calculate your final score.
              </p>
            </div>
          )}
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmDiscard}
        title={t('exam.discardConfirmTitle')}
        danger
        confirmLabel={t('exam.discardConfirmLabel')}
        cancelLabel={t('exam.submitKeep')}
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={() => { setConfirmDiscard(false); discard() }}
      >
        {t('exam.discardConfirmBody')}
      </ConfirmDialog>
    </div>
  )
}
