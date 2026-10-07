import { useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useT } from '../i18n'
import type { AppData } from '../types/progress'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { AuthModal } from '../components/AuthModal'

export default function Settings() {
  const { t } = useT()
  const { user } = useAuth()
  const { data, dbSyncing, lastSyncedAt, syncWithDatabase, replaceData, resetData } = useApp()
  const [importError, setImportError] = useState<string | null>(null)
  const [importOk, setImportOk] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const [syncDone, setSyncDone] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleManualSync = async () => {
    setSyncDone(false)
    await syncWithDatabase()
    setSyncDone(true)
    setTimeout(() => setSyncDone(false), 3000)
  }

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `clf02-database-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null)
    setImportOk(false)
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed: AppData = JSON.parse(ev.target?.result as string)
        if (!parsed.sessions || !parsed.answers) throw new Error('Invalid backup file: missing sessions or answers')
        replaceData(parsed)
        setImportOk(true)
        if (user) {
          syncWithDatabase()
        }
      } catch (err) {
        setImportError((err as Error).message)
      } finally {
        if (fileRef.current) fileRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="grid gap-6">
      <div className="fade-up">
        <h1 className="h1 text-[var(--color-forest-ink)]">{t('settings.title')}</h1>
        <p className="text-sm text-[var(--color-forest-ink)]/70 mt-1">
          Manage your study progress, cloud synchronization, and database backups.
        </p>
      </div>

      {user ? (
        /* ── Logged in: PostgreSQL Database Storage ── */
        <section className="card grid gap-4 border-2 border-emerald-800/25 bg-emerald-50/20" aria-labelledby="data-h">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-600 animate-pulse" />
                <h2 id="data-h" className="h2 text-[var(--color-forest-ink)]">
                  PostgreSQL Database Storage Active
                </h2>
              </div>
              <p className="text-xs text-[var(--color-forest-ink)]/75 mt-1 font-mono">
                Signed in as <strong>{user.email}</strong> ({user.role === 'admin' ? 'Administrator' : 'Learner'}). All progress, exam attempts, bookmarks, and mistakes are permanently stored in your database.
              </p>
            </div>
            <button
              type="button"
              onClick={handleManualSync}
              disabled={dbSyncing}
              className="btn btn-sm !text-xs !py-1.5 !px-3 font-semibold inline-flex items-center gap-1.5 bg-white border border-emerald-800/30"
            >
              <svg className={`h-3.5 w-3.5 ${dbSyncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {dbSyncing ? 'Syncing...' : 'Sync with Database'}
            </button>
          </div>

          {/* Database stats summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-1">
            <div className="rounded-lg border border-[#b6b6b6]/50 bg-white/80 p-3 text-center">
              <div className="text-xl font-bold font-mono text-[var(--color-forest-ink)]">{data.sessions.length}</div>
              <div className="text-[11px] font-medium text-[var(--color-forest-ink)]/70 uppercase tracking-wider">Exam Attempts</div>
            </div>
            <div className="rounded-lg border border-[#b6b6b6]/50 bg-white/80 p-3 text-center">
              <div className="text-xl font-bold font-mono text-[var(--color-forest-ink)]">{data.bookmarks.length}</div>
              <div className="text-[11px] font-medium text-[var(--color-forest-ink)]/70 uppercase tracking-wider">Bookmarks</div>
            </div>
            <div className="rounded-lg border border-[#b6b6b6]/50 bg-white/80 p-3 text-center">
              <div className="text-xl font-bold font-mono text-[var(--color-forest-ink)]">{Object.keys(data.answers).length}</div>
              <div className="text-[11px] font-medium text-[var(--color-forest-ink)]/70 uppercase tracking-wider">Answered</div>
            </div>
            <div className="rounded-lg border border-[#b6b6b6]/50 bg-white/80 p-3 text-center">
              <div className="text-xl font-bold font-mono text-[var(--color-forest-ink)]">{data.confusing.length}</div>
              <div className="text-[11px] font-medium text-[var(--color-forest-ink)]/70 uppercase tracking-wider">Flagged</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleManualSync}
              disabled={dbSyncing}
              className="btn-primary !text-xs font-bold inline-flex items-center justify-center gap-1.5 self-stretch sm:self-auto"
            >
              <svg className={`h-3.5 w-3.5 ${dbSyncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {dbSyncing ? 'Syncing...' : 'Sync Database Now'}
            </button>

            <button
              type="button"
              className="btn btn-danger !rounded-[6px] text-xs font-semibold self-stretch sm:self-auto"
              onClick={() => setConfirmReset(true)}
            >
              Reset Database Progress
            </button>
          </div>

          {syncDone && <p className="chip chip-good !w-fit">✓ Database successfully synchronized.</p>}
          {resetDone && <p className="chip chip-warn !w-fit">Database progress has been completely reset.</p>}
          {lastSyncedAt && (
            <p className="text-[11px] text-[var(--color-forest-ink)]/60 font-mono">
              Last database sync: {lastSyncedAt.toLocaleTimeString()}
            </p>
          )}
        </section>
      ) : (
        /* ── Guest: Local Storage Mode ── */
        <section className="card grid gap-4" aria-labelledby="data-h">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
              <h2 id="data-h" className="h2 text-[var(--color-forest-ink)]">
                Guest Mode (Local Browser Storage)
              </h2>
            </div>
            <p className="text-xs text-[var(--color-forest-ink)]/70 mt-1 font-mono">
              You are currently using guest mode. Progress is saved only in this browser. Create an account to permanently sync all attempts, bookmarks, and mistake tracking to your PostgreSQL database.
            </p>
          </div>

          <div className="rounded-xl border border-amber-300 bg-amber-50/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-sm text-[#1a3300]">Want permanent storage across devices?</div>
              <div className="text-xs text-[#1a3300]/80">Create a free account or sign in to save your history and bookmarks to PostgreSQL.</div>
            </div>
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="btn-primary !py-2 !px-4 !text-xs font-bold whitespace-nowrap self-stretch sm:self-auto text-center"
            >
              Sign In / Register
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button type="button" className="btn-primary !text-xs flex-1 sm:flex-initial text-center" onClick={exportData}>
              {t('settings.export')}
            </button>
            <label className="btn !rounded-[6px] text-xs font-semibold cursor-pointer flex-1 sm:flex-initial text-center">
              {t('settings.import')}
              <input type="file" accept="application/json" className="sr-only" ref={fileRef} onChange={importData} />
            </label>
            <button
              type="button"
              className="btn btn-danger !rounded-[6px] text-xs font-semibold flex-1 sm:flex-initial text-center"
              onClick={() => setConfirmReset(true)}
            >
              {t('settings.reset')}
            </button>
          </div>

          {importOk && <p className="chip chip-good !w-fit">{t('settings.importSuccess')}</p>}
          {importError && <p className="chip chip-bad !w-fit">{t('settings.importError', { reason: importError })}</p>}
          {resetDone && <p className="chip chip-warn !w-fit">{t('settings.resetDone')}</p>}
        </section>
      )}

      <ConfirmDialog
        open={confirmReset}
        title={user ? 'Reset Database Progress' : t('settings.resetConfirmTitle')}
        danger
        confirmLabel={t('settings.reset')}
        onCancel={() => setConfirmReset(false)}
        onConfirm={async () => {
          setConfirmReset(false)
          await resetData()
          setResetDone(true)
        }}
      >
        {user
          ? 'Are you sure you want to reset all your progress? This will permanently delete all your exam attempts, bookmarks, mistakes, and answers from the PostgreSQL database.'
          : t('settings.resetConfirmBody')}
      </ConfirmDialog>

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode="register"
      />
    </div>
  )
}
