import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cx } from '../../lib/cx'

/**
 * "Restaurar padrões": o último item do modal, porque desfaz tudo o que vem acima. Pede
 * confirmação no próprio botão (um toque arma, o outro confirma; perder o foco desarma): é um
 * clique só e apaga escolhas feitas à mão. O histórico de estudo não é mexido.
 */
export function FactoryReset({ onReset }: { onReset: () => void }) {
  const [armed, setArmed] = useState(false)
  const { t } = useTranslation()

  return (
    <div className="mt-2 flex items-center justify-between gap-3 border-t border-line pt-3">
      <span className="text-xs text-faint">{t('settings.factoryHelp')}</span>
      <button
        type="button"
        onClick={() => {
          if (!armed) {
            setArmed(true)
            return
          }
          onReset()
          setArmed(false)
        }}
        onBlur={() => setArmed(false)}
        className={cx(
          'flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
          armed ? 'border-wrong bg-wrong-soft text-wrong' : 'border-line text-muted hover:border-accent hover:text-accent',
        )}
      >
        <RotateCcw size={12} />
        {armed ? t('settings.factoryConfirm') : t('settings.factory')}
      </button>
    </div>
  )
}
