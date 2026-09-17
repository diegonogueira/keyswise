import { Settings as SettingsIcon, Menu, ChevronUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useHideOnScroll } from '../hooks/useHideOnScroll'
import { cx } from '../lib/cx'
import logoUrl from '../assets/brand/icon.svg'

interface TopBarProps {
  onOpenSettings: () => void
  onToggleSidebar: () => void
  /** paisagem curta: barra enxuta p/ economizar altura */
  compact?: boolean
  /** título do modo ativo — mostrado na barra quando o `<h1>` some (compacto) */
  modeTitle?: string
  /** se definido, mostra o botão de esconder a barra (fullscreen) */
  onHide?: () => void
}

export function TopBar({ onOpenSettings, onToggleSidebar, compact = false, modeTitle, onHide }: TopBarProps) {
  const hidden = useHideOnScroll()
  const { t } = useTranslation()
  return (
    <header
      className={cx(
        'sticky top-0 z-30 border-b border-line bg-surface/80 backdrop-blur',
        'transition-transform duration-300 will-change-transform',
        hidden && !compact && '-translate-y-full',
      )}
      style={{ paddingTop: 'var(--safe-area-inset-top, env(safe-area-inset-top))' }}
    >
      <div className={cx('flex items-center justify-between gap-3 px-4', compact ? 'py-1.5' : 'py-3')}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={t('topbar.aria.openMenu')}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-line hover:text-ink lg:hidden"
          >
            <Menu size={18} />
          </button>
          {/* a mesma arte do ícone do app e do favicon (o nome ao lado já diz o que é) */}
          <img src={logoUrl} alt="" aria-hidden className={cx('shrink-0', compact ? 'h-5 w-5' : 'h-6 w-6')} />
          <div className="flex items-baseline gap-2">
            <span className={cx('font-semibold tracking-tight', compact ? 'text-base' : 'text-lg')}>
              Keyswise
            </span>
            {compact ? (
              modeTitle && <span className="text-xs text-faint">· {modeTitle}</span>
            ) : (
              <span className="hidden text-xs text-faint sm:inline">{t('topbar.subtitle')}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label={t('topbar.aria.settings')}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-line hover:text-ink"
          >
            <SettingsIcon size={18} />
          </button>
          {onHide && (
            <button
              type="button"
              onClick={onHide}
              aria-label={t('topbar.aria.hideBar')}
              className="rounded-lg p-2 text-muted transition-colors hover:bg-line hover:text-ink"
            >
              <ChevronUp size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
