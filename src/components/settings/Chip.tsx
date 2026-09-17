import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'

/** Chip de seleção múltipla — o mesmo visual em toda config de lista. */
export function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cx(
        'rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
        on ? 'border-accent bg-accent-soft text-accent' : 'border-line text-muted hover:border-accent hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}
