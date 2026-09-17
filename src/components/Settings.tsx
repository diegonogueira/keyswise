// Toda a configuração mora aqui (nada de ajuste solto na tela do exercício), em escopos, de
// cima para baixo:
// - GERAL: vale para o app inteiro (som e fundamental);
// - o EXERCÍCIO aberto: o nome das notas (cada exercício lembra o seu) e os acordes e estilos
//   praticados (os dois exercícios dividem esses);
// - "Restaurar padrões", por último. "Redefinir tudo" mora no menu.
// No dicionário não há exercício: só o som.

import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CHORD_CATEGORIES, VOICING_STYLES } from '../core/voicings'
import type { ExerciseMode } from '../core/exercise'
import { isExerciseMode, type Route } from '../lib/routes'
import { useModuleConfig, useSettings } from '../store/settings'
import { Chip } from './settings/Chip'
import { FactoryReset } from './settings/FactoryReset'
import { Row } from './settings/Row'
import { Section } from './settings/Section'
import { Segmented } from './ui/Segmented'

function useOnOff() {
  const { t } = useTranslation()
  return [
    { value: 'on' as const, label: t('settings.on') },
    { value: 'off' as const, label: t('settings.off') },
  ]
}

/** Ajustes do exercício aberto. */
function ExerciseSettings({ mode }: { mode: ExerciseMode }) {
  const { showNoteName } = useModuleConfig(mode)
  const setShowNoteName = useSettings((s) => s.setShowNoteName)
  const chordCategories = useSettings((s) => s.chordCategories)
  const toggleChordCategory = useSettings((s) => s.toggleChordCategory)
  const voicingStyles = useSettings((s) => s.voicingStyles)
  const toggleVoicingStyle = useSettings((s) => s.toggleVoicingStyle)
  const onOff = useOnOff()
  const { t } = useTranslation()

  return (
    <>
      <Section title={t(`nav.item.${mode}`)} help={t('settings.moduleHelp')}>
        <div className="divide-y divide-line">
          <Row label={t('settings.showNoteName')}>
            <Segmented
              size="sm"
              value={showNoteName ? 'on' : 'off'}
              onChange={(v) => setShowNoteName(mode, v === 'on')}
              options={onOff}
            />
          </Row>
        </div>
      </Section>

      <Section title={t('settings.categoriesSection')} help={t('settings.categoriesHelp')}>
        <div className="flex flex-wrap gap-1.5 py-2">
          {CHORD_CATEGORIES.map((c) => (
            <Chip key={c.id} on={chordCategories.includes(c.id)} onClick={() => toggleChordCategory(c.id)}>
              {t(`chordCategory.${c.id}`)}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title={t('settings.stylesSection')} help={t('settings.stylesHelp')}>
        <div className="flex flex-wrap gap-1.5 py-2">
          {VOICING_STYLES.map((id) => (
            <Chip key={id} on={voicingStyles.includes(id)} onClick={() => toggleVoicingStyle(id)}>
              {t(`voicingStyle.${id}`)}
            </Chip>
          ))}
        </div>
      </Section>
    </>
  )
}

export function SettingsPanel({ route, onClose }: { route: Route; onClose: () => void }) {
  const isExercise = isExerciseMode(route)
  const audioEnabled = useSettings((s) => s.audioEnabled)
  const setAudioEnabled = useSettings((s) => s.setAudioEnabled)
  const rootMode = useSettings((s) => s.rootMode)
  const setRootMode = useSettings((s) => s.setRootMode)
  const resetModule = useSettings((s) => s.resetModule)
  const onOff = useOnOff()
  const { t } = useTranslation()

  return (
    // bottom-sheet no celular, centrado a partir de `sm`
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

        <Section first title={t('settings.general')} help={t(isExercise ? 'settings.generalHelp' : 'settings.generalHelpDictionary')}>
          <div className="divide-y divide-line">
            <Row label={t('settings.audio')}>
              <Segmented
                size="sm"
                value={audioEnabled ? 'on' : 'off'}
                onChange={(v) => setAudioEnabled(v === 'on')}
                options={onOff}
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
        </Section>

        {isExercise && (
          <>
            <ExerciseSettings mode={route} />
            {/* por último: é a ação mais drástica do modal e desfaz o que vem acima */}
            <FactoryReset onReset={() => resetModule(route)} />
          </>
        )}
      </div>
    </div>
  )
}
