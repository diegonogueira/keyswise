import { describe, expect, it } from 'vitest'
import { CHORD_CATEGORIES, CHORD_QUALITIES } from './voicings'
import {
  describeVoicing,
  dictionaryEntry,
  dictionarySections,
  voicingsOfQuality,
} from './dictionary'

const mod12 = (n: number) => ((n % 12) + 12) % 12

describe('dictionary', () => {
  it('cobre todas as qualidades exatamente uma vez, na ordem das categorias', () => {
    const sections = dictionarySections(0)
    expect(sections.map((s) => s.categoryId)).toEqual(CHORD_CATEGORIES.map((c) => c.id))
    const ids = sections.flatMap((s) => s.entries.map((e) => e.quality.id))
    expect(ids.length).toBe(CHORD_QUALITIES.length)
    expect(ids.slice().sort()).toEqual(CHORD_QUALITIES.map((q) => q.id).slice().sort())
  })

  it('toda qualidade tem ≥1 variação e todo shape casa dentro do pitch-class set da qualidade', () => {
    for (const q of CHORD_QUALITIES) {
      const entry = dictionaryEntry(3, q.id) // tom D#, longe de C p/ pegar erros de âncora
      expect(entry.voicings.length).toBeGreaterThan(0)
      const chordPcs = new Set(entry.pcs.map(mod12))
      for (const view of entry.voicings) {
        for (const m of view.midis) expect(chordPcs.has(mod12(m))).toBe(true)
      }
    }
  })

  it('classifica os tipos de voicing pelo id/estilo', () => {
    const v = (id: string, style: string): Parameters<typeof describeVoicing>[0] => ({
      id,
      style,
      qualityId: 'x',
      degrees: [0],
    })
    expect(describeVoicing(v('maj-inv0', 'basic'))).toEqual({ kind: 'root' })
    expect(describeVoicing(v('maj-inv2', 'basic'))).toEqual({ kind: 'inversion', n: 2 })
    expect(describeVoicing(v('maj7-close', 'basic'))).toEqual({ kind: 'root' })
    expect(describeVoicing(v('dim7-inv', 'basic'))).toEqual({ kind: 'inversion', n: 1 })
    expect(describeVoicing(v('maj7-shellB', 'shell'))).toEqual({
      kind: 'style',
      style: 'shell',
      variant: 'B',
    })
    expect(describeVoicing(v('dom9-rootlessA', 'rootless'))).toEqual({
      kind: 'style',
      style: 'rootless',
      variant: 'A',
    })
    expect(describeVoicing(v('min11-quartal', 'quartal'))).toEqual({
      kind: 'style',
      style: 'quartal',
      variant: '',
    })
  })

  it('a cifra em C bate com o construtor de símbolo', () => {
    const entry = dictionaryEntry(0, 'maj7')
    expect(entry.symbol).toBe('Cmaj7')
    expect(entry.notes).toEqual(['C', 'E', 'G', 'B'])
  })

  it('voicingsOfQuality devolve só os shapes da qualidade pedida', () => {
    for (const view of voicingsOfQuality('dom9')) expect(view.qualityId).toBe('dom9')
  })
})
