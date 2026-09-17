import { useCallback, useEffect, useState } from 'react'
import { pathForRoute, routeFromPath, type Route } from '../lib/routes'

/**
 * Roteamento mínimo via History API: a URL é a fonte da verdade do destino ativo. Suporta
 * deep-link, voltar/avançar do navegador e canoniza a URL inicial sem poluir o histórico.
 */
export function useRoute(): [Route, (route: Route) => void] {
  const [route, setRoute] = useState<Route>(() => routeFromPath(window.location.pathname))

  useEffect(() => {
    const canonical = pathForRoute(routeFromPath(window.location.pathname))
    if (window.location.pathname !== canonical) {
      window.history.replaceState(null, '', canonical)
    }
    const sync = () => setRoute(routeFromPath(window.location.pathname))
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  const navigate = useCallback((next: Route) => {
    const path = pathForRoute(next)
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path)
    }
    setRoute(next)
  }, [])

  return [route, navigate]
}
