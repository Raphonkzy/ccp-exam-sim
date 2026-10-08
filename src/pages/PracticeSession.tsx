import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useT } from '../i18n'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { QuestionCard } from '../components/QuestionCard'
import { ReviewPanel } from '../components/ReviewPanel'
import { getQuestion } from '../lib/questionService'
import { isCorrect, summarize } from '../lib/scoring'
import type { Question } from '../types/question'

export default function PracticeSession() {
  const { t } = useT()
  const { data, recordAnswersBatch, addSession, setActivePractice, discardPractice } = useApp()
  const navigate = useNavigate()

  const practice = data.activePractice
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  const questions = useMemo(
    () => (practice?.questionIds ?? []).map(getQuestion).filter((q): q is Question => !!q),
    [practice?.questionIds],
  )

  // No active session → go back to setup
  if (!practice || questions.length === 0) return <Navigate to="/practice" replace />

  const q = questions[practice.index]
  const sel = practice.selections[q.id] ?? []
  const isChecked = practice.checked.includes(q.id)
  const need = q.correctOptionIds.length
  const last = practice.index === questions.length - 1

  const patch = (p: Partial<typeof practice>) =>
    setActivePractice({ ...practice, ...p })

  const check = () => {
    if (sel.length !== need || isChecked) return
    patch({ checked: [...practice.checked, q.id] })
  }

  const finish = (answeredOnly: boolean) => {
    const done = answeredOnly
      ? questions.filter((x) => practice.checked.includes(x.id))
      : questions
    if (done.length === 0) {
      discardPractice()
      return navigate('/practice', { replace: true })
    }
    // Only save answers when session is completed/ended
    const answeredQuestions = questions.filter((x) => practice.checked.includes(x.id))
    const toRecord = answeredQuestions.map((item) => {
      const itemSel = practice.selections[item.id] ?? []
      return {
        qid: item.id,
        selected: itemSel,
        correct: isCorrect(item, itemSel),
        mode: 'practice' as const,
      }
    })
    recordAnswersBatch(toRecord)
    const session = summarize(practice.id, 'practice', practice.startedAt, done, practice.selections, [])
    setActivePractice(null)
    addSession(session)
    navigate(`/results/${session.id}`, { replace: true })
  }

  const discard = () => {
    discardPractice()
    navigate('/practice', { replace: true })
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-4">
      {/* Resume banner — shown when user returns to a session they left mid-way */}
      {practice.checked.length > 0 && (
        <div className="card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-l-4 border-l-[var(--color-forest-ink)] !py-3">
          <div>
            <p className="font-semibold text-sm text-[var(--color-forest-ink)]">Resuming practice session</p>
            <p className="text-xs text-[var(--color-forest-ink)]/70 mt-0.5">
              {practice.checked.length}/{questions.length} answered · pick up where you left off
            </p>
          </div>
          <button type="button" className="btn btn-sm text-xs shrink-0 text-[var(--color-terracotta)]" onClick={() => setConfirmDiscard(true)}>
            {t('practice.discard')}
          </button>
        </div>
      )}

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--surface-2)] border border-[var(--color-pencil-gray)]/50"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={questions.length}
          aria-valuenow={practice.checked.length}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${(practice.checked.length / questions.length) * 100}%`, background: 'var(--color-forest-ink)' }}
          />
        </div>
        <button
          type="button"
          className="btn btn-sm text-xs text-[var(--color-terracotta)]"
          onClick={() => setConfirmDiscard(true)}
        >
          {t('practice.discard')}
        </button>
        <button type="button" className="btn btn-sm text-xs" onClick={() => setConfirmEnd(true)}>
          {t('practice.endEarly')}
        </button>
      </div>

      <QuestionCard
        key={q.id}
        question={q}
        selected={sel}
        index={practice.index + 1}
        total={questions.length}
        reveal={isChecked}
        onChange={(v) => patch({ selections: { ...practice.selections, [q.id]: v } })}
      />

      {isChecked && <ReviewPanel question={q} selected={sel} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {!isChecked ? (
          <>
            <p className="text-xs text-[var(--color-forest-ink)]/70 font-mono" role="status">
              {sel.length !== need ? t('practice.selectToCheck') : ''}
            </p>
            <button type="button" className="btn-primary" disabled={sel.length !== need} onClick={check}>
              {t('practice.check')}
            </button>
          </>
        ) : (
          <>
            <span />
            {last ? (
              <button type="button" className="btn-primary" onClick={() => finish(false)}>
                {t('practice.finish')}
              </button>
            ) : (
              <button type="button" className="btn-primary" onClick={() => patch({ index: practice.index + 1 })} autoFocus>
                {t('practice.nextQuestion')}
              </button>
            )}
          </>
        )}
      </div>

      {/* End early confirm */}
      <ConfirmDialog
        open={confirmEnd}
        title={t('practice.endConfirmTitle')}
        confirmLabel={t('practice.endEarly')}
        onCancel={() => setConfirmEnd(false)}
        onConfirm={() => { setConfirmEnd(false); finish(true) }}
      >
        {t('practice.endConfirmBody')}
      </ConfirmDialog>

      {/* Discard confirm */}
      <ConfirmDialog
        open={confirmDiscard}
        title={t('practice.discardConfirmTitle')}
        danger
        confirmLabel="Discard"
        cancelLabel={t('exam.submitKeep')}
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={() => { setConfirmDiscard(false); discard() }}
      >
        {t('practice.discardConfirmBody')}
      </ConfirmDialog>
    </div>
  )
}
