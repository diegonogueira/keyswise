import type { ReactNode } from 'react'

/** Uma linha do modal: rótulo (com dica opcional) à esquerda, o controle à direita. */
export function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-sm text-muted">
        {label}
        {hint && <span className="mt-0.5 block text-xs text-faint">{hint}</span>}
      </span>
      {children}
    </div>
  )
}
