import { useLayoutEffect, useRef } from 'react'
import {
  isBlackKey,
  keysInRange,
  whiteKeysInRange,
  keyCenterX,
  type PianoGeom,
} from '../../core/piano'

export type KeyVariant = 'accent' | 'selected' | 'correct' | 'wrong' | 'ghost'

export interface KeyPin {
  midi: number
  variant: KeyVariant
  label?: string
}

/** `compact` adensa a geometria na vertical p/ caber em paisagem curta. */
export type Density = 'comfortable' | 'compact'

interface PianoProps {
  /** menor MIDI da janela (deve ser um C) */
  lo: number
  /** maior MIDI da janela (deve ser um C) */
  hi: number
  pins?: KeyPin[]
  interactive?: boolean
  onSelect?: (midi: number) => void
  density?: Density
  /** teclas a manter à vista: o teclado rola p/ centralizá-las quando transborda. Vazio →
   *  volta o teclado p/ o começo. */
  focusMidis?: number[]
}

const GEOM: Record<Density, PianoGeom> = {
  comfortable: {
    WHITE_W: 34, WHITE_H: 132, BLACK_W: 21, BLACK_H: 84,
    PAD_TOP: 10, PAD_BOTTOM: 10, labelFont: 10, pinR: 9, pinFont: 9.5,
  },
  compact: {
    WHITE_W: 30, WHITE_H: 94, BLACK_W: 19, BLACK_H: 60,
    PAD_TOP: 8, PAD_BOTTOM: 8, labelFont: 9, pinR: 7.5, pinFont: 8.5,
  },
}

const VARIANT_STYLE: Record<KeyVariant, { fill: string; stroke: string; text: string }> = {
  accent: { fill: 'var(--color-accent)', stroke: 'var(--color-accent)', text: '#fff' },
  selected: { fill: 'var(--color-accent-soft)', stroke: 'var(--color-accent)', text: 'var(--color-accent)' },
  correct: { fill: 'var(--color-correct)', stroke: 'var(--color-correct)', text: '#fff' },
  wrong: { fill: 'var(--color-wrong)', stroke: 'var(--color-wrong)', text: '#fff' },
  ghost: { fill: 'var(--color-surface)', stroke: 'var(--color-faint)', text: 'var(--color-muted)' },
}

export function Piano({
  lo,
  hi,
  pins = [],
  interactive = false,
  onSelect,
  density = 'comfortable',
  focusMidis,
}: PianoProps) {
  const geom = GEOM[density]
  const { WHITE_W, WHITE_H, BLACK_W, BLACK_H, PAD_TOP, PAD_BOTTOM, pinR, pinFont } = geom

  const keys = keysInRange(lo, hi)
  const whites = keys.filter((m) => !isBlackKey(m))
  const blacks = keys.filter((m) => isBlackKey(m))
  const width = whiteKeysInRange(lo, hi) * WHITE_W
  const height = PAD_TOP + WHITE_H + PAD_BOTTOM

  const cx = (m: number) => keyCenterX(m, lo, geom)
  const pinByMidi = new Map(pins.map((p) => [p.midi, p]))

  // Auto-foco: centraliza as teclas destacadas quando o teclado transborda a coluna. Só rola
  // se ainda não estiverem visíveis. `useLayoutEffect` posiciona antes do paint (sem piscar).
  const scrollRef = useRef<HTMLDivElement>(null)
  const focusKey = (focusMidis ?? []).join(',')
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return

    if (!focusMidis || focusMidis.length === 0) {
      if (el.scrollLeft > 0) el.scrollTo({ left: 0, behavior: 'auto' })
      return
    }

    const intoView = () => {
      const overflow = el.scrollWidth - el.clientWidth
      if (overflow <= 1) return
      const xs = focusMidis.map((m) => cx(m))
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const margin = BLACK_W
      const visible =
        minX - margin >= el.scrollLeft && maxX + margin <= el.scrollLeft + el.clientWidth
      if (visible) return
      const left = Math.max(0, Math.min((minX + maxX) / 2 - el.clientWidth / 2, overflow))
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      el.scrollTo({ left, behavior: reduce ? 'auto' : 'smooth' })
    }

    intoView()
    const ro = new ResizeObserver(intoView)
    ro.observe(el)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, density, lo, hi])

  const pinAt = (m: number, black: boolean) => {
    const pin = pinByMidi.get(m)
    if (!pin) return null
    const style = VARIANT_STYLE[pin.variant]
    const y = black ? PAD_TOP + BLACK_H - pinR - 5 : PAD_TOP + WHITE_H - pinR - 7
    return (
      <g pointerEvents="none">
        <circle cx={cx(m)} cy={y} r={pinR} fill={style.fill} stroke={style.stroke} strokeWidth={1.5} />
        {pin.label && (
          <text
            x={cx(m)}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={pinFont}
            fontWeight={600}
            fill={style.text}
          >
            {pin.label}
          </text>
        )}
      </g>
    )
  }

  return (
    <div ref={scrollRef} className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="block shrink-0 select-none"
        role="img"
        aria-label="Teclado de piano"
      >
        {/* teclas brancas */}
        {whites.map((m) => (
          <rect
            key={`w-${m}`}
            x={cx(m) - WHITE_W / 2 + 0.5}
            y={PAD_TOP}
            width={WHITE_W - 1}
            height={WHITE_H}
            rx={3}
            fill="var(--color-key-white)"
            stroke="var(--color-key-white-edge)"
            strokeWidth={1}
          />
        ))}

        {/* pinos nas brancas */}
        {whites.map((m) => (
          <g key={`wp-${m}`}>{pinAt(m, false)}</g>
        ))}

        {/* teclas pretas (por cima das brancas) */}
        {blacks.map((m) => (
          <rect
            key={`b-${m}`}
            x={cx(m) - BLACK_W / 2}
            y={PAD_TOP}
            width={BLACK_W}
            height={BLACK_H}
            rx={2}
            fill="var(--color-key-black)"
            stroke="var(--color-key-black-edge)"
            strokeWidth={1}
          />
        ))}

        {/* pinos nas pretas */}
        {blacks.map((m) => (
          <g key={`bp-${m}`}>{pinAt(m, true)}</g>
        ))}

        {/* células clicáveis (brancas primeiro, pretas por cima p/ o clique da preta vencer) */}
        {interactive && (
          <>
            {whites.map((m) => (
              <rect
                key={`wc-${m}`}
                className="key-cell"
                x={cx(m) - WHITE_W / 2 + 0.5}
                y={PAD_TOP}
                width={WHITE_W - 1}
                height={WHITE_H}
                rx={3}
                onClick={() => onSelect?.(m)}
              />
            ))}
            {blacks.map((m) => (
              <rect
                key={`bc-${m}`}
                className="key-cell"
                x={cx(m) - BLACK_W / 2}
                y={PAD_TOP}
                width={BLACK_W}
                height={BLACK_H}
                rx={2}
                onClick={() => onSelect?.(m)}
              />
            ))}
          </>
        )}
      </svg>
    </div>
  )
}
