// A questão da vez. É regenerada DURANTE O RENDER quando o modo ou a config mudam (o padrão do
// React para "ajustar estado quando a prop muda"), nunca num efeito: um efeito deixaria um
// quadro com a questão do modo anterior na tela, e o painel do modo novo leria campos que ela
// não tem.

import { useState } from 'react'
import {
  generateQuestion,
  checkSymbolAnswer,
  checkKeysChoiceAnswer,
  type Question,
  type ExerciseMode,
  type VoicingConfig,
  type ChordSpec,
} from '../core/exercise'

export type Status = 'idle' | 'correct' | 'wrong'

interface UseExerciseArgs {
  /** modo ativo — controlado externamente (vem da URL) */
  mode: ExerciseMode
  /** configuração do módulo Voicings (qualidades, estilos, fundamental) */
  config: VoicingConfig
  /** chamado quando uma resposta é dada, com o(s) MIDI(s) a soar (para o áudio) */
  onReveal?: (midi: number | number[]) => void
}

export interface ExerciseApi {
  question: Question
  status: Status
  /** modo keysToSymbol: cifra escolhida */
  chosenSpec: ChordSpec | null
  /** modo symbolToKeys: índice do teclado escolhido */
  chosenChoiceIdx: number | null
  /** modo keysToSymbol: escolhe uma cifra */
  answerSymbol: (spec: ChordSpec) => void
  /** modo symbolToKeys: escolhe um teclado (por índice na `keyChoices`) */
  answerChoice: (idx: number) => void
  next: () => void
}

interface State {
  /** o modo e a config que geraram esta questão */
  sig: string
  question: Question
  status: Status
  chosenSpec: ChordSpec | null
  chosenChoiceIdx: number | null
}

/** O que, mudando, pede outra questão: o modo e a config (que o pai memoiza). */
function signatureOf(mode: ExerciseMode, config: VoicingConfig): string {
  return JSON.stringify([mode, config])
}

function fresh(mode: ExerciseMode, config: VoicingConfig): State {
  return {
    sig: signatureOf(mode, config),
    question: generateQuestion({ mode, config }),
    status: 'idle',
    chosenSpec: null,
    chosenChoiceIdx: null,
  }
}

export function useExercise({ mode, config, onReveal }: UseExerciseArgs): ExerciseApi {
  const [stored, setState] = useState<State>(() => fresh(mode, config))
  let state = stored
  if (stored.sig !== signatureOf(mode, config)) {
    // ajuste de estado durante o render: o React descarta este render e refaz com a questão
    // nova, antes de pintar; e mesmo neste render já não se usa a questão velha
    state = fresh(mode, config)
    setState(state)
  }
  const { question, status } = state

  const answerSymbol = (spec: ChordSpec) => {
    if (status !== 'idle' || question.mode !== 'keysToSymbol') return
    const ok = checkSymbolAnswer(question, spec)
    setState({ ...state, chosenSpec: spec, status: ok ? 'correct' : 'wrong' })
    onReveal?.(question.voicing)
  }

  const answerChoice = (idx: number) => {
    if (status !== 'idle' || question.mode !== 'symbolToKeys') return
    const chosen = question.keyChoices[idx] ?? []
    const ok = checkKeysChoiceAnswer(question, chosen)
    setState({ ...state, chosenChoiceIdx: idx, status: ok ? 'correct' : 'wrong' })
    onReveal?.(chosen)
  }

  return {
    question,
    status,
    chosenSpec: state.chosenSpec,
    chosenChoiceIdx: state.chosenChoiceIdx,
    answerSymbol,
    answerChoice,
    next: () => setState(fresh(mode, config)),
  }
}
