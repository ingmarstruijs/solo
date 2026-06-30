import { Play, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import { THEMES, getThemeLabel } from '@/lib/theme/themes'
import { useAutoTranslateWger } from '@/hooks/useAutoTranslateWger'
import { useCoachVoiceGender } from '@/hooks/useCoachVoiceGender'
import { useTheme } from '@/hooks/useTheme'
import { describeCoachVoice, isCoachVoiceSupported, previewCoachVoice } from '@/lib/tv/coachVoice'
import { cn } from '@/lib/cn'

export function SettingsPage() {
  const { theme, preference, setTheme, isAuto } = useTheme()
  const { gender, setGender } = useCoachVoiceGender()
  const { enabled: autoTranslateWger, setEnabled: setAutoTranslateWger } = useAutoTranslateWger()
  const voiceSupported = isCoachVoiceSupported()
  const [activeVoice, setActiveVoice] = useState<string | null>(null)
  const [voiceNote, setVoiceNote] = useState<string | undefined>()

  useEffect(() => {
    if (!voiceSupported) return

    const refresh = () => {
      const voices = window.speechSynthesis.getVoices()
      const info = describeCoachVoice(voices, gender)
      setActiveVoice(info.name)
      setVoiceNote(info.note)
    }

    refresh()
    window.speechSynthesis.addEventListener('voiceschanged', refresh)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', refresh)
  }, [gender, voiceSupported])

  function selectGender(next: 'male' | 'female') {
    setGender(next)
    previewCoachVoice(next)
  }

  return (
    <div className="flex flex-col gap-5 py-2">
      <header className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-surface-2 text-solo-400">
          <Settings className="size-6" />
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Instellingen</h1>
          <p className="text-xs text-muted">Thema en voorkeuren</p>
        </div>
      </header>

      <section className="rounded-card border border-line bg-surface p-4">
        <h2 className="text-sm font-semibold">Thema</h2>
        <p className="mt-1 text-xs text-muted">
          {isAuto
            ? `Automatisch actief — nu ${getThemeLabel(theme)}`
            : 'Handmatig thema gekozen.'}
        </p>
        <ul className="mt-3 flex flex-col gap-2">
          <li>
            <button
              type="button"
              onClick={() => setTheme('auto')}
              className={cn(
                'w-full rounded-xl border p-3 text-left transition-colors active:bg-surface-2',
                isAuto ? 'border-solo-400/50 bg-solo-400/5' : 'border-line',
              )}
            >
              <p className="font-semibold">Automatisch</p>
              <p className="text-xs text-muted">
                Past zich aan op basis van tijd — nu {getThemeLabel(theme)}
              </p>
            </button>
          </li>
          {THEMES.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setTheme(t.id)}
                className={cn(
                  'w-full rounded-xl border p-3 text-left transition-colors active:bg-surface-2',
                  preference === t.id ? 'border-solo-400/50 bg-solo-400/5' : 'border-line',
                )}
              >
                <p className="font-semibold">{t.label}</p>
                <p className="text-xs text-muted">
                  {t.description} · {t.timeRange}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-card border border-line bg-surface p-4">
        <h2 className="text-sm font-semibold">Coachstem</h2>
        <p className="mt-1 text-xs text-muted">
          Kies een mannen- of vrouwenstem voor coach-aankondigingen tijdens een sessie.
        </p>

        {!voiceSupported ? (
          <p className="mt-3 text-xs text-warn">Spraak wordt niet ondersteund in deze browser.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => selectGender('male')}
                className={cn(
                  'flex flex-1 items-center justify-center rounded-xl border p-3 text-sm font-semibold transition-colors',
                  gender === 'male' ? 'border-solo-400/50 bg-solo-400/5' : 'border-line',
                )}
              >
                Man
              </button>
              <button
                type="button"
                onClick={() => selectGender('female')}
                className={cn(
                  'flex flex-1 items-center justify-center rounded-xl border p-3 text-sm font-semibold transition-colors',
                  gender === 'female' ? 'border-solo-400/50 bg-solo-400/5' : 'border-line',
                )}
              >
                Vrouw
              </button>
            </div>
            {activeVoice && (
              <p className="text-[11px] text-faint">
                Stem: {activeVoice}
                {voiceNote && <span className="block text-warn">{voiceNote}</span>}
              </p>
            )}
            <button
              type="button"
              onClick={() => previewCoachVoice(gender)}
              className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface-2 py-2.5 text-sm font-medium text-solo-400 active:bg-surface-3"
            >
              <Play className="size-4" />
              Voorbeeld beluisteren
            </button>
          </div>
        )}
      </section>

      <section className="rounded-card border border-line bg-surface p-4">
        <h2 className="text-sm font-semibold">Wger vertaling</h2>
        <p className="mt-1 text-xs text-muted">
          Vertaal oefenuitleg automatisch naar Nederlands bij import (Duits, Engels, Frans → NL).
        </p>
        <button
          type="button"
          onClick={() => setAutoTranslateWger(!autoTranslateWger)}
          className={cn(
            'mt-3 flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors active:bg-surface-2',
            autoTranslateWger ? 'border-solo-400/50 bg-solo-400/5' : 'border-line',
          )}
        >
          <div>
            <p className="font-semibold">Automatisch vertalen</p>
            <p className="text-xs text-muted">
              {autoTranslateWger ? 'Aan — vertalingen worden gecachet lokaal' : 'Uit — originele taal behouden'}
            </p>
          </div>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
              autoTranslateWger ? 'bg-success/15 text-success' : 'bg-surface-2 text-faint',
            )}
          >
            {autoTranslateWger ? 'Aan' : 'Uit'}
          </span>
        </button>
        <p className="mt-2 text-[11px] text-faint">
          Vereist internet bij import. Tekst wordt via een gratis vertaaldienst verstuurd en daarna lokaal opgeslagen.
        </p>
      </section>

      <section className="rounded-card border border-line bg-surface p-4">
        <h2 className="text-sm font-semibold">Privacy</h2>
        <p className="mt-1 text-xs text-muted">
          Workouts, locker en sessies blijven lokaal. Alleen wger-uitleg kan optioneel online vertaald worden.
        </p>
      </section>
    </div>
  )
}
