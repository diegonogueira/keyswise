import type { ReactNode } from 'react'

interface SectionProps {
  title: string
  children: ReactNode
  help?: string
  /** ação no título (ex.: "Voltar ao nível") */
  action?: ReactNode
  /** a primeira seção dispensa a linha de cima */
  first?: boolean
  /** bolinha vermelha: esta seção tem ajustes fora do padrão */
  dot?: boolean
}

/** Um escopo do modal (Geral, o módulo, o nível): título em caixa-alta miúda e ajuda embaixo. */
export function Section({ title, children, help, action, first, dot }: SectionProps) {
  return (
    <div className={first ? '' : 'mt-2 border-t border-line pt-3'}>
      <div className="mb-1 flex items-center gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-faint">{title}</h3>
        {dot && <span aria-hidden className="h-2 w-2 rounded-full bg-wrong" />}
        {action}
      </div>
      {children}
      {help && <p className="mt-2 text-xs text-faint">{help}</p>}
    </div>
  )
}
