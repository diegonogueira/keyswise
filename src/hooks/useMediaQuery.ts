import { useEffect, useState } from 'react'

/** Reage a uma media query, re-renderizando quando ela passa a casar (ou não). */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    if (mql.addEventListener) {
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    }
    mql.addListener(onChange)
    return () => mql.removeListener(onChange)
  }, [query])

  return matches
}

/**
 * Paisagem "curta": celular deitado, onde a **altura** é o recurso escasso. O teto de altura
 * exclui o desktop (também paisagem, mas alto) e o teto de largura exclui janelas largas e
 * baixas. Dispara o layout compacto que cabe numa tela só. `1023.98px` = logo abaixo de `lg`.
 */
export function useShortLandscape(): boolean {
  return useMediaQuery(
    '(orientation: landscape) and (max-height: 600px) and (max-width: 1023.98px)',
  )
}
