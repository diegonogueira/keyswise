// Construtor de cifra (estilo jazz internacional): fundamental + qualidade + tensões.
// Ex.: Cmaj7, C7(9,13), C7(♭9), Cm7♭5, C°7, C6/9, C7alt.
// A grafia da casa (maj7 vs 7M, °7, alt, ordem das tensões) mora toda aqui.

import { pitchClassName } from './notes'
import { chordPitchClasses, type ChordQuality } from './voicings'

/** Cifra do acorde a partir de (fundamental, qualidade). */
export function chordSymbol(rootPc: number, q: ChordQuality): string {
  const tensions = q.tensions?.length ? `(${q.tensions.join(',')})` : ''
  return pitchClassName(rootPc) + q.quality + tensions
}

/** Notas do acorde completo por extenso, ex.: "C, E, G, B, D". */
export function chordNoteNames(rootPc: number, q: ChordQuality): string {
  return chordPitchClasses(rootPc, q).map(pitchClassName).join(', ')
}
