import { useCallback, useEffect, useState } from 'react'
import { ABOUT_PATH, DEFAULT_ROUTE, isAboutPath, parseRoute, pathForRoute, routeFromPath, type Route } from '../lib/routes'

/** Último destino aberto: não é escolha de treino, é onde o usuário parou. */
const LAST_KEY = 'keyswise-module'

function lastRoute(): Route {
  try {
    return parseRoute(localStorage.getItem(LAST_KEY)) ?? DEFAULT_ROUTE
  } catch {
    return DEFAULT_ROUTE // localStorage bloqueado: segue sem memória
  }
}

/** O estudo (um exercício ou o dicionário) ou a página "Sobre". */
export type View = 'practice' | 'about'

const viewOf = (pathname: string): View => (isAboutPath(pathname) ? 'about' : 'practice')

export interface RouteState {
  route: Route
  view: View
  /** abre um destino de estudo (também é como se sai do "Sobre") */
  navigate: (route: Route) => void
  openAbout: () => void
}

/**
 * Roteamento mínimo via History API: a URL é a fonte da verdade do destino ativo. Suporta
 * deep-link, voltar/avançar do navegador e canoniza a URL inicial sem poluir o histórico. Sem
 * destino na URL — "/", que é como o app Android sempre abre — volta ao último aberto. Em
 * `/about` o destino continua o último, que é para onde se volta.
 */
export function useRoute(): RouteState {
  const [route, setRoute] = useState<Route>(() => routeFromPath(window.location.pathname, lastRoute()))
  const [view, setView] = useState<View>(() => viewOf(window.location.pathname))

  useEffect(() => {
    const here = window.location.pathname
    const canonical = isAboutPath(here) ? ABOUT_PATH : pathForRoute(routeFromPath(here, lastRoute()))
    if (here !== canonical) window.history.replaceState(null, '', canonical + window.location.search)
    const sync = () => {
      if (!isAboutPath(window.location.pathname)) setRoute(routeFromPath(window.location.pathname, lastRoute()))
      setView(viewOf(window.location.pathname))
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

  const openAbout = useCallback(() => {
    if (!isAboutPath(window.location.pathname)) window.history.pushState(null, '', ABOUT_PATH)
    setView('about')
  }, [])

  return { route, view, navigate, openAbout }
}
