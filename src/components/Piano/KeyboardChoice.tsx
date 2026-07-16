import { isBlackKey, keysInRange, whiteKeysInRange, keyCenterX, type PianoGeom } from '../../core/piano'

// Teclado pequeno e não-interativo p/ as alternativas do modo Cifra → Teclas. Escala p/ caber
// na largura do tile (svg width 100%), diferente do teclado principal (tamanho natural).

const GEOM: PianoGeom = {
  WHITE_W: 18, WHITE_H: 72, BLACK_W: 11, BLACK_H: 46,
  PAD_TOP: 6, PAD_BOTTOM: 6, labelFont: 8, pinR: 5.5, pinFont: 8,
}

interface KeyboardChoiceProps {
  /** janela [lo, hi] compartilhada por todas as alternativas (comparável) */
  lo: number
  hi: number
  /** teclas a destacar (o voicing desta alternativa) */
  midis: number[]
  /** cor do destaque conforme o estado (accent por padrão) */
  variant?: 'accent' | 'correct' | 'wrong'
}

const FILL: Record<NonNullable<KeyboardChoiceProps['variant']>, string> = {
  accent: 'var(--color-accent)',
  correct: 'var(--color-correct)',
  wrong: 'var(--color-wrong)',
}

export function KeyboardChoice({ lo, hi, midis, variant = 'accent' }: KeyboardChoiceProps) {
  const { WHITE_W, WHITE_H, BLACK_W, BLACK_H, PAD_TOP, PAD_BOTTOM, pinR } = GEOM
  const keys = keysInRange(lo, hi)
  const whites = keys.filter((m) => !isBlackKey(m))
  const blacks = keys.filter((m) => isBlackKey(m))
  const width = whiteKeysInRange(lo, hi) * WHITE_W
  const height = PAD_TOP + WHITE_H + PAD_BOTTOM
  const cx = (m: number) => keyCenterX(m, lo, GEOM)
  const on = new Set(midis)
  const fill = FILL[variant]

  const dot = (m: number, black: boolean) => {
    if (!on.has(m)) return null
    const y = black ? PAD_TOP + BLACK_H - pinR - 3 : PAD_TOP + WHITE_H - pinR - 5
    return <circle cx={cx(m)} cy={y} r={pinR} fill={fill} />
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      className="block select-none"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Teclado de piano"
    >
      {whites.map((m) => (
        <rect
          key={`w-${m}`}
          x={cx(m) - WHITE_W / 2 + 0.5}
          y={PAD_TOP}
          width={WHITE_W - 1}
          height={WHITE_H}
          rx={2}
          fill="var(--color-key-white)"
          stroke="var(--color-key-white-edge)"
          strokeWidth={1}
        />
      ))}
      {whites.map((m) => (
        <g key={`wd-${m}`}>{dot(m, false)}</g>
      ))}
      {blacks.map((m) => (
        <rect
          key={`b-${m}`}
          x={cx(m) - BLACK_W / 2}
          y={PAD_TOP}
          width={BLACK_W}
          height={BLACK_H}
          rx={1.5}
          fill="var(--color-key-black)"
          stroke="var(--color-key-black-edge)"
          strokeWidth={1}
        />
      ))}
      {blacks.map((m) => (
        <g key={`bd-${m}`}>{dot(m, true)}</g>
      ))}
    </svg>
  )
}
