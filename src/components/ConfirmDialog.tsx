import { useEffect, useRef, type ReactNode } from 'react'
import { useT } from '../i18n'

interface Props {
  open: boolean
  title: string
  children?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Accessible modal built on the native <dialog> element (focus trap + Esc handled by the browser). */
export function ConfirmDialog({ open, title, children, confirmLabel, cancelLabel, danger, onConfirm, onCancel }: Props) {
  const { t } = useT()
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onCancel={(e) => { e.preventDefault(); onCancel() }}
      aria-labelledby="dialog-title"
      className="m-auto w-[min(92vw,28rem)] rounded-xl border p-0 shadow-lg backdrop:bg-black/40 backdrop:backdrop-blur-sm"
      style={{ background: 'var(--surface-cream)', color: 'var(--text)', borderColor: 'var(--color-pencil-gray)' }}
    >
      <div className="p-6">
        <h2 id="dialog-title" className="h2 mb-2 text-[var(--color-forest-ink)]">{title}</h2>
        <div className="mb-6 text-xs text-[var(--color-forest-ink)]/75 leading-relaxed">{children}</div>
        <div className="flex justify-end gap-2.5">
          <button type="button" className="btn !rounded-[6px] text-xs font-semibold" onClick={onCancel}>{cancelLabel ?? t('common.cancel')}</button>
          <button type="button" className={`btn !rounded-[6px] text-xs font-semibold ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} autoFocus>
            {confirmLabel ?? t('common.confirm')}
          </button>
        </div>
      </div>
    </dialog>
  )
}
