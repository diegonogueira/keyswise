import { describe, it, expect } from 'vitest'
import { chordSymbol, chordNoteNames } from './symbol'
import { qualityById } from './voicings'

const sym = (root: number, id: string) => chordSymbol(root, qualityById(id))

describe('symbol — cifra estilo jazz internacional', () => {
  it('tríades e sétimas', () => {
    expect(sym(0, 'maj')).toBe('C')
    expect(sym(0, 'min')).toBe('Cm')
    expect(sym(0, 'aug')).toBe('C+')
    expect(sym(0, 'dim')).toBe('C°')
    expect(sym(0, 'maj7')).toBe('Cmaj7')
    expect(sym(0, 'dom7')).toBe('C7')
    expect(sym(0, 'min7')).toBe('Cm7')
    expect(sym(0, 'm7b5')).toBe('Cm7♭5')
    expect(sym(0, 'dim7')).toBe('C°7')
    expect(sym(0, 'minMaj7')).toBe('Cm(maj7)')
  })

  it('sextas e estendidas', () => {
    expect(sym(0, 'maj6')).toBe('C6')
    expect(sym(0, 'maj69')).toBe('C6/9')
    expect(sym(0, 'maj9')).toBe('Cmaj9')
    expect(sym(0, 'min11')).toBe('Cm11')
    expect(sym(0, 'dom9')).toBe('C7(9)')
    expect(sym(0, 'dom13')).toBe('C7(9,13)')
    expect(sym(0, 'maj7s11')).toBe('Cmaj7(♯11)')
  })

  it('alteradas', () => {
    expect(sym(0, 'dom7b9')).toBe('C7(♭9)')
    expect(sym(0, 'dom7s9')).toBe('C7(♯9)')
    expect(sym(0, 'dom7s11')).toBe('C7(♯11)')
    expect(sym(0, 'dom7b13')).toBe('C7(♭13)')
    expect(sym(0, 'dom7alt')).toBe('C7alt')
  })

  it('fundamental correta em outras alturas', () => {
    expect(sym(3, 'min7')).toBe('D#m7')
    expect(sym(7, 'dom7')).toBe('G7')
    expect(sym(10, 'maj7')).toBe('A#maj7')
  })

  it('chordNoteNames lista o acorde completo', () => {
    expect(chordNoteNames(0, qualityById('maj7'))).toBe('C, E, G, B')
    expect(chordNoteNames(0, qualityById('dom13'))).toBe('C, D, E, G, A, A#')
  })
})
