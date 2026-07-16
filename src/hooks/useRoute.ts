import { useCallback, useEffect, useState } from 'react'
import type { ExerciseMode } from '../core/exercise'
import { modeFromPath, pathForMode } from '../lib/routes'

/**
 * Roteamento mínimo via History API: a URL é a fonte da verdade do modo ativo. Suporta
 * deep-link, voltar/avançar do navegador e canoniza a URL inicial sem poluir o histórico.
 */
export function useRoute(): [ExerciseMode, (mode: ExerciseMode) => void] {
  const [mode, setMode] = useState<ExerciseMode>(() => modeFromPath(window.location.pathname))

  useEffect(() => {
    const canonical = pathForMode(modeFromPath(window.location.pathname))
    if (window.location.pathname !== canonical) {
      window.history.replaceState(null, '', canonical)
    }
    const sync = () => setMode(modeFromPath(window.location.pathname))
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  const navigate = useCallback((next: ExerciseMode) => {
    const path = pathForMode(next)
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path)
    }
    setMode(next)
  }, [])

  return [mode, navigate]
}
