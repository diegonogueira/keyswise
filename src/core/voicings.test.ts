import { describe, it, expect } from 'vitest'
import {
  CHORD_QUALITIES,
  CHORD_CATEGORIES,
  ALL_QUALITY_IDS,
  VOICINGS,
  qualityById,
  qualityIdsForCategories,
  chordPitchClasses,
  pcSetKey,
  realizeVoicing,
  alignLowest,
  voicingsFor,
  voicingMatchesChord,
  generateVoicing,
} from './voicings'
import { mulberry32 } from './rng'

const mod12 = (n: number) => ((n % 12) + 12) % 12

describe('voicings — invariante shape ⊆ qualidade', () => {
  it('todo voicing usa apenas pitch classes da sua qualidade', () => {
    for (const v of VOICINGS) {
      const qpcs = new Set(chordPitchClasses(0, qualityById(v.qualityId)))
      const vpcs = realizeVoicing(v.degrees, 0).map(mod12)
      for (const pc of vpcs) {
        expect(qpcs.has(pc), `${v.id}: pc ${pc} ∉ qualidade ${v.qualityId}`).toBe(true)
      }
    }
  })

  it('todo voicing tem degrees ascendentes e distintos', () => {
    for (const v of VOICINGS) {
      const sorted = [...v.degrees].sort((a, b) => a - b)
      expect(v.degrees, v.id).toEqual(sorted)
      expect(new Set(v.degrees).size, v.id).toBe(v.degrees.length)
    }
  })
})

describe('voicings — cobertura e catálogo', () => {
  it('toda qualidade tem ao menos um voicing', () => {
    for (const q of CHORD_QUALITIES) {
      expect(VOICINGS.some((v) => v.qualityId === q.id), q.id).toBe(true)
    }
  })

  it('ids de voicing são únicos', () => {
    const ids = VOICINGS.map((v) => v.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('as inversões de tríade maior/menor estão presentes (todas)', () => {
    expect(VOICINGS.filter((v) => v.qualityId === 'maj' && v.style === 'basic')).toHaveLength(3)
    expect(VOICINGS.filter((v) => v.qualityId === 'min' && v.style === 'basic')).toHaveLength(3)
  })
})

describe('voicings — categorias particionam as qualidades', () => {
  it('cada qualidade está em exatamente uma categoria', () => {
    for (const id of ALL_QUALITY_IDS) {
      const inCats = CHORD_CATEGORIES.filter((c) => c.qualityIds.includes(id))
      expect(inCats.map((c) => c.id).join(',') || `sem categoria: ${id}`).toBeTruthy()
      expect(inCats, id).toHaveLength(1)
    }
  })

  it('a união das categorias cobre todas as qualidades', () => {
    const union = new Set(CHORD_CATEGORIES.flatMap((c) => c.qualityIds))
    expect([...union].sort()).toEqual([...ALL_QUALITY_IDS].sort())
  })

  it('qualityIdsForCategories expande corretamente', () => {
    expect(qualityIdsForCategories(['triads']).sort()).toEqual(['aug', 'dim', 'maj', 'min'])
  })
})

describe('voicings — pitch-class sets distintos por qualidade (não-ambiguidade do modo 1)', () => {
  it('na mesma fundamental, toda qualidade tem um pitch set único', () => {
    const keys = ALL_QUALITY_IDS.map((id) => pcSetKey(chordPitchClasses(0, qualityById(id))))
    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe('voicings — realização', () => {
  it('realizeVoicing devolve MIDIs ascendentes a partir da fundamental', () => {
    expect(realizeVoicing([0, 4, 7], 60)).toEqual([60, 64, 67])
    expect(realizeVoicing([4, 7, 11, 14], 60)).toEqual([64, 67, 71, 74])
  })

  it('alignLowest aproxima a nota mais grave do alvo por oitavas', () => {
    expect(alignLowest([76, 79, 83], 60)).toEqual([64, 67, 71])
    expect(alignLowest([48, 52, 55], 60)).toEqual([60, 64, 67])
  })

  it('voicingsFor cai em todos os voicings da qualidade se o estilo não casar', () => {
    expect(voicingsFor('maj', ['quartal'])).toEqual(voicingsFor('maj', []))
    expect(voicingsFor('maj9', ['rootless']).every((v) => v.style === 'rootless')).toBe(true)
  })

  it('generateVoicing produz um voicing que soa no registro médio', () => {
    const rng = mulberry32(1)
    for (let i = 0; i < 50; i++) {
      const midis = generateVoicing(0, 'maj7', ['basic'], rng)
      expect(midis[0]).toBeGreaterThanOrEqual(48)
      expect(midis[0]).toBeLessThanOrEqual(72)
      expect([...midis].sort((a, b) => a - b)).toEqual(midis)
    }
  })

  it('voicingMatchesChord compara conjuntos de pitch classes', () => {
    const pcs = chordPitchClasses(0, qualityById('maj7'))
    expect(voicingMatchesChord([60, 64, 67, 71], pcs)).toBe(true)
    expect(voicingMatchesChord([60, 64, 67], pcs)).toBe(false)
  })
})
