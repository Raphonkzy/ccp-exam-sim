import { useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { useT } from '../i18n'
import type { AppData } from '../types/progress'
import { ConfirmDialog } from '../components/ConfirmDialog'

export default function Settings() {
  const { t } = useT()
  const { data, replaceData, resetData } = useApp()
  const [importError, setImportError] = useState<string | null>(null)
  const [importOk, setImportOk] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `clf02-backup-${new Date().toISOString().slice(0, 10)}.json`
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
        if (!parsed.sessions || !parsed.answers) throw new Error('missing sessions or answers')
        replaceData(parsed)
        setImportOk(true)
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
        <p className="text-sm text-[var(--color-forest-ink)]/70 mt-1">Manage your study progress data, exports, and local backups</p>
      </div>

      {/* Data */}
      <section className="card grid gap-4" aria-labelledby="data-h">
        <h2 id="data-h" className="h2 text-[var(--color-forest-ink)]">{t('settings.data')}</h2>
        <p className="text-xs text-[var(--color-forest-ink)]/70 font-mono">{t('settings.dataHelp')}</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-primary" onClick={exportData}>{t('settings.export')}</button>
          <label className="btn !rounded-[6px] text-xs font-semibold cursor-pointer">
            {t('settings.import')}
            <input type="file" accept="application/json" className="sr-only" ref={fileRef} onChange={importData} />
          </label>
          <button type="button" className="btn btn-danger !rounded-[6px] text-xs font-semibold" onClick={() => setConfirmReset(true)}>{t('settings.reset')}</button>
        </div>
        {importOk && <p className="chip chip-good !w-fit">{t('settings.importSuccess')}</p>}
        {importError && <p className="chip chip-bad !w-fit">{t('settings.importError', { reason: importError })}</p>}
        {resetDone && <p className="chip chip-warn !w-fit">{t('settings.resetDone')}</p>}
      </section>

      <ConfirmDialog
        open={confirmReset}
        title={t('settings.resetConfirmTitle')}
        danger
        confirmLabel={t('settings.reset')}
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => { setConfirmReset(false); resetData(); setResetDone(true) }}
      >
        {t('settings.resetConfirmBody')}
      </ConfirmDialog>
    </div>
  )
}
