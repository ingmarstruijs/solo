import { Logo } from '@/components/Logo'
import { useTranslation } from '@/i18n/hooks'

export function AboutPage() {
  const { t } = useTranslation('about')

  return (
    <section className="flex flex-col gap-5 py-2">
      <Logo size={36} />
      <p className="text-sm leading-relaxed text-muted">{t('body')}</p>
      <ul className="flex flex-col gap-2 text-sm">
        <li className="flex justify-between border-b border-line py-2">
          <span className="text-muted">{t('version')}</span>
          <span className="font-mono">0.1.0</span>
        </li>
        <li className="flex justify-between border-b border-line py-2">
          <span className="text-muted">{t('license')}</span>
          <span className="font-mono">MIT</span>
        </li>
      </ul>
    </section>
  )
}
