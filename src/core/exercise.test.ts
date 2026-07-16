import { describe, it, expect } from 'vitest'
import {
  generateQuestion,
  checkSymbolAnswer,
  checkKeysChoiceAnswer,
  type VoicingConfig,
} from './exercise'
import { pcSetKey, ALL_QUALITY_IDS, chordPitchClasses, qualityById } from './voicings'
import { mulberry32 } from './rng'

const pcsOf = (rootPc: number, qualityId: string) =>
  chordPitchClasses(rootPc, qualityById(qualityId))

const ALL_STYLES = ['basic', 'shell', 'rootless', 'quartal']

function cfg(over: Partial<VoicingConfig> = {}): VoicingConfig {
  return {
    qualities: ['maj', 'min', 'maj7', 'dom7', 'min7', 'maj9', 'dom9'],
    styles: ALL_STYLES,
    fixedRootPc: 0,
    ...over,
  }
}

describe('exercise — keysToSymbol', () => {
  it('monta 4 cifras de mesma fundamental, com pitch sets distintos, incluindo a correta', () => {
    const rng = mulberry32(42)
    for (let i = 0; i < 200; i++) {
      const q = generateQuestion({ mode: 'keysToSymbol', config: cfg(), rng })
      const choices = q.symbolChoices!
      expect(choices).toHaveLength(4)
      // todas na mesma fundamental
      expect(choices.every((c) => c.rootPc === q.chord.rootPc)).toBe(true)
      // pitch sets distintos
      const keys = choices.map((c) => pcSetKey(pcsOf(c.rootPc, c.qualityId)))
      expect(new Set(keys).size).toBe(4)
      // a correta está entre elas
      expect(choices.some((c) => c.qualityId === q.chord.qualityId)).toBe(true)
    }
  })

  it('checkSymbolAnswer aceita a correta (qualquer inversão/rootless) e rejeita as demais', () => {
    const rng = mulberry32(7)
    for (let i = 0; i < 200; i++) {
      const q = generateQuestion({ mode: 'keysToSymbol', config: cfg(), rng })
      for (const c of q.symbolChoices!) {
        const ok = c.qualityId === q.chord.qualityId
        expect(checkSymbolAnswer(q, c)).toBe(ok)
      }
    }
  })
})

describe('exercise — symbolToKeys', () => {
  it('monta 4 teclados com conjuntos distintos e exatamente um correto', () => {
    const rng = mulberry32(99)
    for (let i = 0; i < 200; i++) {
      const q = generateQuestion({ mode: 'symbolToKeys', config: cfg(), rng })
      const choices = q.keyChoices!
      expect(choices).toHaveLength(4)
      const keys = choices.map((m) => pcSetKey(m))
      expect(new Set(keys).size).toBe(4)
      const matches = choices.filter((m) => checkKeysChoiceAnswer(q, m))
      expect(matches).toHaveLength(1)
      expect(pcSetKey(matches[0])).toBe(pcSetKey(q.voicing))
    }
  })
})

describe('exercise — fundamental fixa vs aleatória', () => {
  it('fixedRootPc fixa a fundamental', () => {
    const rng = mulberry32(3)
    for (let i = 0; i < 100; i++) {
      const q = generateQuestion({ mode: 'keysToSymbol', config: cfg({ fixedRootPc: 5 }), rng })
      expect(q.chord.rootPc).toBe(5)
    }
  })

  it('fixedRootPc null varia a fundamental', () => {
    const rng = mulberry32(3)
    const roots = new Set<number>()
    for (let i = 0; i < 100; i++) {
      const q = generateQuestion({ mode: 'keysToSymbol', config: cfg({ fixedRootPc: null }), rng })
      roots.add(q.chord.rootPc)
    }
    expect(roots.size).toBeGreaterThan(1)
  })
})

describe('exercise — robustez', () => {
  it('funciona com uma única qualidade habilitada (completa distratores do catálogo)', () => {
    const rng = mulberry32(11)
    const q = generateQuestion({
      mode: 'keysToSymbol',
      config: cfg({ qualities: ['maj7'] }),
      rng,
    })
    expect(q.symbolChoices).toHaveLength(4)
    expect(q.chord.qualityId).toBe('maj7')
  })

  it('tolera ids de qualidade desconhecidos', () => {
    const rng = mulberry32(11)
    const q = generateQuestion({
      mode: 'symbolToKeys',
      config: cfg({ qualities: ['inexistente'] }),
      rng,
    })
    expect(ALL_QUALITY_IDS).toContain(q.chord.qualityId)
    expect(q.keyChoices).toHaveLength(4)
  })
})
