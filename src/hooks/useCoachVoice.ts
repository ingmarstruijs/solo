import { useEffect, useRef } from 'react'
import { speakCoachLine, stopCoachVoice } from '@/lib/coach/coachVoice'

/** Speaks a coach line once when the key changes. */
export function useCoachAnnouncement(utterance: string | null, key: string, enabled = true): void {
  const lastKeyRef = useRef('')

  useEffect(() => {
    if (!enabled || !utterance?.trim()) return
    if (key === lastKeyRef.current) return
    lastKeyRef.current = key
    speakCoachLine(utterance, key)
  }, [utterance, key, enabled])

  useEffect(() => () => stopCoachVoice(), [])
}
