import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { ConfirmDialog } from '../components/ConfirmDialog'

export default function Settings() {
  const { user } = useAuth()
  const { data, resetData } = useApp()
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  return (
    <div className="grid gap-6 max-w-2xl">
      <div className="fade-up">
        <h1 className="h1 text-[var(--color-forest-ink)]">Settings</h1>
        <p className="text-sm text-[var(--color-forest-ink)]/70 mt-1">
          Manage your study progress.
        </p>
      </div>

      {/* Study Progress Stats */}
      <section className="card grid gap-4" aria-labelledby="progress-h">
        <h2 id="progress-h" className="h2 text-[var(--color-forest-ink)]">Your Progress</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border border-[#b6b6b6]/50 bg-white/80 p-3 text-center">
            <div className="text-2xl font-bold font-mono text-[var(--color-forest-ink)]">{data.sessions.length}</div>
            <div className="text-[11px] font-medium text-[var(--color-forest-ink)]/70 uppercase tracking-wider mt-0.5">Exam Attempts</div>
          </div>
          <div className="rounded-lg border border-[#b6b6b6]/50 bg-white/80 p-3 text-center">
            <div className="text-2xl font-bold font-mono text-[var(--color-forest-ink)]">{data.bookmarks.length}</div>
            <div className="text-[11px] font-medium text-[var(--color-forest-ink)]/70 uppercase tracking-wider mt-0.5">Bookmarks</div>
          </div>
          <div className="rounded-lg border border-[#b6b6b6]/50 bg-white/80 p-3 text-center">
            <div className="text-2xl font-bold font-mono text-[var(--color-forest-ink)]">{Object.keys(data.answers).length}</div>
            <div className="text-[11px] font-medium text-[var(--color-forest-ink)]/70 uppercase tracking-wider mt-0.5">Answered</div>
          </div>
          <div className="rounded-lg border border-[#b6b6b6]/50 bg-white/80 p-3 text-center">
            <div className="text-2xl font-bold font-mono text-[var(--color-forest-ink)]">{data.confusing.length}</div>
            <div className="text-[11px] font-medium text-[var(--color-forest-ink)]/70 uppercase tracking-wider mt-0.5">Flagged</div>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="card grid gap-3 border border-rose-200/60 bg-rose-50/20" aria-labelledby="danger-h">
        <div>
          <h2 id="danger-h" className="h2 text-[var(--color-forest-ink)]">Danger Zone</h2>
          <p className="text-xs text-[var(--color-forest-ink)]/65 mt-1">
            This action cannot be undone. All your exam attempts, bookmarks, answers, and flagged questions will be permanently erased.
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-rose-200/80 bg-white/70 px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-[var(--color-forest-ink)]">Reset all progress</div>
            <div className="text-xs text-[var(--color-forest-ink)]/60">Start fresh from zero</div>
          </div>
          <button
            type="button"
            className="btn btn-danger !rounded-[6px] text-xs font-semibold shrink-0"
            onClick={() => setConfirmReset(true)}
          >
            Reset Progress
          </button>
        </div>

        {resetDone && (
          <p className="chip chip-warn !w-fit">Progress has been completely reset.</p>
        )}
      </section>

      <ConfirmDialog
        open={confirmReset}
        title="Reset all progress?"
        danger
        confirmLabel="Reset Progress"
        onCancel={() => setConfirmReset(false)}
        onConfirm={async () => {
          setConfirmReset(false)
          await resetData()
          setResetDone(true)
        }}
      >
        {user
          ? 'This will permanently delete all your exam attempts, bookmarks, answers, and flagged questions. This cannot be undone.'
          : 'This will clear all your locally stored progress, including practice answers, bookmarks, and exam history. This cannot be undone.'}
      </ConfirmDialog>
    </div>
  )
}


