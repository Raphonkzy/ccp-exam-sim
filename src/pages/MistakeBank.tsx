import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useT } from '../i18n'
import { ReviewItem } from '../components/ReviewItem'
import { getQuestion } from '../lib/questionService'
import { latestWrongIds, wrongCount } from '../lib/stats'
import type { Question } from '../types/question'

export default function MistakeBank() {
  const { t } = useT()
  const { data } = useApp()
  const navigate = useNavigate()
  const ids = latestWrongIds(data)
  const questions = ids.map(getQuestion).filter((q): q is Question => !!q)

  return (
    <div className="grid gap-6">
      <div className="fade-up flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="h1 text-[var(--color-forest-ink)]">{t('mistakes.title')}</h1>
          <p className="text-sm text-[var(--color-forest-ink)]/70 mt-1">{t('mistakes.subtitle')}</p>
        </div>
        {questions.length > 0 && (
          <button type="button" className="btn-primary inline-flex items-center gap-1.5" onClick={() => navigate('/practice/run', { state: { ids } })}>
            <span>{t('mistakes.practiceAll', { n: questions.length })}</span>
            <span className="font-mono">→</span>
          </button>
        )}
      </div>

      {questions.length === 0 ? (
        <div className="card py-10 text-center">
          <p className="text-lg font-semibold">{t('mistakes.empty')}</p>
          <p className="muted mt-1">{t('mistakes.emptyHint')}</p>
        </div>
      ) : (
        <ul className="grid gap-6 p-0 list-none">
          {questions.map((q) => {
            const last = data.answers[q.id]
            return (
              <li key={q.id} className="list-none">
                <ReviewItem
                  question={q}
                  selected={last[last.length - 1].selected}
                  extra={t('mistakes.timesWrong', { n: wrongCount(data, q.id) })}
                  showLabel={t('mistakes.show')}
                  hideLabel={t('mistakes.hide')}
                />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
