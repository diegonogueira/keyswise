import { Music2, Grid2x2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ExerciseMode } from '../core/exercise'
import { setLanguage } from '../i18n'
import { cx } from '../lib/cx'

interface SidebarProps {
  mode: ExerciseMode
  onSelect: (m: ExerciseMode) => void
  /** drawer aberto (apenas mobile) */
  open: boolean
  onClose: () => void
}

interface Item {
  mode: ExerciseMode
  icon: typeof Music2
}

const GROUPS: { titleKey: string; items: Item[] }[] = [
  {
    titleKey: 'nav.group.voicings',
    items: [
      { mode: 'keysToSymbol', icon: Music2 },
      { mode: 'symbolToKeys', icon: Grid2x2 },
    ],
  },
]

function LangSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.language === 'en' ? 'en' : 'pt'
  return (
    <div className="border-t border-line pt-3">
      <div className="flex gap-1 px-1">
        {(['pt', 'en'] as const).map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => setLanguage(lang)}
            className={cx(
              'rounded-md px-2.5 py-1 text-xs font-medium uppercase transition-colors',
              current === lang ? 'bg-accent-soft text-accent' : 'text-faint hover:text-ink',
            )}
          >
            {lang.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  )
}

function Nav({ mode, onSelect }: { mode: ExerciseMode; onSelect: (m: ExerciseMode) => void }) {
  const { t } = useTranslation()
  return (
    <nav className="flex flex-col gap-5">
      {GROUPS.map((group) => (
        <div key={group.titleKey}>
          <h2 className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-faint">
            {t(group.titleKey)}
          </h2>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = mode === item.mode
              const Icon = item.icon
              return (
                <li key={item.mode}>
                  <button
                    type="button"
                    onClick={() => onSelect(item.mode)}
                    aria-current={active ? 'page' : undefined}
                    className={cx(
                      'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                      active
                        ? 'bg-accent-soft font-medium text-accent'
                        : 'text-muted hover:bg-line hover:text-ink',
                    )}
                  >
                    <Icon size={16} className="shrink-0" />
                    {t(`nav.item.${item.mode}`)}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
      <LangSwitcher />
    </nav>
  )
}

export function Sidebar({ mode, onSelect, open, onClose }: SidebarProps) {
  return (
    <>
      {/* coluna fixa em telas largas (desktop) */}
      <aside className="hidden w-60 shrink-0 border-r border-line bg-surface lg:block">
        <div className="sticky top-[57px] p-3">
          <Nav mode={mode} onSelect={onSelect} />
        </div>
      </aside>

      {/* drawer deslizante no mobile/tablet */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={onClose} />
          <div
            className="absolute inset-y-0 left-0 w-64 overflow-y-auto bg-surface px-3 shadow-xl"
            style={{
              paddingTop: 'calc(var(--safe-area-inset-top, env(safe-area-inset-top)) + 0.75rem)',
              paddingBottom: 'calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom)) + 0.75rem)',
            }}
          >
            <Nav
              mode={mode}
              onSelect={(m) => {
                onSelect(m)
                onClose()
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}
