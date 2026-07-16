// Núcleo musical: conversões em torno do número MIDI.
// MIDI 60 = C4 (dó central). Cada semitom = +1.
// Nomes de nota são sempre internacionais (A, B, C, D, ...).

export const PITCH_CLASSES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
] as const

const ACCIDENTAL_CLASSES = new Set([1, 3, 6, 8, 10])

export interface NoteInfo {
  midi: number
  /** 0–11, C = 0 */
  pitchClass: number
  octave: number
  accidental: boolean
}

function mod12(n: number): number {
  return ((n % 12) + 12) % 12
}

export function midiToNote(midi: number): NoteInfo {
  const pitchClass = mod12(midi)
  const octave = Math.floor(midi / 12) - 1
  return { midi, pitchClass, octave, accidental: ACCIDENTAL_CLASSES.has(pitchClass) }
}

export function pitchClassName(pitchClass: number): string {
  return PITCH_CLASSES[mod12(pitchClass)]
}

// Grafia com bemol de cada pitch class (a com sustenido é a de `PITCH_CLASSES`). Notas
// naturais têm a mesma grafia nas duas; os acidentes diferem (ex.: 1 = C# ou Db).
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const

/**
 * Rótulo enarmônico de um pitch class: naturais só a letra; acidentes com as DUAS grafias,
 * ex.: "C#/Db". Só o pitch class importa na validação.
 */
export function pitchClassLabel(pitchClass: number): string {
  const pc = mod12(pitchClass)
  const sharp = PITCH_CLASSES[pc]
  return sharp === FLAT_NAMES[pc] ? sharp : `${sharp}/${FLAT_NAMES[pc]}`
}

export function noteName(midi: number, withOctave = false): string {
  const { pitchClass, octave } = midiToNote(midi)
  const name = pitchClassName(pitchClass)
  return withOctave ? `${name}${octave}` : name
}
