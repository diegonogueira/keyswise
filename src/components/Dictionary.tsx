import { useState } from 'react'
import { Volume2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { KeyboardChoice } from './Piano/KeyboardChoice'
import { dictionarySections, type VoicingKind } from '../core/dictionary'
import { pitchClassName } from '../core/notes'
import { windowFor } from '../core/piano'
import { useSettings } from '../store/settings'
import { playMidi } from '../audio/player'
import { cx } from '../lib/cx'

const ROOTS = Array.from({ length: 12 }, (_, pc) => pc)

/** Página de referência: todas as qualidades por categoria, suas variações e os 12 tons. */
export function Dictionary({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation()
  const audioEnabled = useSettings((s) => s.audioEnabled)
  const [rootPc, setRootPc] = useState(0)
  const sections = dictionarySections(rootPc)

  const play = (midis: number[]) => {
    if (audioEnabled) void playMidi(midis)
  }

  const voicingLabel = (kind: VoicingKind): string => {
    if (kind.kind === 'root') return t('dictionary.voicing.root')
    if (kind.kind === 'inversion') return t('dictionary.voicing.inversion', { n: kind.n })
    const style = t(`dictionary.style.${kind.style}`)
    return kind.variant ? `${style} ${kind.variant}` : style
  }

  return (
    <div className={cx('flex flex-col', compact ? 'gap-3' : 'gap-6')}>
      {/* seletor de tom — a "opção de todos os tons" */}
      <div className="sticky top-0 z-10 rounded-2xl border border-line bg-surface p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-faint">
            {t('dictionary.rootLabel')}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-faint">
            <Volume2 size={13} /> {t('dictionary.hint')}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ROOTS.map((pc) => (
            <button
              key={pc}
              type="button"
              onClick={() => setRootPc(pc)}
              aria-pressed={pc === rootPc}
              className={cx(
                'min-w-9 rounded-lg border px-2 py-1 text-sm font-medium transition-colors',
                pc === rootPc
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-line text-muted hover:border-accent hover:text-ink',
              )}
            >
              {pitchClassName(pc)}
            </button>
          ))}
        </div>
      </div>

      {sections.map((section) => (
        <section key={section.categoryId} className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-faint">
            {t(`chordCategory.${section.categoryId}`)}
          </h2>
          <div className="flex flex-col gap-3">
            {section.entries.map((entry) => {
              // janela compartilhada por todas as variações da qualidade (registros comparáveis)
              const [lo, hi] = windowFor(entry.voicings.flatMap((v) => v.midis))
              return (
                <div key={entry.quality.id} className="rounded-xl border border-line bg-surface p-3">
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <span className="text-lg font-bold text-ink">{entry.symbol}</span>
                    <span className="text-right text-xs text-muted">{entry.notes.join(' · ')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {entry.voicings.map((view) => (
                      <button
                        key={view.voicing.id}
                        type="button"
                        onClick={() => play(view.midis)}
                        aria-label={`${entry.symbol} — ${voicingLabel(view.kind)}`}
                        className="flex flex-col gap-1 rounded-lg border border-line p-1.5 text-left transition-colors hover:border-accent hover:bg-accent-soft/40"
                      >
                        <KeyboardChoice lo={lo} hi={hi} midis={view.midis} />
                        <div className="px-0.5">
                          <div className="text-[11px] font-medium text-ink">
                            {voicingLabel(view.kind)}
                          </div>
                          <div className="text-[10px] text-faint">{view.notes.join(' ')}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
