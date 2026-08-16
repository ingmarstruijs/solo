/** Live session camera stream registry — used to grab proof moments without prop drilling. */

let liveStream: MediaStream | null = null

export function setLiveSessionCameraStream(stream: MediaStream | null): void {
  liveStream = stream
}

export function getLiveSessionCameraStream(): MediaStream | null {
  return liveStream
}

/** Capture a JPEG still from the live session camera, or null if unavailable. */
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

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality),
    )
    return blob
  } catch {
    return null
  } finally {
    video.pause()
    video.srcObject = null
  }
}

function waitForVideoFrame(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= 2 && video.videoWidth > 0) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const onReady = () => {
      cleanup()
      resolve()
    }
    const onError = () => {
      cleanup()
      reject(new Error('Camera frame unavailable'))
    }
    const cleanup = () => {
      video.removeEventListener('loadeddata', onReady)
      video.removeEventListener('error', onError)
      window.clearTimeout(timeout)
    }
    const timeout = window.setTimeout(() => {
      cleanup()
      resolve()
    }, 800)
    video.addEventListener('loadeddata', onReady)
    video.addEventListener('error', onError)
  })
}
