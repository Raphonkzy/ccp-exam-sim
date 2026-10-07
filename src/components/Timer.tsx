import { useEffect, useState } from 'react'
import { formatDuration } from '../lib/stats'

/** Returns remaining seconds until `deadline` (ms epoch), ticking every second. Fires onExpire once. */
export function useCountdown(deadline: number | null, onExpire: () => void): number {
  const calc = () => (deadline === null ? 0 : Math.max(0, Math.ceil((deadline - Date.now()) / 1000)))
  const [left, setLeft] = useState(calc)

  useEffect(() => {
    if (deadline === null) return
    let fired = false
    const tick = () => {
      const v = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setLeft(v)
      if (v === 0 && !fired) { fired = true; onExpire() }
    }
    tick()
    const h = window.setInterval(tick, 1000)
    return () => window.clearInterval(h)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline])

  return left
}

export function Timer({ seconds, label }: { seconds: number; label: string }) {
  const low = seconds <= 300
  return (
    <div
      className={`chip ${low ? 'chip-bad' : ''} !px-3 !py-1.5 !text-sm tabular-nums`}
      role="timer"
      aria-label={`${label}: ${formatDuration(seconds)}`}
    >
      <svg className="h-4 w-4 inline-block -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>{' '}
      {formatDuration(seconds)}
    </div>
  )
}
