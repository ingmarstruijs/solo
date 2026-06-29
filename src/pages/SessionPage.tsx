import { Play } from 'lucide-react'
import { Placeholder } from '@/components/Placeholder'

export function SessionPage() {
  return (
    <Placeholder
      icon={Play}
      title="Sessie"
      description="Hier bestuur je je actieve training: sets, reps, rust en laps/timing. De telefoon is de controller; verbind optioneel met je TV en Garmin voor live telemetrie."
    />
  )
}
