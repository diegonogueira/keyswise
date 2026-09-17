// Motor de exercício: gera questões e valida respostas para os dois modos do módulo Voicings.
//
// Modo keysToSymbol (Teclas → Cifra): um voicing (mão direita, possivelmente rootless/invertido)
//   acende no teclado; diz-se a FUNDAMENTAL (ex.: "acorde de C") e o usuário escolhe a cifra
//   entre alternativas de MESMA fundamental (só a qualidade/tensões muda). Valida pelo pitch-class
//   SET COMPLETO da qualidade (octave/inversão-agnóstico).
// Modo symbolToKeys (Cifra → Teclas): mostra-se a cifra; o usuário escolhe, entre 4 teclados,
//   o voicing correto (só 1 certo). As alternativas são voicings de outras qualidades na MESMA
//   fundamental, com conjuntos de teclas distintos. Valida comparando o pitch-class set do
//   teclado escolhido com o do voicing correto (que pode ser rootless).

import type { Rng } from './rng'
import { pick, randInt, shuffle } from './rng'
import {
  ALL_QUALITY_IDS,
  qualityById,
  chordPitchClasses,
  pcSetKey,
  generateVoicing,
  type ChordQuality,
} from './voicings'

/** Lista canônica dos modos do módulo — fonte única da identidade/ordem. */
export const EXERCISE_MODES = ['keysToSymbol', 'symbolToKeys'] as const
export type ExerciseMode = (typeof EXERCISE_MODES)[number]

/** Todos os modos usam o teclado. Espelha `usesFretboard` do fretwise (aqui sempre true). */
export function usesPiano(_mode: ExerciseMode): boolean {
  return true
}

/** Identidade de um acorde: (fundamental, qualidade). */
export interface ChordSpec {
  /** pitch class (0–11) da fundamental */
  rootPc: number
  /** id da qualidade (ver CHORD_QUALITIES) */
  qualityId: string
}

/** Configuração do módulo Voicings. */
export interface VoicingConfig {
  /** ids das qualidades habilitadas (ao menos uma) */
  qualities: string[]
  /** estilos de voicing habilitados (ao menos um; ver VOICING_STYLES) */
  styles: string[]
  /** fundamental fixa (pitch class 0–11) ou null p/ sortear a cada questão */
  fixedRootPc: number | null
}

interface QuestionBase {
  /** identidade do acorde-alvo */
  chord: ChordSpec
  /** pitch classes (0–11) COMPLETOS do acorde — alvo da validação no modo keysToSymbol */
  pcs: number[]
  /** MIDIs (soando) do voicing correto mostrado no teclado (modo keysToSymbol: o que acende;
   *  modo symbolToKeys: o voicing da alternativa correta) */
  voicing: number[]
}

export interface KeysToSymbolQuestion extends QuestionBase {
  mode: 'keysToSymbol'
  /** 4 cifras candidatas (uma correta), MESMA fundamental, pitch sets distintos */
  symbolChoices: ChordSpec[]
}

export interface SymbolToKeysQuestion extends QuestionBase {
  mode: 'symbolToKeys'
  /** 4 voicings (teclados) candidatos — exatamente um casa com `voicing` */
  keyChoices: number[][]
}

/**
 * Uma questão, discriminada pelo `mode`: cada modo tem os seus campos garantidos pelo tipo. Quem
 * desenha a questão decide pelo `question.mode` (não pelo modo da URL), então nunca lê um campo
 * que a questão não tem.
 */
export type Question = KeysToSymbolQuestion | SymbolToKeysQuestion

const DEFAULT_QUALITIES = ['maj', 'min']
const DEFAULT_STYLES = ['basic']

/** Resolve as qualidades habilitadas (tolera ids desconhecidos do localStorage). */
function resolveQualities(cfg: VoicingConfig): string[] {
  const enabled = cfg.qualities.filter((id) => ALL_QUALITY_IDS.includes(id))
  return enabled.length ? enabled : DEFAULT_QUALITIES
}

function resolveStyles(cfg: VoicingConfig): string[] {
  return cfg.styles.length ? cfg.styles : DEFAULT_STYLES
}

function pickRoot(cfg: VoicingConfig, rng: Rng): number {
  return cfg.fixedRootPc == null ? randInt(rng, 12) : ((cfg.fixedRootPc % 12) + 12) % 12
}

function fullPcs(rootPc: number, qualityId: string): number[] {
  return chordPitchClasses(rootPc, qualityById(qualityId))
}

/**
 * 4 cifras candidatas para o modo keysToSymbol: a correta + distratores de MESMA fundamental
 * e qualidade diferente, com pitch-class sets distintos entre si. Completa do catálogo inteiro
 * se as qualidades habilitadas não bastarem; embaralha.
 */
function buildSymbolChoices(answer: ChordSpec, qualities: string[], rng: Rng): ChordSpec[] {
  const seen = new Set<string>([pcSetKey(fullPcs(answer.rootPc, answer.qualityId))])
  const choices: ChordSpec[] = [answer]

  const tryAdd = (qualityId: string) => {
    if (choices.length >= 4 || qualityId === answer.qualityId) return
    const key = pcSetKey(fullPcs(answer.rootPc, qualityId))
    if (seen.has(key)) return
    seen.add(key)
    choices.push({ rootPc: answer.rootPc, qualityId })
  }

  for (const id of shuffle(qualities.slice(), rng)) tryAdd(id)
  for (const id of shuffle(ALL_QUALITY_IDS.slice(), rng)) tryAdd(id)

  return shuffle(choices, rng)
}

/** Modo keysToSymbol: sorteia qualidade + fundamental, mostra um voicing e monta as cifras. */
function generateKeysToSymbol(cfg: VoicingConfig, rng: Rng): KeysToSymbolQuestion {
  const qualities = resolveQualities(cfg)
  const styles = resolveStyles(cfg)
  const qualityId = pick(rng, qualities)
  const rootPc = pickRoot(cfg, rng)
  const chord: ChordSpec = { rootPc, qualityId }
  return {
    mode: 'keysToSymbol',
    chord,
    pcs: fullPcs(rootPc, qualityId),
    voicing: generateVoicing(rootPc, qualityId, styles, rng),
    symbolChoices: buildSymbolChoices(chord, qualities, rng),
  }
}

/**
 * Modo symbolToKeys: sorteia o acorde-alvo e seu voicing; monta 4 teclados (o correto +
 * distratores de outras qualidades na mesma fundamental), com conjuntos de teclas distintos.
 */
function generateSymbolToKeys(cfg: VoicingConfig, rng: Rng): SymbolToKeysQuestion {
  const qualities = resolveQualities(cfg)
  const styles = resolveStyles(cfg)
  const qualityId = pick(rng, qualities)
  const rootPc = pickRoot(cfg, rng)
  const chord: ChordSpec = { rootPc, qualityId }
  const correct = generateVoicing(rootPc, qualityId, styles, rng)

  const seen = new Set<string>([pcSetKey(correct)])
  const choices: number[][] = [correct]

  const tryAdd = (qid: string) => {
    if (choices.length >= 4 || qid === qualityId) return
    const v = generateVoicing(rootPc, qid, styles, rng)
    const key = pcSetKey(v)
    if (seen.has(key)) return
    seen.add(key)
    choices.push(v)
  }

  for (const id of shuffle(qualities.slice(), rng)) tryAdd(id)
  for (const id of shuffle(ALL_QUALITY_IDS.slice(), rng)) tryAdd(id)

  return {
    mode: 'symbolToKeys',
    chord,
    pcs: fullPcs(rootPc, qualityId),
    voicing: correct,
    keyChoices: shuffle(choices, rng),
  }
}

export function generateQuestion(opts: { mode: 'keysToSymbol'; config: VoicingConfig; rng?: Rng }): KeysToSymbolQuestion
export function generateQuestion(opts: { mode: 'symbolToKeys'; config: VoicingConfig; rng?: Rng }): SymbolToKeysQuestion
export function generateQuestion(opts: { mode: ExerciseMode; config: VoicingConfig; rng?: Rng }): Question
export function generateQuestion(opts: {
  mode: ExerciseMode
  config: VoicingConfig
  rng?: Rng
}): Question {
  const rng = opts.rng ?? Math.random
  return opts.mode === 'keysToSymbol'
    ? generateKeysToSymbol(opts.config, rng)
    : generateSymbolToKeys(opts.config, rng)
}

/** Modo keysToSymbol: a cifra escolhida tem o mesmo conjunto de pitch classes do alvo? */
export function checkSymbolAnswer(question: Question, chosen: ChordSpec): boolean {
  return pcSetKey(fullPcs(chosen.rootPc, chosen.qualityId)) === pcSetKey(question.pcs)
}

/** Modo symbolToKeys: o teclado escolhido casa com o voicing correto? (comparação por pitch set;
 *  os distratores têm conjuntos distintos, então a comparação é inequívoca). */
export function checkKeysChoiceAnswer(question: Question, chosenMidis: number[]): boolean {
  return pcSetKey(chosenMidis) === pcSetKey(question.voicing)
}

/** A cifra da qualidade — reexport de conveniência para a UI. */
export function qualityOf(spec: ChordSpec): ChordQuality {
  return qualityById(spec.qualityId)
}
