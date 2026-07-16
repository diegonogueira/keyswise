import { type ReactNode } from 'react'
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react'
import { useTranslation, Trans } from 'react-i18next'
import { KeyboardChoice } from './Piano/KeyboardChoice'
import { pitchClassName } from '../core/notes'
import { windowFor } from '../core/piano'
import { qualityById } from '../core/voicings'
import { chordSymbol, chordNoteNames } from '../core/symbol'
import type { ChordSpec } from '../core/exercise'
import type { ExerciseApi } from '../hooks/useExercise'
import { cx } from '../lib/cx'

function symbolOf(spec: ChordSpec): string {
  return chordSymbol(spec.rootPc, qualityById(spec.qualityId))
}

function sameSpec(a: ChordSpec | null, b: ChordSpec): boolean {
  return a != null && a.rootPc === b.rootPc && a.qualityId === b.qualityId
}

function Result({ correct, children }: { correct: boolean; children: ReactNode }) {
  return (
    <div
      className={cx(
        'flex items-center gap-1.5 text-sm font-medium',
        correct ? 'text-correct' : 'text-wrong',
      )}
    >
      {correct ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
      <span>{children}</span>
    </div>
  )
}

interface ExercisePanelProps {
  exercise: ExerciseApi
  compact?: boolean
}

export function ExercisePanel({ exercise, compact = false }: ExercisePanelProps) {
  const { mode, status } = exercise
  const answered = status !== 'idle'
  const correct = status === 'correct'
  const { t } = useTranslation()

  const nextButton = (
    <button
      type="button"
      onClick={exercise.next}
      className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
    >
      {t('exercise.next')} <ArrowRight size={16} />
    </button>
  )

  return (
    <section
      className={cx(
        'rounded-2xl border bg-surface',
        compact ? 'p-3' : 'p-5',
        answered && !correct && 'animate-shake',
        !answered ? 'border-line' : correct ? 'border-correct/40' : 'border-wrong/40',
      )}
    >
      {mode === 'keysToSymbol' ? (
        <KeysToSymbolBody exercise={exercise} compact={compact} nextButton={nextButton} />
      ) : (
        <SymbolToKeysBody exercise={exercise} compact={compact} nextButton={nextButton} />
      )}
    </section>
  )
}

interface BodyProps {
  exercise: ExerciseApi
  compact: boolean
  nextButton: ReactNode
}

/** Modo Teclas → Cifra: o voicing acende no teclado (acima); escolhe-se a cifra. */
function KeysToSymbolBody({ exercise, compact, nextButton }: BodyProps) {
  const { t } = useTranslation()
  const { question, status, chosenSpec } = exercise
  const answered = status !== 'idle'
  const correct = status === 'correct'
  // guarda a troca de modo: por um render o `question` pode ser o do modo anterior (sem este
  // campo) — evita o crash "undefined" enquanto a questão nova não chega.
  if (!question.symbolChoices) return null
  const root = pitchClassName(question.chord.rootPc)
  const target = symbolOf(question.chord)
  const notes = chordNoteNames(question.chord.rootPc, qualityById(question.chord.qualityId))

  return (
    <div className={cx('flex flex-col items-center', compact ? 'gap-2' : 'gap-4')}>
      <p className="text-center text-sm text-muted">
        <Trans
          i18nKey="exercise.keysToSymbol.prompt"
          values={{ root }}
          components={{ root: <span className="font-semibold text-accent" /> }}
        />
      </p>

      <div className={cx('grid w-full gap-2', compact ? 'grid-cols-4' : 'grid-cols-2 sm:grid-cols-4')}>
        {question.symbolChoices.map((spec) => {
          const isCorrect = spec.qualityId === question.chord.qualityId
          const isChosen = sameSpec(chosenSpec, spec)
          const state = !answered
            ? 'idle'
            : isCorrect
              ? 'correct'
              : isChosen
                ? 'wrong'
                : 'dim'
          return (
            <button
              key={`${spec.rootPc}-${spec.qualityId}`}
              type="button"
              disabled={answered}
              onClick={() => exercise.answerSymbol(spec)}
              className={cx(
                'rounded-xl border px-2 py-2.5 text-sm font-semibold transition-colors',
                state === 'idle' && 'border-line bg-surface text-ink hover:border-accent hover:bg-accent-soft',
                state === 'correct' && 'border-correct bg-correct-soft text-correct',
                state === 'wrong' && 'border-wrong bg-wrong-soft text-wrong',
                state === 'dim' && 'border-line bg-surface text-faint',
              )}
            >
              {symbolOf(spec)}
            </button>
          )
        })}
      </div>

      {!answered ? (
        <p className="text-center text-xs text-faint">{t('exercise.keysToSymbol.hint')}</p>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Result correct={correct}>
            {correct
              ? t('exercise.keysToSymbol.correct', { chord: target, notes })
              : t('exercise.keysToSymbol.wrong', {
                  chord: target,
                  chosen: chosenSpec ? symbolOf(chosenSpec) : '—',
                })}
          </Result>
          {nextButton}
        </div>
      )}
    </div>
  )
}

/** Modo Cifra → Teclas: mostra a cifra; escolhe-se, entre 4 teclados, o voicing correto. */
function SymbolToKeysBody({ exercise, compact, nextButton }: BodyProps) {
  const { t } = useTranslation()
  const { question, status, chosenChoiceIdx } = exercise
  const answered = status !== 'idle'
  const correct = status === 'correct'
  if (!question.keyChoices) return null
  const target = symbolOf(question.chord)
  const choices = question.keyChoices
  // janela compartilhada: todas as alternativas no mesmo registro (comparáveis)
  const [lo, hi] = windowFor(choices.flat())

  // correto = mesmo conjunto de pitch classes do voicing correto (question.voicing)
  const correctPcs = new Set(question.voicing.map((m) => ((m % 12) + 12) % 12))
  const isCorrectTile = (midis: number[]) => {
    const pcs = new Set(midis.map((m) => ((m % 12) + 12) % 12))
    return pcs.size === correctPcs.size && [...pcs].every((p) => correctPcs.has(p))
  }

  return (
    <div className={cx('flex flex-col items-center', compact ? 'gap-2' : 'gap-4')}>
      <p className="text-center text-sm text-muted">
        <Trans
          i18nKey="exercise.symbolToKeys.prompt"
          values={{ chord: target }}
          components={{ chord: <span className="text-xl font-bold text-ink" /> }}
        />
      </p>

      <div className="grid w-full grid-cols-2 gap-2.5">
        {choices.map((midis, idx) => {
          const tileCorrect = isCorrectTile(midis)
          const tileChosen = chosenChoiceIdx === idx
          const border = !answered
            ? 'border-line hover:border-accent'
            : tileCorrect
              ? 'border-correct'
              : tileChosen
                ? 'border-wrong'
                : 'border-line opacity-50'
          const variant = answered && tileCorrect ? 'correct' : answered && tileChosen ? 'wrong' : 'accent'
          return (
            <button
              key={idx}
              type="button"
              disabled={answered}
              onClick={() => exercise.answerChoice(idx)}
              className={cx(
                'rounded-xl border-2 bg-surface p-2 transition-colors',
                border,
              )}
            >
              <KeyboardChoice lo={lo} hi={hi} midis={midis} variant={variant} />
            </button>
          )
        })}
      </div>

      {!answered ? (
        <p className="text-center text-xs text-faint">{t('exercise.symbolToKeys.hint')}</p>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Result correct={correct}>
            {correct
              ? t('exercise.symbolToKeys.correct', { chord: target })
              : t('exercise.symbolToKeys.wrong', { chord: target })}
          </Result>
          {nextButton}
        </div>
      )}
    </div>
  )
}
