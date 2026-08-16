import { Link } from 'react-router'
import { useTranslation } from '@/i18n/hooks'

export function NotFoundPage() {
  const { t } = useTranslation('common')
  return (
    <section className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="font-mono text-5xl font-bold text-solo-400">404</p>
      <p className="text-muted">{t('notFoundHint')}</p>
      <Link
        to="/"
        className="rounded-xl bg-surface-2 px-4 py-2 text-sm font-medium text-fg transition-colors active:bg-surface-3"
      >
        {t('back')}
      </Link>
    </section>
  )
}
