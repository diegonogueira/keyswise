import { useEffect, useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TopBar } from './components/TopBar'
import { SettingsPanel } from './components/Settings'
import { Sidebar } from './components/Sidebar'
import { Piano, type KeyPin } from './components/Piano/Piano'
import { ExercisePanel } from './components/ExercisePanel'
import { useSettings, useModuleConfig } from './store/settings'
import { useExercise } from './hooks/useExercise'
import { useRoute } from './hooks/useRoute'
import { useShortLandscape } from './hooks/useMediaQuery'
import { cx } from './lib/cx'
import { usesPiano, type ExerciseMode, type VoicingConfig } from './core/exercise'
import { qualityIdsForCategories } from './core/voicings'
import { windowFor } from './core/piano'
import { noteName } from './core/notes'
import { playMidi, loadInstrument } from './audio/player'
import { syncStatusBar } from './native/statusBar'

// Guard de exaustividade em tempo de compilação: um novo ExerciseMode sem chave de tradução
// aqui quebra o build.
const MODE_KEYS: Record<ExerciseMode, string> = {
  keysToSymbol: 'nav.item.keysToSymbol',
  symbolToKeys: 'nav.item.symbolToKeys',
}

export default function App() {
  const { t, i18n } = useTranslation()
  const [mode, navigate] = useRoute()
  const audioEnabled = useSettings((s) => s.audioEnabled)
  const { showNoteName } = useModuleConfig(mode)
  const chordCategories = useSettings((s) => s.chordCategories)
  const voicingStyles = useSettings((s) => s.voicingStyles)
  const rootMode = useSettings((s) => s.rootMode)
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
  }, [mode])

  useEffect(() => {
    void syncStatusBar(compact)
  }, [compact])

  // identidade estável: regenera a questão só quando a config muda de fato
  const config = useMemo<VoicingConfig>(
    () => ({
      qualities: qualityIdsForCategories(chordCategories),
      styles: voicingStyles,
      fixedRootPc: rootMode === 'C' ? 0 : null,
    }),
    [chordCategories, voicingStyles, rootMode],
  )

  const exercise = useExercise({
    mode,
    config,
    onReveal: (midi) => {
      if (!audioEnabled) return
      void playMidi(midi)
    },
  })
  const { status, question } = exercise

  useEffect(() => {
    if (audioEnabled) void loadInstrument()
  }, [audioEnabled])

  useEffect(() => {
    document.title = `Keyswise — ${t(MODE_KEYS[mode])}`
  }, [mode, t, i18n.language])

  // O teclado principal aparece só no modo Teclas → Cifra (mostra o voicing a identificar).
  // No modo Cifra → Teclas as alternativas (teclados) ficam no painel.
  const showMainPiano = usesPiano(mode) && mode === 'keysToSymbol'
  const answered = status !== 'idle'
  const [lo, hi] = windowFor(question.voicing)
  const pins: KeyPin[] =
    mode === 'keysToSymbol'
      ? question.voicing.map((m) => ({
          midi: m,
          variant: 'accent',
          label: showNoteName || answered ? noteName(m) : undefined,
        }))
      : []
  const focusMidis = mode === 'keysToSymbol' ? question.voicing : []

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
          modeTitle={t(MODE_KEYS[mode])}
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
          mode={mode}
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
            {t(MODE_KEYS[mode])}
          </h1>

          {showMainPiano && (
            <div
              className={cx(
                'shrink-0 rounded-2xl border border-line bg-surface',
                compact ? 'p-2' : 'p-3 sm:p-4',
              )}
            >
              <Piano
                lo={lo}
                hi={hi}
                pins={pins}
                density={compact ? 'compact' : 'comfortable'}
                focusMidis={focusMidis}
              />
            </div>
          )}

          <ExercisePanel exercise={exercise} compact={compact} />
        </main>
      </div>

      {settingsOpen && <SettingsPanel mode={mode} onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
