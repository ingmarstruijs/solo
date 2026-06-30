import type { WorkoutExport, WorkoutTemplate } from '@/types/workout'
import { appUrl } from '@/lib/appBase'

const SHARE_PARAM = 'w'

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(token: string): Uint8Array {
  const padded = token.replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  const binary = atob(padded + pad)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export function encodeWorkoutShare(exportData: WorkoutExport): string {
  const json = JSON.stringify(exportData)
  return toBase64Url(new TextEncoder().encode(json))
}

export function decodeWorkoutShare(token: string): WorkoutExport | null {
  try {
    const json = new TextDecoder().decode(fromBase64Url(token))
    const data = JSON.parse(json) as WorkoutExport
    if (data.version !== 1 || !Array.isArray(data.workouts) || data.workouts.length === 0) {
      return null
    }
    return data
  } catch {
    return null
  }
}

export function buildWorkoutShareUrl(workout: WorkoutTemplate): string {
  const payload: WorkoutExport = {
    version: 1,
    exportedAt: new Date().toISOString(),
    workouts: [workout],
  }
  const token = encodeWorkoutShare(payload)
  return `${appUrl('/workouts/share')}?${SHARE_PARAM}=${token}`
}

export function readWorkoutShareFromLocation(search: string): WorkoutExport | null {
  const token = new URLSearchParams(search).get(SHARE_PARAM)
  if (!token) return null
  return decodeWorkoutShare(token)
}

export async function shareWorkoutLink(workout: WorkoutTemplate): Promise<'shared' | 'copied'> {
  const url = buildWorkoutShareUrl(workout)

  if (navigator.share) {
    try {
      await navigator.share({
        title: workout.name,
        text: `SOLO workout: ${workout.name}`,
        url,
      })
      return 'shared'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err
    }
  }

  await navigator.clipboard.writeText(url)
  return 'copied'
}