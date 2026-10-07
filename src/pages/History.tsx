import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useT } from '../i18n'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { formatDuration } from '../lib/stats'

export default function History() {
  const { t } = useT()
  const { data, deleteSession } = useApp()
  const [toDelete, setToDelete] = useState<string | null>(null)

  return (
    <div className="grid gap-6">
      <div className="fade-up">
        <h1 className="h1 text-[var(--color-forest-ink)]">{t('history.title')}</h1>
        <p className="text-sm text-[var(--color-forest-ink)]/70 mt-1">{t('history.subtitle')}</p>
      </div>

      {data.sessions.length === 0 ? (
        <div className="card py-10 text-center">
          <p className="text-lg font-semibold text-[var(--color-forest-ink)]">{t('history.empty')}</p>
          <p className="text-sm text-[var(--color-forest-ink)]/70 mt-1">{t('history.emptyHint')}</p>
        </div>
      ) : (
        <ul className="grid gap-3 p-0 list-none">
          {data.sessions.map((s) => {
            const pct = s.total ? Math.round((s.correctCount / s.total) * 100) : 0
            const exam = s.mode === 'exam'
            return (
              <li key={s.id} className="card card-hover flex list-none flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div
                    className="grid h-11 w-11 sm:h-12 sm:w-12 shrink-0 place-items-center rounded-md text-base sm:text-lg font-extrabold tabular-nums text-[var(--color-cream-paper)]"
                    style={{ background: exam ? (s.passed ? 'var(--good-border)' : 'var(--bad-border)') : 'var(--color-forest-ink)' }}
                  >
                    {exam ? (s.estScore ?? (s.total ? Math.round(100 + (s.correctCount / s.total) * 900) : 100)) : `${pct}%`}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="font-bold text-sm sm:text-base text-[var(--color-forest-ink)]">{t(exam ? 'results.mode.exam' : 'results.mode.practice')}</span>
                      <span className="chip !text-[10px] sm:!text-[11px]">{t('history.questions', { n: s.total })}</span>
                      <span className="chip !text-[10px] sm:!text-[11px]">{t('results.correct', { c: s.correctCount, n: s.total })}</span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-[var(--color-forest-ink)]/70 mt-1 font-mono">
                      {s.finishedAt ? new Date(s.finishedAt).toLocaleString() : ''} · {formatDuration(s.durationSec || 0)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#b6b6b6]/30 self-stretch sm:self-auto justify-end">
                  <Link to={`/results/${s.id}`} className="btn-primary !py-1.5 !px-3.5 !text-xs no-underline flex-1 sm:flex-initial text-center">{t('history.open')}</Link>
                  <button type="button" className="btn btn-sm text-xs flex-1 sm:flex-initial" onClick={() => setToDelete(s.id)}>{t('history.delete')}</button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title={t('history.delete')}
        danger
        confirmLabel={t('history.delete')}
        onCancel={() => setToDelete(null)}
        onConfirm={() => { if (toDelete) deleteSession(toDelete); setToDelete(null) }}
      >
        {t('history.deleteConfirm')}
      </ConfirmDialog>
    </div>
  )
}
