import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useT } from '../i18n'
import { allQuestions } from '../lib/questionService'
import { buildExam, examSize, newId } from '../lib/examBuilder'
import { EXAM_MINUTES, EXAM_TOTAL } from '../lib/scoring'
import { formatDuration } from '../lib/stats'

export default function ExamIntro() {
  const { t } = useT()
  const { data, setActiveExam } = useApp()
  const navigate = useNavigate()
  const size = examSize(allQuestions)
  const active = data.activeExam
  const remaining = active ? Math.max(0, Math.ceil((active.deadline - Date.now()) / 1000)) : 0

  const start = () => {
    const qs = buildExam(allQuestions)
    const now = Date.now()
    setActiveExam({
      id: newId(),
      questionIds: qs.map((q) => q.id),
      selections: {},
      flagged: [],
      startedAt: now,
      deadline: now + EXAM_MINUTES * 60 * 1000,
      index: 0,
    })
    navigate('/exam/run')
  }

  return (
    <div className="grid gap-6">
      <div className="fade-up">
        <h1 className="h1 text-[var(--color-forest-ink)]">{t('exam.title')}</h1>
        <p className="text-sm text-[var(--color-forest-ink)]/70 mt-1">{t('exam.intro')}</p>
      </div>

      {active && (
        <section className="card" style={{ borderColor: 'var(--color-forest-ink)' }} aria-labelledby="resume-h">
          <h2 id="resume-h" className="h2 text-[var(--color-forest-ink)]">{t('exam.resumeTitle')}</h2>
          <p className="mt-1 text-sm text-[var(--color-forest-ink)]/70">{t('exam.resumeBody', { time: formatDuration(remaining) })}</p>
          <div className="mt-4 flex gap-2">
            <Link to="/exam/run" className="btn-primary no-underline inline-flex items-center gap-1.5">
              <span>{t('exam.resume')}</span>
              <span className="font-mono">→</span>
            </Link>
            <button type="button" className="btn" onClick={() => setActiveExam(null)}>{t('exam.discard')}</button>
          </div>
        </section>
      )}

      <section className="card">
        <ul className="grid gap-3 p-0 list-none">
          {[
            t('exam.rule1', { n: size }),
            t('exam.rule2', { m: EXAM_MINUTES }),
            t('exam.rule3'),
            t('exam.rule4'),
            t('exam.rule5'),
          ].map((r, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-full text-xs font-mono font-bold text-[var(--color-cream-paper)] bg-[var(--color-forest-ink)]" aria-hidden="true">{i + 1}</span>
              <span className="text-sm sm:text-base text-[var(--color-forest-ink)]">{r}</span>
            </li>
          ))}
        </ul>
        {size < EXAM_TOTAL && (
          <p className="chip chip-warn mt-4 !whitespace-normal !rounded-lg !px-3 !py-2 !text-sm">
            {t('exam.smallBank', { n: size, total: EXAM_TOTAL })}
          </p>
        )}
        <p className="mt-4 text-xs text-[var(--color-forest-ink)]/70 font-mono">{t('exam.langNote')}</p>
        <button type="button" className="btn-primary mt-5 inline-flex items-center gap-1.5" disabled={size === 0} onClick={start}>
          <span>{t('exam.start')}</span>
          <span className="font-mono">→</span>
        </button>
      </section>
    </div>
  )
}
