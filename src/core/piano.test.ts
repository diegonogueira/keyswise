import { describe, it, expect } from 'vitest'
import {
  isBlackKey,
  whiteKeyIndex,
  whiteKeysInRange,
  keysForPitchClass,
  keyCenterX,
  floorToC,
  ceilToC,
  windowFor,
  type PianoGeom,
} from './piano'

const GEOM: PianoGeom = {
  WHITE_W: 30,
  WHITE_H: 120,
  BLACK_W: 18,
  BLACK_H: 76,
  PAD_TOP: 8,
  PAD_BOTTOM: 8,
  labelFont: 10,
  pinR: 8,
  pinFont: 9,
}

describe('piano — teclas', () => {
  it('isBlackKey classifica as 5 pretas por oitava', () => {
    // C4=60 branca, C#4=61 preta, ...
    const black = [61, 63, 66, 68, 70].map(isBlackKey)
    const white = [60, 62, 64, 65, 67, 69, 71].map(isBlackKey)
    expect(black.every(Boolean)).toBe(true)
    expect(white.some(Boolean)).toBe(false)
  })

  it('whiteKeysInRange conta 7 brancas por oitava (C..B)', () => {
    expect(whiteKeysInRange(60, 71)).toBe(7)
    expect(whiteKeysInRange(60, 72)).toBe(8) // inclui o C de cima
  })

  it('whiteKeyIndex é monotônico e cresce só nas brancas', () => {
    let prev = -1
    for (let m = 60; m <= 84; m++) {
      const idx = whiteKeyIndex(m, 60)
      expect(idx).toBeGreaterThanOrEqual(prev)
      prev = idx
    }
    expect(whiteKeyIndex(60, 60)).toBe(0)
    expect(whiteKeyIndex(62, 60)).toBe(1)
    expect(whiteKeyIndex(64, 60)).toBe(2)
  })

  it('keysForPitchClass acha todas as ocorrências na janela', () => {
    expect(keysForPitchClass(0, 60, 84)).toEqual([60, 72, 84])
    expect(keysForPitchClass(4, 60, 84)).toEqual([64, 76])
  })
})

describe('piano — geometria x', () => {
  it('as brancas têm x estritamente crescente', () => {
    const whites = [60, 62, 64, 65, 67, 69, 71, 72]
    const xs = whites.map((m) => keyCenterX(m, 60, GEOM))
    for (let i = 1; i < xs.length; i++) expect(xs[i]).toBeGreaterThan(xs[i - 1])
  })

  it('cada preta fica estritamente entre suas brancas vizinhas', () => {
    for (const black of [61, 63, 66, 68, 70]) {
      const x = keyCenterX(black, 60, GEOM)
      const left = keyCenterX(black - 1, 60, GEOM)
      const right = keyCenterX(black + 1, 60, GEOM)
      expect(x).toBeGreaterThan(left)
      expect(x).toBeLessThan(right)
    }
  })
})

describe('piano — janela', () => {
  it('floorToC/ceilToC caem em C', () => {
    expect(floorToC(64)).toBe(60)
    expect(floorToC(60)).toBe(60)
    expect(ceilToC(64)).toBe(72)
    expect(ceilToC(60)).toBe(60)
  })

  it('windowFor enquadra o voicing, em blocos de oitava, ≥ 2 oitavas', () => {
    const [lo, hi] = windowFor([64, 67, 71, 74])
    expect(lo % 12).toBe(0)
    expect(hi % 12).toBe(0)
    expect(lo).toBeLessThanOrEqual(64)
    expect(hi).toBeGreaterThanOrEqual(74)
    expect(hi - lo).toBeGreaterThanOrEqual(24)
  })

  it('windowFor vazio devolve C4–C6', () => {
    expect(windowFor([])).toEqual([60, 84])
  })
})
