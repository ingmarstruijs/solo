import type {
  DrawingUtils as DrawingUtilsType,
  NormalizedLandmark,
  PoseLandmarker,
} from '@mediapipe/tasks-vision'
import type { PosePoint } from './formCues'

export type PoseEngineStatus = 'idle' | 'loading' | 'ready' | 'unavailable'

export type PoseEngine = {
  status: PoseEngineStatus
  landmarker: PoseLandmarker | null
  error: string | null
}

type VisionModule = typeof import('@mediapipe/tasks-vision')

let enginePromise: Promise<PoseEngine> | null = null
let visionModule: VisionModule | null = null
let poseConnections: VisionModule['PoseLandmarker']['POSE_CONNECTIONS'] | null = null

function assetBase(): string {
  const base = import.meta.env.BASE_URL || '/'
  return base.endsWith('/') ? base : `${base}/`
}

/** Load Pose Landmarker once (lite model + local wasm). Degrades to unavailable on failure. */
export function loadPoseEngine(): Promise<PoseEngine> {
  if (enginePromise) return enginePromise

  enginePromise = (async (): Promise<PoseEngine> => {
    try {
      const vision = await import('@mediapipe/tasks-vision')
      visionModule = vision
      const base = assetBase()
      const fileset = await vision.FilesetResolver.forVisionTasks(`${base}mediapipe/wasm`)
      const landmarker = await vision.PoseLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: `${base}mediapipe/pose_landmarker_lite.task`,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })
      poseConnections = vision.PoseLandmarker.POSE_CONNECTIONS
      return { status: 'ready', landmarker, error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { status: 'unavailable', landmarker: null, error: message }
    }
  })()

  return enginePromise
}

export function resetPoseEngineForTests(): void {
  enginePromise = null
  visionModule = null
  poseConnections = null
}

export function landmarksToPoints(landmarks: NormalizedLandmark[]): PosePoint[] {
  return landmarks.map((lm) => ({
    x: lm.x,
    y: lm.y,
    z: lm.z,
    visibility: lm.visibility,
  }))
}

export function drawPoseOverlay(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  width: number,
  height: number,
  warn: boolean,
): void {
  ctx.clearRect(0, 0, width, height)
  if (landmarks.length === 0 || !visionModule) return

  const utils: DrawingUtilsType = new visionModule.DrawingUtils(ctx)
  const color = warn ? '#ff6b6b' : '#7cb3f0'
  utils.drawLandmarks(landmarks, {
    radius: 3,
    color,
    fillColor: color,
    lineWidth: 1,
  })
  if (poseConnections) {
    utils.drawConnectors(landmarks, poseConnections, {
      color,
      lineWidth: 3,
    })
  }
}
