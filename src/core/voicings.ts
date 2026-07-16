// Voicings de acorde: qualidades (identidade do cifrado + pitch classes completos p/ validação)
// e "shapes" concretos no teclado (arranjos possivelmente rootless / invertidos).
//
// INVARIANTE central: o conjunto de pitch classes que o usuário precisa casar vem dos
// `intervals` da QUALIDADE (o acorde completo), NUNCA dos `degrees` do shape (que podem omitir
// a fundamental — um voicing rootless ainda responde pelo cifrado completo). Ou seja:
//   • o teclado é desenhado a partir de `degrees`;
//   • a validação compara o pitch-class SET da qualidade.
// Garantia testada: os pitch classes de um shape ⊆ os pitch classes da qualidade.

import type { Rng } from './rng'
import { pick } from './rng'

export interface ChordQuality {
  /** id estável (chave de persistência), ex.: 'maj7', 'dom7', 'm7b5', 'dom13' */
  id: string
  /** sufixo do cifrado depois da fundamental, ex.: '', 'm', 'maj7', '7', 'm7♭5', '°7', '6/9' */
  quality: string
  /** semitons de cada nota a partir da fundamental — o pitch-class SET completo (validação) */
  intervals: number[]
  /** tensões impressas entre parênteses, na ordem do cifrado, ex.: ['9','13'], ['♭9'] */
  tensions?: string[]
}

export interface Voicing {
  /** id único, ex.: 'maj7-shell', 'dom9-rootlessA' */
  id: string
  /** id da qualidade que este shape realiza (ver CHORD_QUALITIES) */
  qualityId: string
  /** grupo de estilo (toggle na config): ver VOICING_STYLES */
  style: string
  /** semitons a partir da fundamental, em ordem ascendente de execução; rootless omite o 0 */
  degrees: number[]
}

function mod12(n: number): number {
  return ((n % 12) + 12) % 12
}

// ─── Qualidades ────────────────────────────────────────────────────────────────
// `intervals` sempre ascendente a partir de 0 (fundamental). Dominantes com tensão usam o
// núcleo '7' + `tensions` (ex.: C7(9,13)); as demais usam sufixo composto (Cmaj9, Cm11, C6/9).

export const CHORD_QUALITIES: ChordQuality[] = [
  // tríades
  { id: 'maj', quality: '', intervals: [0, 4, 7] },
  { id: 'min', quality: 'm', intervals: [0, 3, 7] },
  { id: 'aug', quality: '+', intervals: [0, 4, 8] },
  { id: 'dim', quality: '°', intervals: [0, 3, 6] },
  // suspensas
  { id: 'sus4', quality: 'sus4', intervals: [0, 5, 7] },
  { id: 'sus2', quality: 'sus2', intervals: [0, 2, 7] },
  // sextas
  { id: 'maj6', quality: '6', intervals: [0, 4, 7, 9] },
  { id: 'min6', quality: 'm6', intervals: [0, 3, 7, 9] },
  { id: 'maj69', quality: '6/9', intervals: [0, 2, 4, 7, 9] },
  // sétimas
  { id: 'maj7', quality: 'maj7', intervals: [0, 4, 7, 11] },
  { id: 'dom7', quality: '7', intervals: [0, 4, 7, 10] },
  { id: 'min7', quality: 'm7', intervals: [0, 3, 7, 10] },
  { id: 'm7b5', quality: 'm7♭5', intervals: [0, 3, 6, 10] },
  { id: 'dim7', quality: '°7', intervals: [0, 3, 6, 9] },
  { id: 'minMaj7', quality: 'm(maj7)', intervals: [0, 3, 7, 11] },
  // estendidas
  { id: 'maj9', quality: 'maj9', intervals: [0, 2, 4, 7, 11] },
  { id: 'dom9', quality: '7', tensions: ['9'], intervals: [0, 2, 4, 7, 10] },
  { id: 'min9', quality: 'm9', intervals: [0, 2, 3, 7, 10] },
  { id: 'min11', quality: 'm11', intervals: [0, 2, 3, 5, 7, 10] },
  { id: 'dom13', quality: '7', tensions: ['9', '13'], intervals: [0, 2, 4, 7, 9, 10] },
  { id: 'maj7s11', quality: 'maj7', tensions: ['♯11'], intervals: [0, 4, 6, 7, 11] },
  // alteradas (dominantes)
  { id: 'dom7b9', quality: '7', tensions: ['♭9'], intervals: [0, 1, 4, 7, 10] },
  { id: 'dom7s9', quality: '7', tensions: ['♯9'], intervals: [0, 3, 4, 7, 10] },
  { id: 'dom7s11', quality: '7', tensions: ['♯11'], intervals: [0, 4, 6, 7, 10] },
  { id: 'dom7b13', quality: '7', tensions: ['♭13'], intervals: [0, 4, 7, 8, 10] },
  { id: 'dom7alt', quality: '7alt', intervals: [0, 1, 3, 4, 8, 10] },
]

export function qualityById(id: string): ChordQuality {
  return CHORD_QUALITIES.find((q) => q.id === id) ?? CHORD_QUALITIES[0]
}

export const ALL_QUALITY_IDS = CHORD_QUALITIES.map((q) => q.id)

// ─── Categorias (toggles de qualidade na config) ────────────────────────────────
// Partição das qualidades — cada qualidade está em exatamente uma categoria (invariante testada).

export interface ChordCategory {
  id: string
  qualityIds: string[]
}

export const CHORD_CATEGORIES: ChordCategory[] = [
  { id: 'triads', qualityIds: ['maj', 'min', 'aug', 'dim'] },
  { id: 'sus', qualityIds: ['sus4', 'sus2'] },
  { id: 'sixths', qualityIds: ['maj6', 'min6', 'maj69'] },
  { id: 'sevenths', qualityIds: ['maj7', 'dom7', 'min7', 'm7b5', 'dim7', 'minMaj7'] },
  { id: 'extended', qualityIds: ['maj9', 'dom9', 'min9', 'min11', 'dom13', 'maj7s11'] },
  { id: 'altered', qualityIds: ['dom7b9', 'dom7s9', 'dom7s11', 'dom7b13', 'dom7alt'] },
]

/** Expande ids de categorias habilitadas no conjunto de ids de qualidade. */
export function qualityIdsForCategories(categoryIds: string[]): string[] {
  const ids = new Set<string>()
  for (const cat of CHORD_CATEGORIES) {
    if (categoryIds.includes(cat.id)) for (const q of cat.qualityIds) ids.add(q)
  }
  return [...ids]
}

// ─── Estilos de voicing (toggles de estilo na config) ───────────────────────────

export const VOICING_STYLES = ['basic', 'shell', 'rootless', 'quartal'] as const

// ─── Catálogo de voicings ───────────────────────────────────────────────────────
// Tríades básicas (maior/menor): TODAS as inversões. Acordes complexos: só os voicings
// mais usados (shell R+3+7, rootless A/B ao estilo Bill Evans, quartal "So What").

/** Root + todas as inversões (a inversão k sobe as k notas mais graves uma oitava). */
function inversionsOf(qualityId: string, intervals: number[]): Voicing[] {
  return intervals.map((_, k) => {
    const degrees = intervals.map((iv, i) => (i < k ? iv + 12 : iv)).sort((a, b) => a - b)
    return { id: `${qualityId}-inv${k}`, qualityId, style: 'basic', degrees }
  })
}

/** Voicing fechado em estado fundamental (degrees = intervals). Garante cobertura da qualidade. */
function close(qualityId: string, style = 'basic'): Voicing {
  return { id: `${qualityId}-close`, qualityId, style, degrees: qualityById(qualityId).intervals }
}

export const VOICINGS: Voicing[] = [
  // tríades básicas — todas as inversões
  ...inversionsOf('maj', [0, 4, 7]),
  ...inversionsOf('min', [0, 3, 7]),
  close('aug'),
  close('dim'),

  // suspensas
  close('sus4'),
  close('sus2'),

  // sextas
  close('maj6'),
  close('min6'),
  close('maj69'),
  { id: 'maj69-rootless', qualityId: 'maj69', style: 'rootless', degrees: [2, 4, 7, 9] }, // 9,3,5,6

  // sétimas — fechado + shell (R+3+7)
  close('maj7'),
  { id: 'maj7-shell', qualityId: 'maj7', style: 'shell', degrees: [0, 4, 11] },
  { id: 'maj7-shellB', qualityId: 'maj7', style: 'shell', degrees: [0, 11, 16] },
  close('dom7'),
  { id: 'dom7-shell', qualityId: 'dom7', style: 'shell', degrees: [0, 4, 10] },
  { id: 'dom7-shellB', qualityId: 'dom7', style: 'shell', degrees: [0, 10, 16] },
  close('min7'),
  { id: 'min7-shell', qualityId: 'min7', style: 'shell', degrees: [0, 3, 10] },
  { id: 'min7-shellB', qualityId: 'min7', style: 'shell', degrees: [0, 10, 15] },
  close('m7b5'),
  { id: 'm7b5-shell', qualityId: 'm7b5', style: 'shell', degrees: [0, 6, 10] },
  close('dim7'),
  { id: 'dim7-inv', qualityId: 'dim7', style: 'basic', degrees: [3, 6, 9, 12] },
  close('minMaj7'),
  { id: 'minMaj7-shell', qualityId: 'minMaj7', style: 'shell', degrees: [0, 3, 11] },

  // estendidas — fechado + rootless A/B (Bill Evans)
  close('maj9'),
  { id: 'maj9-rootlessA', qualityId: 'maj9', style: 'rootless', degrees: [4, 7, 11, 14] }, // 3,5,7,9
  { id: 'maj9-rootlessB', qualityId: 'maj9', style: 'rootless', degrees: [11, 14, 16, 19] }, // 7,9,3,5
  close('dom9'),
  { id: 'dom9-rootlessA', qualityId: 'dom9', style: 'rootless', degrees: [4, 7, 10, 14] },
  { id: 'dom9-rootlessB', qualityId: 'dom9', style: 'rootless', degrees: [10, 14, 16, 19] },
  close('min9'),
  { id: 'min9-rootlessA', qualityId: 'min9', style: 'rootless', degrees: [3, 7, 10, 14] },
  { id: 'min9-rootlessB', qualityId: 'min9', style: 'rootless', degrees: [10, 14, 15, 19] },
  close('min11'),
  { id: 'min11-quartal', qualityId: 'min11', style: 'quartal', degrees: [0, 5, 10, 15, 19] }, // So What
  { id: 'min11-rootless', qualityId: 'min11', style: 'rootless', degrees: [3, 5, 10, 14] },
  { id: 'dom13-close', qualityId: 'dom13', style: 'basic', degrees: [0, 4, 10, 14, 21] },
  { id: 'dom13-rootlessB', qualityId: 'dom13', style: 'rootless', degrees: [10, 14, 16, 21] }, // ♭7,9,3,13
  { id: 'dom13-rootlessA', qualityId: 'dom13', style: 'rootless', degrees: [4, 9, 10, 14] }, // 3,13,♭7,9
  close('maj7s11'),
  { id: 'maj7s11-shell', qualityId: 'maj7s11', style: 'shell', degrees: [4, 11, 18] },

  // alteradas — fechado compacto + rootless
  { id: 'dom7b9-close', qualityId: 'dom7b9', style: 'basic', degrees: [0, 4, 10, 13] },
  { id: 'dom7b9-rootless', qualityId: 'dom7b9', style: 'rootless', degrees: [1, 4, 7, 10] },
  { id: 'dom7s9-close', qualityId: 'dom7s9', style: 'basic', degrees: [0, 4, 10, 15] },
  { id: 'dom7s9-rootless', qualityId: 'dom7s9', style: 'rootless', degrees: [4, 7, 10, 15] },
  { id: 'dom7s11-close', qualityId: 'dom7s11', style: 'basic', degrees: [0, 4, 10, 18] },
  { id: 'dom7s11-shell', qualityId: 'dom7s11', style: 'shell', degrees: [4, 6, 10] },
  { id: 'dom7b13-close', qualityId: 'dom7b13', style: 'basic', degrees: [0, 4, 8, 10] },
  { id: 'dom7b13-shell', qualityId: 'dom7b13', style: 'shell', degrees: [4, 8, 10] },
  { id: 'dom7alt-close', qualityId: 'dom7alt', style: 'basic', degrees: [0, 4, 10, 13, 15] },
  { id: 'dom7alt-rootless', qualityId: 'dom7alt', style: 'rootless', degrees: [4, 8, 10, 13] },
]

// ─── Funções ─────────────────────────────────────────────────────────────────

/** Pitch classes (0–11) do acorde completo, na ordem dos graus (fundamental primeiro). */
export function chordPitchClasses(rootPc: number, quality: ChordQuality): number[] {
  return quality.intervals.map((i) => mod12(rootPc + i))
}

/** Chave canônica de um conjunto de pitch classes — para comparar/deduplicar ignorando
 *  oitava e ordem. Idêntica à do fretwise. */
export function pcSetKey(pcs: number[]): string {
  return [...new Set(pcs.map(mod12))].sort((a, b) => a - b).join(',')
}

/** MIDIs (soando) de um voicing, ascendentes, realizados a partir de `rootMidi`. */
export function realizeVoicing(degrees: number[], rootMidi: number): number[] {
  return degrees.map((d) => rootMidi + d).sort((a, b) => a - b)
}

/** Sobe/desce por oitavas até a nota mais grave ficar perto de `target`. */
export function alignLowest(midis: number[], target: number): number[] {
  if (!midis.length) return midis
  const k = Math.round((target - midis[0]) / 12)
  return k ? midis.map((m) => m + 12 * k) : midis
}

/** Todos os voicings de uma qualidade, filtrados pelos estilos habilitados. Cai em TODOS os
 *  voicings da qualidade se nenhum casar (nunca fica sem voicing — os estilos são preferência). */
export function voicingsFor(qualityId: string, styles: string[]): Voicing[] {
  const all = VOICINGS.filter((v) => v.qualityId === qualityId)
  const enabled = all.filter((v) => styles.includes(v.style))
  return enabled.length ? enabled : all
}

/** Registro de referência do voicing: nota mais grave ancorada perto do C4. */
export const VOICING_ANCHOR = 60

/**
 * Sorteia um voicing da qualidade (entre os estilos habilitados), realiza-o num registro médio
 * (nota mais grave perto do C4) e devolve os MIDIs soando, ascendentes.
 */
export function generateVoicing(
  rootPc: number,
  qualityId: string,
  styles: string[],
  rng: Rng,
): number[] {
  const v = pick(rng, voicingsFor(qualityId, styles))
  const raw = realizeVoicing(v.degrees, VOICING_ANCHOR + rootPc)
  return alignLowest(raw, VOICING_ANCHOR)
}

/** O conjunto de teclas (MIDIs) cobre exatamente os pitch classes do acorde? */
export function voicingMatchesChord(midis: number[], pcs: number[]): boolean {
  return pcSetKey(midis) === pcSetKey(pcs)
}
