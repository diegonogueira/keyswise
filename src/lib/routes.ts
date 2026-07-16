// Mapa entre cada modo de treino e sua URL (em inglês). A URL é a fonte da verdade do modo
// ativo — ver `src/hooks/useRoute.ts`. Caminhos novos entram aqui e em lugar nenhum mais.
import type { ExerciseMode } from '../core/exercise'

/** Caminho canônico (kebab-case, em inglês) de cada modo. */
export const MODE_PATH: Record<ExerciseMode, string> = {
  keysToSymbol: '/keys-to-chord',
  symbolToKeys: '/chord-to-keys',
}

/** Modo aberto quando a URL não aponta para nenhum (ex.: "/" na primeira visita). */
export const DEFAULT_MODE: ExerciseMode = 'keysToSymbol'

const PATH_MODE = Object.fromEntries(
  (Object.entries(MODE_PATH) as [ExerciseMode, string][]).map(([mode, path]) => [path, mode]),
) as Record<string, ExerciseMode>

/** Resolve um pathname para o modo correspondente (cai no padrão se desconhecido). */
export function modeFromPath(pathname: string): ExerciseMode {
  const clean = pathname.replace(/\/+$/, '') || '/'
  return PATH_MODE[clean] ?? DEFAULT_MODE
}

/** Caminho canônico de um modo. */
export function pathForMode(mode: ExerciseMode): string {
  return MODE_PATH[mode]
}
