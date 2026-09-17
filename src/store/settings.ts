import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import { EXERCISE_MODES, type ExerciseMode } from '../core/exercise'
import { VOICING_STYLES } from '../core/voicings'

/** Fundamental das questões: fixa em C ou sorteada (e anunciada) a cada questão. */
export type RootMode = 'C' | 'random'

/** Configs que cada módulo lembra separadamente. */
export interface ModuleConfig {
  /** mostra o nome das notas do voicing sobre as teclas */
  showNoteName: boolean
}

const DEFAULT_MODULE: ModuleConfig = { showNoteName: false }

function modulesFrom(seed: ModuleConfig): Record<ExerciseMode, ModuleConfig> {
  return Object.fromEntries(EXERCISE_MODES.map((m) => [m, { ...seed }])) as Record<
    ExerciseMode,
    ModuleConfig
  >
}

/**
 * Aplica um patch à config de um módulo, sempre preenchendo campos ausentes com
 * `DEFAULT_MODULE` — resiliente a `modules` corrompido (null) vindo do localStorage.
 */
function patchModule(
  modules: Record<ExerciseMode, ModuleConfig> | undefined,
  mode: ExerciseMode,
  patch: Partial<ModuleConfig>,
): Record<ExerciseMode, ModuleConfig> {
  const next = { ...modulesFrom(DEFAULT_MODULE), ...modules }
  next[mode] = { ...DEFAULT_MODULE, ...modules?.[mode], ...patch }
  return next
}

/** Os ajustes gerais de fábrica (valem para o app inteiro). */
const GENERAL_DEFAULTS = {
  audioEnabled: true,
  rootMode: 'C' as RootMode,
}

/**
 * Os acordes e estilos de fábrica. Os dois exercícios dividem essa escolha e ela só aparece na
 * seção deles, então "Restaurar padrões" num exercício também a devolve ao padrão.
 */
function voicingDefaults() {
  return { chordCategories: ['triads'], voicingStyles: [...VOICING_STYLES] as string[] }
}

interface SettingsState {
  // --- globais ---
  audioEnabled: boolean
  // --- por módulo ---
  modules: Record<ExerciseMode, ModuleConfig>
  // --- módulo Voicings ---
  /** ids das categorias de acorde habilitadas (ao menos uma; ver CHORD_CATEGORIES) */
  chordCategories: string[]
  /** ids dos estilos de voicing habilitados (ao menos um; ver VOICING_STYLES) */
  voicingStyles: string[]
  /** fundamental das questões: C fixo ou aleatória anunciada */
  rootMode: RootMode
  setAudioEnabled: (v: boolean) => void
  setShowNoteName: (mode: ExerciseMode, v: boolean) => void
  toggleChordCategory: (id: string) => void
  toggleVoicingStyle: (id: string) => void
  setRootMode: (v: RootMode) => void
  /**
   * "Restaurar padrões" de um exercício: o nome das notas dele e os acordes e estilos (que só
   * aparecem na seção dos exercícios). O som, a fundamental e o outro exercício ficam.
   */
  resetModule: (mode: ExerciseMode) => void
  /** "Redefinir tudo": ajustes gerais, os dois exercícios, acordes e estilos. O idioma fica */
  resetAll: () => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...GENERAL_DEFAULTS,
      modules: modulesFrom(DEFAULT_MODULE),
      ...voicingDefaults(),
      setAudioEnabled: (audioEnabled) => set({ audioEnabled }),
      setShowNoteName: (mode, showNoteName) =>
        set((s) => ({ modules: patchModule(s.modules, mode, { showNoteName }) })),
      // mantém ao menos uma categoria selecionada
      toggleChordCategory: (id) =>
        set((s) => {
          const has = s.chordCategories.includes(id)
          const next = has ? s.chordCategories.filter((c) => c !== id) : [...s.chordCategories, id]
          return { chordCategories: next.length ? next : s.chordCategories }
        }),
      // mantém ao menos um estilo selecionado
      toggleVoicingStyle: (id) =>
        set((s) => {
          const has = s.voicingStyles.includes(id)
          const next = has ? s.voicingStyles.filter((c) => c !== id) : [...s.voicingStyles, id]
          return { voicingStyles: next.length ? next : s.voicingStyles }
        }),
      setRootMode: (rootMode) => set({ rootMode }),
      resetModule: (mode) =>
        set((s) => ({ modules: patchModule(s.modules, mode, DEFAULT_MODULE), ...voicingDefaults() })),
      resetAll: () => set({ ...GENERAL_DEFAULTS, modules: modulesFrom(DEFAULT_MODULE), ...voicingDefaults() }),
    }),
    {
      name: 'keyswise-settings',
      version: 1,
    },
  ),
)

/** Config do módulo ativo, com backfill de campos ausentes (seguro para estados persistidos). */
export function useModuleConfig(mode: ExerciseMode): ModuleConfig {
  return useSettings(useShallow((s) => ({ ...DEFAULT_MODULE, ...s.modules?.[mode] })))
}
