import { Music2, Grid2x2, BookOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Route } from '../lib/routes'
import { setLanguage } from '../i18n'
import { cx } from '../lib/cx'

interface SidebarProps {
  route: Route
  onSelect: (r: Route) => void
  /** drawer aberto (apenas mobile) */
  open: boolean
  onClose: () => void
}

interface Item {
  route: Route
  icon: typeof Music2
}

const GROUPS: { titleKey: string; items: Item[] }[] = [
  {
    titleKey: 'nav.group.voicings',
    items: [
      { route: 'keysToSymbol', icon: Music2 },
      { route: 'symbolToKeys', icon: Grid2x2 },
    ],
  },
  {
    titleKey: 'nav.group.reference',
    items: [{ route: 'dictionary', icon: BookOpen }],
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

function Nav({ route, onSelect }: { route: Route; onSelect: (r: Route) => void }) {
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
              const active = route === item.route
              const Icon = item.icon
              return (
                <li key={item.route}>
                  <button
                    type="button"
                    onClick={() => onSelect(item.route)}
                    aria-current={active ? 'page' : undefined}
                    className={cx(
                      'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                      active
                        ? 'bg-accent-soft font-medium text-accent'
                        : 'text-muted hover:bg-line hover:text-ink',
                    )}
                  >
                    <Icon size={16} className="shrink-0" />
                    {t(`nav.item.${item.route}`)}
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

export function Sidebar({ route, onSelect, open, onClose }: SidebarProps) {
  return (
    <>
      {/* coluna fixa em telas largas (desktop) */}
      <aside className="hidden w-60 shrink-0 border-r border-line bg-surface lg:block">
        <div className="sticky top-[57px] p-3">
          <Nav route={route} onSelect={onSelect} />
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
              route={route}
              onSelect={(r) => {
                onSelect(r)
                onClose()
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}
