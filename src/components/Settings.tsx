import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSettings, useModuleConfig } from '../store/settings'
import { Segmented } from './ui/Segmented'
import { CHORD_CATEGORIES, VOICING_STYLES } from '../core/voicings'
import { isExerciseMode, type Route } from '../lib/routes'
import { cx } from '../lib/cx'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-sm text-muted">{label}</span>
      {children}
    </div>
  )
}

function ToggleChips({
  ids,
  active,
  onToggle,
  labelKey,
}: {
  ids: readonly string[]
  active: string[]
  onToggle: (id: string) => void
  labelKey: string
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap gap-1.5 py-2">
      {ids.map((id) => {
        const on = active.includes(id)
        return (
          <button
            key={id}
            type="button"
            onClick={() => onToggle(id)}
            aria-pressed={on}
            className={cx(
              'rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
              on
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-line text-muted hover:border-accent hover:text-ink',
            )}
          >
            {t(`${labelKey}.${id}`)}
          </button>
        )
      })}
    </div>
  )
}

export function SettingsPanel({ route, onClose }: { route: Route; onClose: () => void }) {
  // No dicionário (referência) não há exercício: mostra só o áudio; as demais opções
  // (fundamental, acordes, estilos, nome das notas) configuram o treino e ficam ocultas.
  const isExercise = isExerciseMode(route)
  const mode = isExercise ? route : 'keysToSymbol'
  const audioEnabled = useSettings((s) => s.audioEnabled)
  const setAudioEnabled = useSettings((s) => s.setAudioEnabled)
  const { showNoteName } = useModuleConfig(mode)
  const setShowNoteName = useSettings((s) => s.setShowNoteName)
  const rootMode = useSettings((s) => s.rootMode)
  const setRootMode = useSettings((s) => s.setRootMode)
  const chordCategories = useSettings((s) => s.chordCategories)
  const toggleChordCategory = useSettings((s) => s.toggleChordCategory)
  const voicingStyles = useSettings((s) => s.voicingStyles)
  const toggleVoicingStyle = useSettings((s) => s.toggleVoicingStyle)
  const { t } = useTranslation()

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-surface p-5 shadow-xl sm:rounded-2xl">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-semibold">{t('settings.title')}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('settings.aria.close')}
            className="rounded-lg p-1.5 text-muted hover:bg-line hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        <div className="divide-y divide-line">
          <Row label={t('settings.audio')}>
            <Segmented
              size="sm"
              value={audioEnabled ? 'on' : 'off'}
              onChange={(v) => setAudioEnabled(v === 'on')}
              options={[
                { value: 'on', label: t('settings.audioOn') },
                { value: 'off', label: t('settings.audioOff') },
              ]}
            />
          </Row>

          {isExercise && (
            <Row label={t('settings.root')}>
              <Segmented
                size="sm"
                value={rootMode}
                onChange={setRootMode}
                options={[
                  { value: 'C', label: t('settings.rootC') },
                  { value: 'random', label: t('settings.rootRandom') },
                ]}
              />
            </Row>
          )}
        </div>
        {isExercise && <p className="mt-1 text-xs text-faint">{t('settings.rootHelp')}</p>}

        {isExercise && (
          <>
            <div className="mt-2 border-t border-line pt-3">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-faint">
                {t('settings.moduleSection')}
              </h3>
              <div className="divide-y divide-line">
                <Row label={t('settings.showNoteName')}>
                  <Segmented
                    size="sm"
                    value={showNoteName ? 'on' : 'off'}
                    onChange={(v) => setShowNoteName(mode, v === 'on')}
                    options={[
                      { value: 'on', label: t('settings.yes') },
                      { value: 'off', label: t('settings.no') },
                    ]}
                  />
                </Row>
              </div>
            </div>

            <div className="mt-2 border-t border-line pt-3">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-faint">
                {t('settings.categoriesSection')}
              </h3>
              <ToggleChips
                ids={CHORD_CATEGORIES.map((c) => c.id)}
                active={chordCategories}
                onToggle={toggleChordCategory}
                labelKey="chordCategory"
              />
              <p className="mt-1 text-xs text-faint">{t('settings.categoriesHelp')}</p>
            </div>

            <div className="mt-2 border-t border-line pt-3">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-faint">
                {t('settings.stylesSection')}
              </h3>
              <ToggleChips
                ids={VOICING_STYLES}
                active={voicingStyles}
                onToggle={toggleVoicingStyle}
                labelKey="voicingStyle"
              />
              <p className="mt-1 text-xs text-faint">{t('settings.stylesHelp')}</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
