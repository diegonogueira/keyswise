import { useMemo } from 'react'
import { Piano, type KeyPin } from './Piano/Piano'
import { ExercisePanel } from './ExercisePanel'
import { useSettings, useModuleConfig } from '../store/settings'
import { useExercise } from '../hooks/useExercise'
import { qualityIdsForCategories } from '../core/voicings'
import { windowFor } from '../core/piano'
import { noteName } from '../core/notes'
import type { ExerciseMode, VoicingConfig } from '../core/exercise'
import { playMidi } from '../audio/player'
import { cx } from '../lib/cx'

/**
 * O conteúdo dos modos de exercício (teclado principal + painel). Mora num componente próprio
 * para que `useExercise` só monte nos modos de exercício — nunca no dicionário. Entre os dois
 * modos de exercício este componente persiste (mesma posição no JSX de App), então a troca de
 * modo passa pela regeneração guardada de `useExercise` (ver CLAUDE.md: gotcha da tela branca).
 */
export function ExerciseView({ mode, compact }: { mode: ExerciseMode; compact: boolean }) {
  const audioEnabled = useSettings((s) => s.audioEnabled)
  const { showNoteName } = useModuleConfig(mode)
  const chordCategories = useSettings((s) => s.chordCategories)
  const voicingStyles = useSettings((s) => s.voicingStyles)
  const rootMode = useSettings((s) => s.rootMode)

  // identidade estável: regenera a questão só quando a config muda de fato
  const config = useMemo<VoicingConfig>(
    () => ({
      qualities: qualityIdsForCategories(chordCategories),
      styles: voicingStyles,
      fixedRootPc: rootMode === 'C' ? 0 : null,
    }),
    [chordCategories, voicingStyles, rootMode],
  )

  const exercise = useExercise({
    mode,
    config,
    onReveal: (midi) => {
      if (audioEnabled) void playMidi(midi)
    },
  })
  const { status, question } = exercise
  const answered = status !== 'idle'

  // O teclado principal aparece só no modo Teclas → Cifra (mostra o voicing a identificar).
  // No modo Cifra → Teclas as alternativas (teclados) ficam no painel.
  const showMainPiano = mode === 'keysToSymbol'
  const [lo, hi] = windowFor(question.voicing)
  const pins: KeyPin[] =
    mode === 'keysToSymbol'
      ? question.voicing.map((m) => ({
          midi: m,
          variant: 'accent',
          label: showNoteName || answered ? noteName(m) : undefined,
        }))
      : []
  const focusMidis = mode === 'keysToSymbol' ? question.voicing : []

  return (
    <>
      {showMainPiano && (
        <div
          className={cx(
            'shrink-0 rounded-2xl border border-line bg-surface',
            compact ? 'p-2' : 'p-3 sm:p-4',
          )}
        >
          <Piano
            lo={lo}
            hi={hi}
            pins={pins}
            density={compact ? 'compact' : 'comfortable'}
            focusMidis={focusMidis}
          />
        </div>
      )}

      <ExercisePanel exercise={exercise} compact={compact} />
    </>
  )
}
