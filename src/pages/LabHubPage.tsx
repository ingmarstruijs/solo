import { Link } from 'react-router'
import { labs, labHubIcon as LabHubIcon } from '@/config/labs'
import { useTranslation } from '@/i18n/hooks'

export function LabHubPage() {
  const { t } = useTranslation('labs')

  return (
    <section className="flex flex-col gap-5 py-2">
      <header className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-solo-400">
          <LabHubIcon className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="label-mono text-faint">{t('subtitle')}</p>
          <h1 className="text-xl font-bold tracking-tight">{t('hub')}</h1>
          <p className="mt-1 text-sm leading-relaxed text-muted">{t('intro')}</p>
        </div>
      </header>

      <div className="grid gap-3">
        {labs.map(({ id, path, icon: Icon }) => (
          <Link
            key={id}
            to={path}
            className="flex items-start gap-3 rounded-card border border-line bg-surface p-4 transition-colors active:bg-surface-2"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-solo-400">
              <Icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">{t(`items.${id}.label`)}</h2>
                <span className="label-mono shrink-0 text-[10px] text-faint">
                  {t(`items.${id}.pillar`)}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {t(`items.${id}.description`)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
