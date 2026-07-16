import { useEffect, useRef, useState } from 'react'

/**
 * Esconde um elemento sticky/fixo conforme a direção do scroll, igual ao header do navegador
 * no mobile: rolar pra baixo esconde; rolar pra cima mostra. Sempre visível perto do topo.
 * Ativo só abaixo de `lg` (1024px) — no desktop o header fica sempre visível.
 */
export function useHideOnScroll(threshold = 8): boolean {
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)')

    const onScroll = () => {
      if (desktop.matches) {
        setHidden(false)
        return
      }
      const y = window.scrollY
      if (y < 64) {
        setHidden(false)
        lastY.current = y
        return
      }
      const delta = y - lastY.current
      if (Math.abs(delta) < threshold) return
      setHidden(delta > 0)
      lastY.current = y
    }

    const onChange = () => {
      if (desktop.matches) setHidden(false)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    desktop.addEventListener('change', onChange)
    return () => {
      window.removeEventListener('scroll', onScroll)
      desktop.removeEventListener('change', onChange)
    }
  }, [threshold])

  return hidden
}
