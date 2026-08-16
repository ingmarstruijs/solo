/** MediaPipe Pose Landmarker landmark indices (BlazePose). */
export const PoseLandmark = {
  nose: 0,
  leftShoulder: 11,
  rightShoulder: 12,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
} as const

export type PosePoint = {
  x: number
  y: number
  z: number
  visibility?: number
}

export type FormCueId = 'knee_valgus' | 'forward_collapse'

export type FormCue = {
  id: FormCueId
  /** i18n key under session namespace */
  messageKey: 'formCueKneeValgus' | 'formCueForwardCollapse'
}

const MIN_VISIBILITY = 0.55

function visible(...points: PosePoint[]): boolean {
  return points.every((p) => (p.visibility ?? 1) >= MIN_VISIBILITY)
}

/**
 * Frontal-ish knee cave: knees markedly narrower than hips and ankles.
 * Advisory only — not a medical assessment.
 */
export function detectKneeValgus(landmarks: PosePoint[]): boolean {
  const lHip = landmarks[PoseLandmark.leftHip]
  const rHip = landmarks[PoseLandmark.rightHip]
  const lKnee = landmarks[PoseLandmark.leftKnee]
  const rKnee = landmarks[PoseLandmark.rightKnee]
  const lAnkle = landmarks[PoseLandmark.leftAnkle]
  const rAnkle = landmarks[PoseLandmark.rightAnkle]
  if (!lHip || !rHip || !lKnee || !rKnee || !lAnkle || !rAnkle) return false
  if (!visible(lHip, rHip, lKnee, rKnee, lAnkle, rAnkle)) return false

  const hipWidth = Math.abs(lHip.x - rHip.x)
  const kneeWidth = Math.abs(lKnee.x - rKnee.x)
  const ankleWidth = Math.abs(lAnkle.x - rAnkle.x)
  if (hipWidth < 0.08 || ankleWidth < 0.06) return false

  return kneeWidth < hipWidth * 0.72 && kneeWidth < ankleWidth * 0.82
}

/**
 * Excessive forward torso collapse: shoulders much closer to camera than hips
 * while the torso is compressed in frame. Advisory only.
 */
export function detectForwardCollapse(landmarks: PosePoint[]): boolean {
  const lShoulder = landmarks[PoseLandmark.leftShoulder]
  const rShoulder = landmarks[PoseLandmark.rightShoulder]
  const lHip = landmarks[PoseLandmark.leftHip]
  const rHip = landmarks[PoseLandmark.rightHip]
  if (!lShoulder || !rShoulder || !lHip || !rHip) return false
  if (!visible(lShoulder, rShoulder, lHip, rHip)) return false

  const midShoulderZ = (lShoulder.z + rShoulder.z) / 2
  const midHipZ = (lHip.z + rHip.z) / 2
  const midShoulderY = (lShoulder.y + rShoulder.y) / 2
  const midHipY = (lHip.y + rHip.y) / 2
  const torsoHeight = midHipY - midShoulderY
  if (torsoHeight < 0.12) return false

  return midShoulderZ < midHipZ - 0.18 && torsoHeight < 0.32
}

export function evaluateFormCues(landmarks: PosePoint[]): FormCue[] {
  const cues: FormCue[] = []
  if (detectKneeValgus(landmarks)) {
    cues.push({ id: 'knee_valgus', messageKey: 'formCueKneeValgus' })
  }
  if (detectForwardCollapse(landmarks)) {
    cues.push({ id: 'forward_collapse', messageKey: 'formCueForwardCollapse' })
  }
  return cues
}

/** Require consecutive hits before surfacing a cue (reduces flicker). */
export function createCueHysteresis(framesRequired = 8) {
  const counts = new Map<FormCueId, number>()

  return function update(active: FormCue[]): FormCue[] {
    const activeIds = new Set(active.map((c) => c.id))
    for (const id of ['knee_valgus', 'forward_collapse'] as FormCueId[]) {
      const next = activeIds.has(id) ? (counts.get(id) ?? 0) + 1 : 0
      counts.set(id, next)
    }
    return active.filter((cue) => (counts.get(cue.id) ?? 0) >= framesRequired)
  }
}
