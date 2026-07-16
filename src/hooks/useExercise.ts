import { useCallback, useLayoutEffect, useRef, useState } from 'react'
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
  mode: ExerciseMode
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

export function useExercise({ mode, config, onReveal }: UseExerciseArgs): ExerciseApi {
  const [question, setQuestion] = useState<Question>(() => generateQuestion({ mode, config }))
  const [status, setStatus] = useState<Status>('idle')
  const [chosenSpec, setChosenSpec] = useState<ChordSpec | null>(null)
  const [chosenChoiceIdx, setChosenChoiceIdx] = useState<number | null>(null)

  const newQuestion = useCallback(() => {
    setQuestion(generateQuestion({ mode, config }))
    setStatus('idle')
    setChosenSpec(null)
    setChosenChoiceIdx(null)
  }, [mode, config])

  const next = useCallback(() => newQuestion(), [newQuestion])

  // Regenera ao trocar de modo/config. `useLayoutEffect` roda ANTES do paint, então a questão
  // nova entra sem um frame em branco; e o guard nos painéis cobre o render que precede o efeito
  // (onde `question` ainda é do modo anterior e não tem o campo do novo modo). Guardado por um
  // ref de primeira montagem p/ não regenerar à toa na montagem.
  const firstRun = useRef(true)
  useLayoutEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    newQuestion()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, config])

  const answerSymbol = useCallback(
    (spec: ChordSpec) => {
      if (status !== 'idle') return
      const ok = checkSymbolAnswer(question, spec)
      setChosenSpec(spec)
      setStatus(ok ? 'correct' : 'wrong')
      onReveal?.(question.voicing)
    },
    [status, question, onReveal],
  )

  const answerChoice = useCallback(
    (idx: number) => {
      if (status !== 'idle') return
      const chosen = question.keyChoices?.[idx] ?? []
      const ok = checkKeysChoiceAnswer(question, chosen)
      setChosenChoiceIdx(idx)
      setStatus(ok ? 'correct' : 'wrong')
      onReveal?.(chosen)
    },
    [status, question, onReveal],
  )

  return {
    mode,
    question,
    status,
    chosenSpec,
    chosenChoiceIdx,
    answerSymbol,
    answerChoice,
    next,
  }
}
