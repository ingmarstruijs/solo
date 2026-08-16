import { Heart, Play, Settings, Watch } from 'lucide-react'
import { useEffect, useState } from 'react'
import { RecoverySlider } from '@/components/workout/RecoverySlider'
import { THEMES, getThemeDescription, getThemeLabel } from '@/lib/theme/themes'
import { useAutoTranslateWger } from '@/hooks/useAutoTranslateWger'
import { useCoachVoiceGender } from '@/hooks/useCoachVoiceGender'
import { useGarminConnected } from '@/hooks/useGarminConnected'
import { useLiveHeartRate } from '@/hooks/useLiveHeartRate'
import { useRecoveryScore } from '@/hooks/useRecoveryScore'
import { useTheme } from '@/hooks/useTheme'
import { useLocale, useTranslation } from '@/i18n/hooks'
import type { AppLocale } from '@/i18n/registry'
import { describeCoachVoice, isCoachVoiceSupported, previewCoachVoice } from '@/lib/tv/coachVoice'
import { cn } from '@/lib/cn'

export function SettingsPage() {
  const { t } = useTranslation(['settings', 'common'])
  const { locale, setLocale, locales } = useLocale()
  const { theme, preference, setTheme, isAuto } = useTheme()
  const { gender, setGender } = useCoachVoiceGender()
  const { enabled: autoTranslateWger, setEnabled: setAutoTranslateWger } = useAutoTranslateWger()
  const { connected: garminConnected, setConnected: setGarminConnected } = useGarminConnected()
  const { score: recoveryScore, setScore: setRecoveryScore } = useRecoveryScore()
  const heartRate = useLiveHeartRate()
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
  }, [gender, voiceSupported, locale])

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
          <h1 className="text-xl font-bold tracking-tight">{t('settings:title')}</h1>
          <p className="text-xs text-muted">{t('settings:subtitle')}</p>
        </div>
      </header>

      <section className="rounded-card border border-line bg-surface p-4">
        <h2 className="text-sm font-semibold">{t('settings:language.title')}</h2>
        <p className="mt-1 text-xs text-muted">{t('settings:language.subtitle')}</p>
        <ul className="mt-3 flex flex-col gap-2">
          {locales.map((item) => (
            <li key={item.code}>
              <button
                type="button"
                onClick={() => setLocale(item.code as AppLocale)}
                className={cn(
                  'w-full rounded-xl border p-3 text-left transition-colors active:bg-surface-2',
                  locale === item.code ? 'border-solo-400/50 bg-solo-400/5' : 'border-line',
                )}
              >
                <p className="font-semibold">{item.nativeName}</p>
                <p className="text-xs text-muted uppercase tracking-wide">{item.code}</p>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-card border border-line bg-surface p-4">
        <h2 className="text-sm font-semibold">{t('settings:theme.title')}</h2>
        <p className="mt-1 text-xs text-muted">
          {isAuto
            ? t('settings:theme.autoActive', { theme: getThemeLabel(theme) })
            : t('settings:theme.manual')}
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
              <p className="font-semibold">{t('settings:theme.auto')}</p>
              <p className="text-xs text-muted">
                {t('settings:theme.autoHint', { theme: getThemeLabel(theme) })}
              </p>
            </button>
          </li>
          {THEMES.map((themeOption) => (
            <li key={themeOption.id}>
              <button
                type="button"
                onClick={() => setTheme(themeOption.id)}
                className={cn(
                  'w-full rounded-xl border p-3 text-left transition-colors active:bg-surface-2',
                  preference === themeOption.id ? 'border-solo-400/50 bg-solo-400/5' : 'border-line',
                )}
              >
                <p className="font-semibold">{getThemeLabel(themeOption.id)}</p>
                <p className="text-xs text-muted">
                  {getThemeDescription(themeOption.id)} · {themeOption.timeRange}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-card border border-line bg-surface p-4">
        <h2 className="text-sm font-semibold">{t('settings:coach.title')}</h2>
        <p className="mt-1 text-xs text-muted">{t('settings:coach.subtitle')}</p>

        {!voiceSupported ? (
          <p className="mt-3 text-xs text-warn">{t('settings:coach.unsupported')}</p>
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
                {t('settings:coach.male')}
              </button>
              <button
                type="button"
                onClick={() => selectGender('female')}
                className={cn(
                  'flex flex-1 items-center justify-center rounded-xl border p-3 text-sm font-semibold transition-colors',
                  gender === 'female' ? 'border-solo-400/50 bg-solo-400/5' : 'border-line',
                )}
              >
                {t('settings:coach.female')}
              </button>
            </div>
            {activeVoice && (
              <p className="text-[11px] text-faint">
                {t('settings:coach.voice', { name: activeVoice })}
                {voiceNote && <span className="block text-warn">{voiceNote}</span>}
              </p>
            )}
            <button
              type="button"
              onClick={() => previewCoachVoice(gender)}
              className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface-2 py-2.5 text-sm font-medium text-solo-400 active:bg-surface-3"
            >
              <Play className="size-4" />
              {t('settings:coach.preview')}
            </button>
          </div>
        )}
      </section>

      <section className="rounded-card border border-line bg-surface p-4">
        <h2 className="text-sm font-semibold">{t('settings:garmin.title')}</h2>
        <p className="mt-1 text-xs text-muted">{t('settings:garmin.subtitle')}</p>
        <button
          type="button"
          onClick={() => setGarminConnected(!garminConnected)}
          className={cn(
            'mt-3 flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors active:bg-surface-2',
            garminConnected ? 'border-solo-400/50 bg-solo-400/5' : 'border-line',
          )}
        >
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-surface-2 text-solo-400">
              <Watch className="size-4" />
            </span>
            <div>
              <p className="font-semibold">{t('settings:garmin.wearable')}</p>
              <p className="text-xs text-muted">
                {garminConnected
                  ? t('settings:garmin.wearableOn')
                  : t('settings:garmin.wearableOff')}
              </p>
            </div>
          </div>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
              garminConnected ? 'bg-success/15 text-success' : 'bg-surface-2 text-faint',
            )}
          >
            {garminConnected ? t('common:on') : t('common:off')}
          </span>
        </button>

        {garminConnected && (
          <div className="mt-3 flex flex-col gap-3">
            <RecoverySlider
              id="settings-recovery-score"
              score={recoveryScore}
              onChange={setRecoveryScore}
            />

            <button
              type="button"
              onClick={() =>
                heartRate.status === 'connected' || heartRate.status === 'connecting'
                  ? heartRate.disconnect()
                  : heartRate.connect()
              }
              className={cn(
                'flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors active:bg-surface-2',
                heartRate.live ? 'border-success/40 bg-success/5' : 'border-line',
              )}
            >
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-surface-2 text-solo-400">
                  <Heart className="size-4" />
                </span>
                <div>
                  <p className="font-semibold">{t('settings:garmin.hrBand')}</p>
                  <p className="text-xs text-muted">
                    {heartRate.status === 'connecting'
                      ? t('settings:garmin.hrConnecting')
                      : heartRate.live
                        ? t('settings:garmin.hrLive', {
                            device: heartRate.deviceName ?? '—',
                            bpm: heartRate.bpm ?? '—',
                          })
                        : t('settings:garmin.hrIdle')}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                  heartRate.live ? 'bg-success/15 text-success' : 'bg-surface-2 text-faint',
                )}
              >
                {heartRate.status === 'connecting'
                  ? '…'
                  : heartRate.live
                    ? t('common:live')
                    : t('settings:garmin.hrPair')}
              </span>
            </button>
            {heartRate.error && <p className="text-[11px] text-warn">{heartRate.error}</p>}
            <p className="text-[11px] text-faint">{t('settings:garmin.hrHint')}</p>
          </div>
        )}
      </section>

      <section className="rounded-card border border-line bg-surface p-4">
        <h2 className="text-sm font-semibold">{t('settings:wger.title')}</h2>
        <p className="mt-1 text-xs text-muted">{t('settings:wger.subtitle')}</p>
        <button
          type="button"
          onClick={() => setAutoTranslateWger(!autoTranslateWger)}
          className={cn(
            'mt-3 flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors active:bg-surface-2',
            autoTranslateWger ? 'border-solo-400/50 bg-solo-400/5' : 'border-line',
          )}
        >
          <div>
            <p className="font-semibold">{t('settings:wger.auto')}</p>
            <p className="text-xs text-muted">
              {autoTranslateWger ? t('settings:wger.autoOn') : t('settings:wger.autoOff')}
            </p>
          </div>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
              autoTranslateWger ? 'bg-success/15 text-success' : 'bg-surface-2 text-faint',
            )}
          >
            {autoTranslateWger ? t('common:on') : t('common:off')}
          </span>
        </button>
        <p className="mt-2 text-[11px] text-faint">{t('settings:wger.privacy')}</p>
      </section>

      <section className="rounded-card border border-line bg-surface p-4">
        <h2 className="text-sm font-semibold">{t('settings:privacy.title')}</h2>
        <p className="mt-1 text-xs text-muted">{t('settings:privacy.body')}</p>
      </section>
    </div>
  )
}
