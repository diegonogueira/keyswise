import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TopBar } from './components/TopBar'
import { SettingsPanel } from './components/Settings'
import { Sidebar } from './components/Sidebar'
import { ExerciseView } from './components/ExerciseView'
import { Dictionary } from './components/Dictionary'
import { useSettings } from './store/settings'
import { useRoute } from './hooks/useRoute'
import { useShortLandscape } from './hooks/useMediaQuery'
import { cx } from './lib/cx'
import { isExerciseMode, type Route } from './lib/routes'
import { loadInstrument } from './audio/player'
import { syncStatusBar } from './native/statusBar'

// Guard de exaustividade em tempo de compilação: um novo Route sem chave de tradução aqui
// quebra o build.
const ROUTE_KEYS: Record<Route, string> = {
  keysToSymbol: 'nav.item.keysToSymbol',
  symbolToKeys: 'nav.item.symbolToKeys',
  dictionary: 'nav.item.dictionary',
}

export default function App() {
  const { t, i18n } = useTranslation()
  const [route, navigate] = useRoute()
  const audioEnabled = useSettings((s) => s.audioEnabled)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const compact = useShortLandscape()
  const [headerHidden, setHeaderHidden] = useState(() => compact)
  const hideHeader = headerHidden

  useEffect(() => {
    setHeaderHidden(compact)
  }, [compact])

  useEffect(() => {
    if (compact) setHeaderHidden(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route])

  useEffect(() => {
    void syncStatusBar(compact)
  }, [compact])

  useEffect(() => {
    if (audioEnabled) void loadInstrument()
  }, [audioEnabled])

  useEffect(() => {
    document.title = `Keyswise — ${t(ROUTE_KEYS[route])}`
  }, [route, t, i18n.language])

  return (
    <div className={cx('flex flex-col', compact ? 'h-[100dvh] overflow-hidden' : 'min-h-screen')}>
      <div
        aria-hidden
        className="fixed inset-x-0 top-0 z-20"
        style={{
          height: 'var(--safe-area-inset-top, env(safe-area-inset-top))',
          backgroundColor: 'var(--color-bg)',
        }}
      />
      {!hideHeader && (
        <TopBar
          onOpenSettings={() => setSettingsOpen(true)}
          onToggleSidebar={() => setSidebarOpen(true)}
          compact={compact}
          modeTitle={t(ROUTE_KEYS[route])}
          onHide={compact ? () => setHeaderHidden(true) : undefined}
        />
      )}

      {hideHeader && (
        <button
          type="button"
          onClick={() => setHeaderHidden(false)}
          aria-label={t('topbar.aria.showBar')}
          className="fixed right-3 top-[calc(env(safe-area-inset-top)_+_0.75rem)] z-50 rounded-full border border-line bg-surface/80 p-2 text-muted shadow-sm backdrop-blur transition-colors hover:bg-line hover:text-ink"
        >
          <ChevronDown size={18} />
        </button>
      )}

      <div className="flex min-h-0 flex-1">
        <Sidebar
          route={route}
          onSelect={navigate}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main
          className={cx(
            'mx-auto flex w-full max-w-3xl flex-1 flex-col px-4',
            compact ? 'min-h-0 gap-2 overflow-y-auto py-2' : 'gap-4 py-5 landscape:py-3',
          )}
        >
          <h1 className={cx('font-semibold text-ink', compact ? 'sr-only' : 'text-sm')}>
            {t(ROUTE_KEYS[route])}
          </h1>

          {isExerciseMode(route) ? (
            <ExerciseView mode={route} compact={compact} />
          ) : (
            <Dictionary compact={compact} />
          )}
        </main>
      </div>

      {settingsOpen && <SettingsPanel route={route} onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
