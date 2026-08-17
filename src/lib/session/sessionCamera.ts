/** Live session camera stream + short rolling video clips for proof reels. */

let liveStream: MediaStream | null = null

type RecorderState = {
  recorder: MediaRecorder
  chunks: Blob[]
  mimeType: string
}

let recorderState: RecorderState | null = null

export function setLiveSessionCameraStream(stream: MediaStream | null): void {
  liveStream = stream
  if (!stream) discardLiveCameraRecording()
}

export function getLiveSessionCameraStream(): MediaStream | null {
  return liveStream
}

function pickRecorderMimeType(): string | null {
  if (typeof MediaRecorder === 'undefined') return null
  const candidates = [
    'video/webm;codecs=vp8',
    'video/webm;codecs=vp9',
    'video/webm',
    'video/mp4',
  ]
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? null
}

/** Start (or restart) a rolling ~4s buffer from the live session camera. */
export function startLiveCameraRecording(): boolean {
  discardLiveCameraRecording()
  const stream = liveStream
  const mimeType = pickRecorderMimeType()
  if (!stream || stream.getVideoTracks().length === 0 || !mimeType) return false

  try {
    const chunks: Blob[] = []
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 1_200_000,
    })
    recorder.ondataavailable = (event) => {
      if (!event.data || event.data.size <= 0) return
      chunks.push(event.data)
      // Keep roughly the last 4 seconds (1s timeslice).
      while (chunks.length > 4) chunks.shift()
    }
    recorder.start(1000)
    recorderState = { recorder, chunks, mimeType }
    return true
  } catch {
    recorderState = null
    return false
  }
}

/** Stop the rolling recorder and return the buffered clip (or null). */
export function stopLiveCameraRecording(): Promise<Blob | null> {
  const current = recorderState
  if (!current) return Promise.resolve(null)
  recorderState = null

  const { recorder, chunks, mimeType } = current
  return new Promise((resolve) => {
    const finish = () => {
      const blob = new Blob(chunks, { type: mimeType.split(';')[0] || mimeType })
      resolve(blob.size > 500 ? blob : null)
    }

    if (recorder.state === 'inactive') {
      finish()
      return
    }

    recorder.onstop = () => finish()
    try {
      if (recorder.state === 'recording') recorder.requestData()
      recorder.stop()
    } catch {
      finish()
    }
  })
}

export function discardLiveCameraRecording(): void {
  const current = recorderState
  if (!current) return
  recorderState = null
  try {
    current.recorder.ondataavailable = null
    current.recorder.onstop = null
    if (current.recorder.state !== 'inactive') current.recorder.stop()
  } catch {
    // ignore
  }
}

/** JPEG fallback when MediaRecorder is unavailable. */
export async function captureLiveCameraJpeg(
  maxSide = 1080,
  quality = 0.72,
): Promise<Blob | null> {
  const stream = liveStream
  if (!stream || stream.getVideoTracks().length === 0) return null

  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.srcObject = stream

  try {
    await video.play()
    await waitForVideoFrame(video)

    const srcW = video.videoWidth || 0
    const srcH = video.videoHeight || 0
    if (srcW < 2 || srcH < 2) return null

    const scale = Math.min(1, maxSide / Math.max(srcW, srcH))
    const w = Math.max(2, Math.round(srcW * scale))
    const h = Math.max(2, Math.round(srcH * scale))

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(video, 0, 0, w, h)

    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality),
    )
  } catch {
    return null
  } finally {
    video.pause()
    video.srcObject = null
  }
}

function waitForVideoFrame(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= 2 && video.videoWidth > 0) return Promise.resolve()
  return new Promise((resolve) => {
    const onReady = () => {
      cleanup()
      resolve()
    }
    const cleanup = () => {
      video.removeEventListener('loadeddata', onReady)
      window.clearTimeout(timeout)
    }
    const timeout = window.setTimeout(() => {
      cleanup()
      resolve()
    }, 800)
    video.addEventListener('loadeddata', onReady)
  })
}
