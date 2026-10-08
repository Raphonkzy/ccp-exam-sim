import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useT } from '../i18n'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { QuestionCard } from '../components/QuestionCard'
import { ReviewPanel } from '../components/ReviewPanel'
import { getQuestion } from '../lib/questionService'
import { newId } from '../lib/examBuilder'
import { isCorrect, summarize } from '../lib/scoring'
import type { Question } from '../types/question'

export default function PracticeSession() {
  const { t } = useT()
  const { recordAnswer, addSession } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const ids = (location.state as { ids?: string[] } | null)?.ids

  const questions = useMemo(
    () => (ids ?? []).map(getQuestion).filter((q): q is Question => !!q),
    [ids],
  )
  const sessionId = useRef(newId())
  const startedAt = useRef(Date.now())
  const [index, setIndex] = useState(0)
  const [selections, setSelections] = useState<Record<string, string[]>>({})
  const [checked, setChecked] = useState<string[]>([])
  const [confirmEnd, setConfirmEnd] = useState(false)

  // Keep refs in sync so the unmount cleanup always has the latest values
  const selectionsRef = useRef(selections)
  const checkedRef = useRef(checked)
  const addSessionRef = useRef(addSession)
  useEffect(() => { selectionsRef.current = selections }, [selections])
  useEffect(() => { checkedRef.current = checked }, [checked])
  useEffect(() => { addSessionRef.current = addSession }, [addSession])

  // Auto-save when user navigates away without finishing
  useEffect(() => {
    return () => {
      const answered = checkedRef.current
      if (answered.length === 0) return // nothing answered — don't save ghost session
      const answeredQuestions = questions.filter((q) => answered.includes(q.id))
      const session = summarize(
        sessionId.current,
        'practice',
        startedAt.current,
        answeredQuestions,
        selectionsRef.current,
        [],
      )
      addSessionRef.current(session)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally empty — runs only on unmount

  if (!ids || questions.length === 0) return <Navigate to="/practice" replace />

  const q = questions[index]
  const sel = selections[q.id] ?? []
  const isChecked = checked.includes(q.id)
  const need = q.correctOptionIds.length
  const last = index === questions.length - 1

  const finish = (answeredOnly: boolean) => {
    const done = answeredOnly ? questions.filter((x) => checked.includes(x.id)) : questions
    if (done.length === 0) return navigate('/practice', { replace: true })
    const session = summarize(sessionId.current, 'practice', startedAt.current, done, selections, [])
    // Mark as finished so the unmount cleanup doesn't double-save
    checkedRef.current = [] // clear so cleanup sees 0 answered
    addSession(session)
    navigate(`/results/${session.id}`, { replace: true })
  }

  const check = () => {
    if (sel.length !== need || isChecked) return
    recordAnswer(q.id, sel, isCorrect(q, sel), 'practice')
    setChecked((c) => [...c, q.id])
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-4">
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--surface-2)] border border-[var(--color-pencil-gray)]/50" role="progressbar" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={checked.length}>
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(checked.length / questions.length) * 100}%`, background: 'var(--color-forest-ink)' }} />
        </div>
        <button type="button" className="btn btn-sm text-xs" onClick={() => setConfirmEnd(true)}>{t('practice.endEarly')}</button>
      </div>

      <QuestionCard
        key={q.id}
        question={q}
        selected={sel}
        index={index + 1}
        total={questions.length}
        reveal={isChecked}
        onChange={(v) => setSelections((s) => ({ ...s, [q.id]: v }))}
      />

      {isChecked && <ReviewPanel question={q} selected={sel} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {!isChecked ? (
          <>
            <p className="text-xs text-[var(--color-forest-ink)]/70 font-mono" role="status">{sel.length !== need ? t('practice.selectToCheck') : ''}</p>
            <button type="button" className="btn-primary" disabled={sel.length !== need} onClick={check}>
              {t('practice.check')}
            </button>
          </>
        ) : (
          <>
            <span />
            {last ? (
              <button type="button" className="btn-primary" onClick={() => finish(false)}>{t('practice.finish')}</button>
            ) : (
              <button type="button" className="btn-primary" onClick={() => setIndex((i) => i + 1)} autoFocus>
                {t('practice.nextQuestion')}
              </button>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmEnd}
        title={t('practice.endConfirmTitle')}
        confirmLabel={t('practice.endEarly')}
        onCancel={() => setConfirmEnd(false)}
        onConfirm={() => { setConfirmEnd(false); finish(true) }}
      >
        {t('practice.endConfirmBody')}
      </ConfirmDialog>
    </div>
  )
}

