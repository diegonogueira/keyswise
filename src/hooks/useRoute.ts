import { useCallback, useEffect, useState } from 'react'
import {
  ABOUT_PATH,
  DEFAULT_ROUTE,
  OTHER_APPS_PATH,
  isAboutPath,
  isOtherAppsPath,
  parseRoute,
  pathForRoute,
  routeFromPath,
  type Route,
} from '../lib/routes'

/** Último destino aberto: não é escolha de treino, é onde o usuário parou. */
const LAST_KEY = 'keyswise-module'

function lastRoute(): Route {
  try {
    return parseRoute(localStorage.getItem(LAST_KEY)) ?? DEFAULT_ROUTE
  } catch {
    return DEFAULT_ROUTE // localStorage bloqueado: segue sem memória
  }
}

/** O estudo (um exercício ou o dicionário) ou uma das páginas do menu. */
export type View = 'practice' | 'about' | 'otherApps'

/** As páginas que não são destino de estudo, cada uma no seu caminho. */
const PAGES: { view: View; path: string; is: (p: string) => boolean }[] = [
  { view: 'about', path: ABOUT_PATH, is: isAboutPath },
  { view: 'otherApps', path: OTHER_APPS_PATH, is: isOtherAppsPath },
]

const viewOf = (pathname: string): View => PAGES.find((p) => p.is(pathname))?.view ?? 'practice'

export interface RouteState {
  route: Route
  view: View
  /** abre um destino de estudo (também é como se sai das páginas do menu) */
  navigate: (route: Route) => void
  /** abre uma das páginas do menu (Sobre, Outros apps) */
  openPage: (view: Exclude<View, 'practice'>) => void
}

/**
 * Roteamento mínimo via History API: a URL é a fonte da verdade do destino ativo. Suporta
 * deep-link, voltar/avançar do navegador e canoniza a URL inicial sem poluir o histórico. Sem
 * destino na URL — "/", que é como o app Android sempre abre — volta ao último aberto. Nas
 * páginas do menu (`/about`, `/other-apps`) o destino continua o último, que é para onde se volta
 * — e nenhuma delas é guardada como destino.
 */
export function useRoute(): RouteState {
  const [route, setRoute] = useState<Route>(() => routeFromPath(window.location.pathname, lastRoute()))
  const [view, setView] = useState<View>(() => viewOf(window.location.pathname))

  useEffect(() => {
    const here = window.location.pathname
    const page = PAGES.find((p) => p.is(here))
    const canonical = page ? page.path : pathForRoute(routeFromPath(here, lastRoute()))
    if (here !== canonical) window.history.replaceState(null, '', canonical + window.location.search)
    const sync = () => {
      const path = window.location.pathname
      if (!PAGES.some((p) => p.is(path))) setRoute(routeFromPath(path, lastRoute()))
      setView(viewOf(path))
    }
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(LAST_KEY, route)
    } catch {
      /* sem armazenamento: o próximo início cai no padrão */
    }
  }, [route])

  const navigate = useCallback((next: Route) => {
    const path = pathForRoute(next)
    if (window.location.pathname !== path) window.history.pushState(null, '', path)
    setRoute(next)
    setView('practice')
  }, [])

  const openPage = useCallback((next: Exclude<View, 'practice'>) => {
    const path = PAGES.find((p) => p.view === next)!.path
    if (window.location.pathname !== path) window.history.pushState(null, '', path)
    setView(next)
  }, [])

  return { route, view, navigate, openPage }
}
