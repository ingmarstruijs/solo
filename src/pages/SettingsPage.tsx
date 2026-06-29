import { Settings } from 'lucide-react'
import { Placeholder } from '@/components/Placeholder'

export function SettingsPage() {
  return (
    <Placeholder
      icon={Settings}
      title="Instellingen"
      description="Beheer je voorkeuren: coach-stijl (Screamer, Mid-Line, Ambient), eenheden, taal en privacy. Alle data blijft op je apparaat."
    />
  )
}
