import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TopBar } from './components/TopBar'
import { SettingsPanel } from './components/Settings'
import { Sidebar } from './components/Sidebar'
import { ExerciseView } from './components/ExerciseView'
import { Dictionary } from './components/Dictionary'
import { AboutPage } from './components/About'
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
  const { route, view, navigate, openAbout } = useRoute()
  const audioEnabled = useSettings((s) => s.audioEnabled)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // celular deitado: layout compacto, o teclado manda na tela
  const compact = useShortLandscape()

  // no Android: status bar escondida na paisagem, visível (sem cobrir) no retrato
  useEffect(() => {
    void syncStatusBar(compact)
  }, [compact])

  // pré-carrega o piano para a primeira nota soar sem atraso
  useEffect(() => {
    if (audioEnabled) void loadInstrument()
  }, [audioEnabled])

  const title = view === 'about' ? t('about.title') : t(ROUTE_KEYS[route])
  // título da aba: o app e o que está aberto, no idioma corrente
  useEffect(() => {
    document.title = `Keyswise — ${title}`
  }, [title, i18n.language])

  return (
    <div
      // A tela é uma só, em qualquer orientação: a altura é a da janela e quem rola é o
      // conteúdo, por dentro. Deixar a página crescer empurra os controles para fora da tela.
      className="flex h-[100dvh] flex-col overflow-hidden"
      // a barra de gestos do Android é desenhada SOBRE o fim da WebView
      style={{ paddingBottom: 'var(--safe-area-inset-bottom, env(safe-area-inset-bottom))' }}
    >
      {/* faixa que reserva a status bar no retrato (o Android 15+ desenha edge-to-edge): o
          relógio e a bateria ficam sobre o fundo do app. Na paisagem o inset vira 0 e ela some. */}
      <div
        aria-hidden
        className="fixed inset-x-0 top-0 z-40"
        style={{
          height: 'var(--safe-area-inset-top, env(safe-area-inset-top))',
          backgroundColor: 'var(--color-bg)',
        }}
      />
      {/* a barra fica também na paisagem curta, só mais fina: é por ela que se chega ao menu e
          aos ajustes com o celular deitado */}
      <TopBar
        title={title}
        compact={compact}
        onOpenSettings={() => setSettingsOpen(true)}
        onToggleSidebar={() => setSidebarOpen(true)}
      />

      <div className="flex min-h-0 flex-1">
        <Sidebar
          route={route}
          onSelect={navigate}
          about={view === 'about'}
          onAbout={openAbout}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          compact={compact}
        />

        {view === 'about' ? (
          <main className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
            <AboutPage onBack={() => navigate(route)} />
          </main>
        ) : (
          // O exercício ocupa o centro da altura livre. O nome do destino vive na TopBar (e aqui
          // só para leitores de tela). `justify-center-safe` centraliza sem cortar o começo — o
          // dicionário, que é longo, começa no topo e rola por dentro.
          <main
            className={cx(
              'mx-auto flex w-full min-w-0 max-w-3xl flex-1 flex-col justify-center-safe overflow-y-auto',
              compact ? 'gap-2 px-2 py-1' : 'gap-4 px-4 py-5',
            )}
          >
            <h1 className="sr-only">{title}</h1>
            {isExerciseMode(route) ? (
              <ExerciseView mode={route} compact={compact} />
            ) : (
              <Dictionary compact={compact} />
            )}
          </main>
        )}
      </div>

      {settingsOpen && <SettingsPanel route={route} onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
