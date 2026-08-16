import { Share2 } from 'lucide-react'
import { Placeholder } from '@/components/Placeholder'
import { useTranslation } from '@/i18n/hooks'

export function IntegrationsPage() {
  const { t } = useTranslation('about')

  return (
    <Placeholder
      icon={Share2}
      title={t('integrationsTitle')}
      description={t('integrationsBody')}
    />
  )
}
