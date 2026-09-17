// Mapa entre cada destino do app e sua URL (em inglês). A URL é a fonte da verdade do
// destino ativo — ver `src/hooks/useRoute.ts`. Caminhos novos entram aqui e em lugar nenhum
// mais. Um destino é um modo de exercício OU uma página de referência (o dicionário).
import { EXERCISE_MODES, type ExerciseMode } from '../core/exercise'

/** Destino ativo: um modo de exercício ou a página de dicionário (referência). */
export type Route = ExerciseMode | 'dictionary'

/** Caminho canônico (kebab-case, em inglês) de cada destino. */
export const ROUTE_PATH: Record<Route, string> = {
  keysToSymbol: '/keys-to-chord',
  symbolToKeys: '/chord-to-keys',
  dictionary: '/dictionary',
}

/** Destino aberto quando a URL não aponta para nenhum (ex.: "/" na primeira visita). */
export const DEFAULT_ROUTE: Route = 'keysToSymbol'

const PATH_ROUTE = Object.fromEntries(
  (Object.entries(ROUTE_PATH) as [Route, string][]).map(([route, path]) => [path, route]),
) as Record<string, Route>

/** Resolve um pathname para o destino correspondente (cai no padrão se desconhecido). */
export function routeFromPath(pathname: string): Route {
  const clean = pathname.replace(/\/+$/, '') || '/'
  return PATH_ROUTE[clean] ?? DEFAULT_ROUTE
}

/** Caminho canônico de um destino. */
export function pathForRoute(route: Route): string {
  return ROUTE_PATH[route]
}

/** O destino é um modo de exercício (e não a página de dicionário)? */
export function isExerciseMode(route: Route): route is ExerciseMode {
  return (EXERCISE_MODES as readonly string[]).includes(route)
}
