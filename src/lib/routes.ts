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

/** Destino da primeira visita: a URL não aponta para nenhum e ainda não há um último aberto. */
export const DEFAULT_ROUTE: Route = 'keysToSymbol'

const PATH_ROUTE = Object.fromEntries(
  (Object.entries(ROUTE_PATH) as [Route, string][]).map(([route, path]) => [path, route]),
) as Record<string, Route>

const clean = (pathname: string) => pathname.replace(/\/+$/, '') || '/'

/**
 * Resolve um pathname para o destino correspondente. Um caminho que não é de destino ("/", um
 * link velho) cai no `fallback` — o último destino aberto, quando houver.
 */
export function routeFromPath(pathname: string, fallback: Route = DEFAULT_ROUTE): Route {
  return PATH_ROUTE[clean(pathname)] ?? fallback
}

/** Valida um id guardado: um destino que deixou de existir vira `null`. */
export function parseRoute(id: string | null): Route | null {
  return id !== null && Object.hasOwn(ROUTE_PATH, id) ? (id as Route) : null
}

/** Caminho canônico de um destino. */
export function pathForRoute(route: Route): string {
  return ROUTE_PATH[route]
}

/** O destino é um modo de exercício (e não a página de dicionário)? */
export function isExerciseMode(route: Route): route is ExerciseMode {
  return (EXERCISE_MODES as readonly string[]).includes(route)
}

/** A página "Sobre": não é destino de estudo, e o destino aberto continua o de antes. */
export const ABOUT_PATH = '/about'

export function isAboutPath(pathname: string): boolean {
  return clean(pathname) === ABOUT_PATH
}
