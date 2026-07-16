// Geometria e helpers do teclado de piano. Uma "posição" no piano é só um número MIDI
// (não há corda/casa). Este módulo é o análogo — trivial — de fretboard.ts + tuning.ts.
//
// `keyCenterX` é a fonte ÚNICA da matemática de x: tanto o render do SVG quanto o auto-scroll
// a chamam, então nunca discordam (lição do `fretCenterX` do fretwise).

const BLACK_PC = new Set([1, 3, 6, 8, 10])

/** Pitch classes das teclas brancas, em ordem numa oitava. */
export const WHITE_PC = [0, 2, 4, 5, 7, 9, 11] as const

function mod12(n: number): number {
  return ((n % 12) + 12) % 12
}

export function isBlackKey(midi: number): boolean {
  return BLACK_PC.has(mod12(midi))
}

/** Todas as teclas (MIDI) em [lo, hi], inclusivo. */
export function keysInRange(lo: number, hi: number): number[] {
  const out: number[] = []
  for (let m = lo; m <= hi; m++) out.push(m)
  return out
}

/** Quantas teclas brancas há em [lo, hi], inclusivo. Largura do teclado = isto × WHITE_W. */
export function whiteKeysInRange(lo: number, hi: number): number {
  let n = 0
  for (let m = lo; m <= hi; m++) if (!isBlackKey(m)) n++
  return n
}

/** Nº de teclas brancas em [lo, midi) — o índice x da tecla. `lo` deve ser uma tecla branca. */
export function whiteKeyIndex(midi: number, lo: number): number {
  let n = 0
  for (let m = lo; m < midi; m++) if (!isBlackKey(m)) n++
  return n
}

/** Todas as ocorrências de um pitch class em [lo, hi] (qualquer oitava). */
export function keysForPitchClass(pc: number, lo: number, hi: number): number[] {
  const p = mod12(pc)
  const out: number[] = []
  for (let m = lo; m <= hi; m++) if (mod12(m) === p) out.push(m)
  return out
}

/** Maior C ≤ midi. */
export function floorToC(midi: number): number {
  return midi - mod12(midi)
}

/** Menor C ≥ midi. */
export function ceilToC(midi: number): number {
  const r = mod12(midi)
  return r === 0 ? midi : midi + (12 - r)
}

/**
 * Janela [lo, hi] que enquadra os `midis` dados: lo e hi caem sempre num C (assim o teclado
 * começa/termina em bloco de oitava) e a largura é ≥ `minSpanSemitones` (~2 oitavas por
 * padrão). Sem notas, devolve C4–C6.
 */
export function windowFor(midis: number[], minSpanSemitones = 24): [number, number] {
  if (!midis.length) return [60, 84]
  const low = Math.min(...midis)
  const high = Math.max(...midis)
  const lo = floorToC(low)
  let hi = ceilToC(high)
  if (hi <= high) hi += 12 // garante ao menos uma tecla de folga acima do topo (pino inteiro à vista)
  while (hi - lo < minSpanSemitones) hi += 12
  return [lo, hi]
}

export interface PianoGeom {
  WHITE_W: number
  WHITE_H: number
  BLACK_W: number
  BLACK_H: number
  PAD_TOP: number
  PAD_BOTTOM: number
  labelFont: number
  pinR: number
  pinFont: number
}

/** Centro X de uma tecla (branca ou preta). Fonte única da matemática de x. */
export function keyCenterX(midi: number, lo: number, geom: PianoGeom): number {
  if (!isBlackKey(midi)) {
    return whiteKeyIndex(midi, lo) * geom.WHITE_W + geom.WHITE_W / 2
  }
  // a preta senta na fronteira entre a branca logo abaixo (midi-1, sempre branca) e a próxima
  return (whiteKeyIndex(midi - 1, lo) + 1) * geom.WHITE_W
}
