import { useT } from '../i18n'
import type { DictKey } from '../i18n/en'

export interface BarDatum {
  domain: number
  pct: number | null
  detail?: string
}

// Say Briefly Sticky Note Accent Colors
const COLORS: Record<number, string> = {
  1: '#0d9488', // Sticky Note Teal
  2: '#16a34a', // Sticky Note Mint
  3: '#9333ea', // Sticky Note Blush
  4: '#cb5521', // Terracotta
}

export function DomainChart({ data }: { data: BarDatum[] }) {
  const { t } = useT()
  return (
    <ul className="grid gap-4 list-none p-0">
      {data.map((d) => {
        const label = t(`domain.${d.domain}` as DictKey)
        const pct = d.pct ?? 0
        return (
          <li key={d.domain}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
              <span className="font-semibold text-[var(--color-forest-ink)]">{label}</span>
              <span className="text-[var(--color-forest-ink)]/70 text-xs font-mono font-semibold tabular-nums">
                {d.pct === null ? '—' : `${d.pct}%`}
                {d.detail ? ` · ${d.detail}` : ''}
              </span>
            </div>
            <div
              role="meter"
              aria-label={label}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              className="h-2.5 overflow-hidden rounded-full bg-[var(--surface-2)] border border-[var(--color-pencil-gray)]/50"
            >
              <div
                className="grow-x h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: COLORS[d.domain] }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
