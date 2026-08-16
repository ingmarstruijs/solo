import { useEffect, useRef, useState } from 'react'
import {
  createCueHysteresis,
  evaluateFormCues,
  type FormCue,
  type FormCueId,
} from '@/lib/pose/formCues'
import {
  drawPoseOverlay,
  landmarksToPoints,
  loadPoseEngine,
  type PoseEngineStatus,
} from '@/lib/pose/poseEngine'

export type PoseRuntimeState = {
  status: PoseEngineStatus | 'loading'
  cues: FormCue[]
  hasPose: boolean
}

type UsePoseLandmarkerOptions = {
  video: HTMLVideoElement | null
  canvas: HTMLCanvasElement | null
  enabled: boolean
}

function sameCueIds(a: FormCue[], b: FormCue[]): boolean {
  if (a.length !== b.length) return false
  const ids = new Set(a.map((c) => c.id))
  return b.every((c) => ids.has(c.id))
}

/**
 * Runs MediaPipe Pose on a live video element when enabled.
 * Degrades to status "unavailable" without breaking the camera preview.
 */
export function usePoseLandmarker({
  video,
  canvas,
  enabled,
}: UsePoseLandmarkerOptions): PoseRuntimeState {
  const [status, setStatus] = useState<PoseEngineStatus | 'loading'>('idle')
  const [cues, setCues] = useState<FormCue[]>([])
  const [hasPose, setHasPose] = useState(false)
  const hysteresisRef = useRef(createCueHysteresis(8))
  const lastTsRef = useRef(-1)
  const cuesRef = useRef<FormCue[]>([])
  const hasPoseRef = useRef(false)

  useEffect(() => {
    if (!enabled) {
      setStatus('idle')
      setCues([])
      setHasPose(false)
      cuesRef.current = []
      hasPoseRef.current = false
      const ctx = canvas?.getContext('2d')
      if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height)
      return
    }

    let cancelled = false
    let raf = 0
    setStatus('loading')

    void loadPoseEngine().then((engine) => {
      if (cancelled) return
      if (engine.status !== 'ready' || !engine.landmarker) {
        setStatus('unavailable')
        return
      }
      setStatus('ready')

      const landmarker = engine.landmarker
      const hysteresis = hysteresisRef.current

      const tick = () => {
        if (cancelled) return
        const v = video
        const c = canvas
        if (v && c && v.readyState >= 2) {
          const now = performance.now()
          if (v.currentTime !== lastTsRef.current) {
            lastTsRef.current = v.currentTime
            try {
              const result = landmarker.detectForVideo(v, now)
              const pose = result.landmarks[0]
              const ctx = c.getContext('2d')
              if (ctx) {
                if (c.width !== v.videoWidth || c.height !== v.videoHeight) {
                  c.width = v.videoWidth || c.clientWidth
                  c.height = v.videoHeight || c.clientHeight
                }
                if (pose) {
                  const points = landmarksToPoints(pose)
                  const stable = hysteresis(evaluateFormCues(points))
                  if (!hasPoseRef.current) {
                    hasPoseRef.current = true
                    setHasPose(true)
                  }
                  if (!sameCueIds(cuesRef.current, stable)) {
                    cuesRef.current = stable
                    setCues(stable)
                  }
                  drawPoseOverlay(ctx, pose, c.width, c.height, stable.length > 0)
                } else {
                  if (hasPoseRef.current) {
                    hasPoseRef.current = false
                    setHasPose(false)
                  }
                  if (cuesRef.current.length > 0) {
                    cuesRef.current = []
                    setCues([])
                  }
                  ctx.clearRect(0, 0, c.width, c.height)
                }
              }
            } catch {
              // Frame-level failures should not tear down the session camera.
            }
          }
        }
        raf = requestAnimationFrame(tick)
      }

      raf = requestAnimationFrame(tick)
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [enabled, video, canvas])

  return { status, cues, hasPose }
}

export type { FormCueId }
