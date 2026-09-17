// Dicionário de acordes: enumeração pura das qualidades que temos, com suas variações
// (voicings) realizadas num tom escolhido. É a mesma fonte de verdade do exercício —
// qualidades, categorias e o catálogo de voicings vêm todos de `voicings.ts` — só que
// aqui a intenção é BROWSE (referência), não treino: mostra tudo, agrupado por categoria,
// em qualquer um dos 12 tons.
//
// Reaproveita a realização de voicing do exercício (`realizeVoicing` + `alignLowest` no
// mesmo âncora), então um shape no dicionário e o mesmo shape numa questão caem no mesmo
// registro. O teclado é desenhado a partir dos `degrees`; a identidade continua vindo do
// pitch-class set da qualidade (invariante central de `voicings.ts`).

import { noteName, pitchClassName } from './notes'
import { chordSymbol } from './symbol'
import {
  CHORD_CATEGORIES,
  VOICING_ANCHOR,
  VOICINGS,
  alignLowest,
  chordPitchClasses,
  qualityById,
  realizeVoicing,
  type ChordQuality,
  type Voicing,
} from './voicings'

/** Tipo humano de um voicing, derivado do id/estilo — rótulo da variação no dicionário. */
export type VoicingKind =
  | { kind: 'root' } // estado fundamental (fechado ou 0ª inversão)
  | { kind: 'inversion'; n: number } // n-ésima inversão (n ≥ 1)
  | { kind: 'style'; style: string; variant: string } // shell/rootless/quartal (+ letra A/B…)

/** Um shape concreto realizado num tom, pronto para desenhar/tocar. */
export interface VoicingView {
  voicing: Voicing
  kind: VoicingKind
  /** MIDIs soando, ascendentes, nota mais grave ancorada perto do C4 (como no exercício) */
  midis: number[]
  /** nomes das notas deste shape, ascendentes (rootless omite a fundamental) */
  notes: string[]
}

/** Uma qualidade no tom escolhido, com sua cifra, notas e todas as variações. */
export interface DictionaryEntry {
  quality: ChordQuality
  /** cifra no tom (ex.: 'Cmaj7') */
  symbol: string
  /** nomes das notas do acorde COMPLETO (pitch-class set da qualidade) */
  notes: string[]
  /** pitch classes (0–11) do acorde completo */
  pcs: number[]
  /** todas as variações catalogadas desta qualidade, realizadas no tom */
  voicings: VoicingView[]
}

/** Uma categoria de acorde com suas qualidades no tom escolhido. */
export interface DictionarySection {
  categoryId: string
  entries: DictionaryEntry[]
}

/** Todas as variações (voicings) catalogadas de uma qualidade — SEM filtro de estilo. */
export function voicingsOfQuality(qualityId: string): Voicing[] {
  return VOICINGS.filter((v) => v.qualityId === qualityId)
}

/** Realiza um shape num tom, no mesmo registro que o exercício usaria (grave perto do C4). */
export function realizeVoicingAt(voicing: Voicing, rootPc: number): number[] {
  const raw = realizeVoicing(voicing.degrees, VOICING_ANCHOR + rootPc)
  return alignLowest(raw, VOICING_ANCHOR)
}

/**
 * Classifica um voicing pelo id/estilo: inversões (`-inv{n}`) viram "fundamental" (n=0) ou
 * "n-ésima inversão"; fechados (`-close`) são estado fundamental; o resto é rótulo de estilo
 * (shell/rootless/quartal) com a letra da variante (A/B…) quando o id termina em maiúscula.
 */
export function describeVoicing(voicing: Voicing): VoicingKind {
  const numbered = voicing.id.match(/-inv(\d+)$/)
  if (numbered) {
    const n = Number(numbered[1])
    return n === 0 ? { kind: 'root' } : { kind: 'inversion', n }
  }
  if (/-inv$/.test(voicing.id)) return { kind: 'inversion', n: 1 }
  if (/-close$/.test(voicing.id)) return { kind: 'root' }
  const letter = voicing.id.match(/[A-Z]$/)
  return { kind: 'style', style: voicing.style, variant: letter ? letter[0] : '' }
}

/** A entrada do dicionário para uma qualidade no tom dado. */
export function dictionaryEntry(rootPc: number, qualityId: string): DictionaryEntry {
  const quality = qualityById(qualityId)
  const pcs = chordPitchClasses(rootPc, quality)
  const voicings: VoicingView[] = voicingsOfQuality(qualityId).map((voicing) => {
    const midis = realizeVoicingAt(voicing, rootPc)
    return {
      voicing,
      kind: describeVoicing(voicing),
      midis,
      notes: midis.map((m) => noteName(m)),
    }
  })
  return {
    quality,
    symbol: chordSymbol(rootPc, quality),
    notes: pcs.map(pitchClassName),
    pcs,
    voicings,
  }
}

/** Todas as categorias (na ordem canônica) com suas qualidades realizadas no tom dado. */
export function dictionarySections(rootPc: number): DictionarySection[] {
  return CHORD_CATEGORIES.map((cat) => ({
    categoryId: cat.id,
    entries: cat.qualityIds.map((qid) => dictionaryEntry(rootPc, qid)),
  }))
}
