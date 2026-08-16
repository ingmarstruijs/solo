import type { SessionSummary } from '@/lib/workout/sessionSummary'
import { formatDuration } from '@/lib/workout/sessionSummary'

export const PROOF_REEL_SECONDS = 15
export const PROOF_SLIDE_COUNT = 5
export const PROOF_SLIDE_SECONDS = PROOF_REEL_SECONDS / PROOF_SLIDE_COUNT

const W = 1080
const H = 1920

type SlideCopy = {
  brand: string
  titleHint: string
  durationLabel: string
  paceLabel: string
  rpeLabel: string
  setsLabel: string
  proofLabel: string
  peakRpeLabel?: string
}

/** Snapshot of proof-reel facts for logbook previews and share copy. */
export type ProofReelFacts = {
  workoutName: string
  durationLabel: string
  totalSets: number
  paceLabel: string
  paceChangePercent: number
  avgRpe: number | null
  peakRpe: number | null
  exerciseNames: string[]
  exerciseLines: string[]
  hasAiReport: boolean
  setDurations: number[]
}

export function getProofReelFacts(summary: SessionSummary): ProofReelFacts {
  const rpeValues = Object.values(summary.rpeBySet ?? {}).filter((v) => v >= 1 && v <= 10)
  const peakRpe = rpeValues.length > 0 ? Math.max(...rpeValues) : null
  const top = summary.exercises.slice(0, 4)

  return {
    workoutName: summary.workoutName,
    durationLabel: formatDuration(summary.totalDurationSeconds),
    totalSets: summary.stats.totalSets,
    paceLabel: summary.stats.paceLabel,
    paceChangePercent: summary.stats.paceChangePercent,
    avgRpe: summary.stats.avgRpe,
    peakRpe,
    exerciseNames: top.map((ex) => ex.name),
    exerciseLines: top.map((ex) =>
      ex.durationSeconds > 0 ? `${ex.name} · ${formatDuration(ex.durationSeconds)}` : ex.name,
    ),
    hasAiReport: Boolean(summary.aiReport?.trim()),
    setDurations: summary.sets.map((set) => set.durationSeconds),
  }
}

function fillBackground(ctx: CanvasRenderingContext2D) {
  const gradient = ctx.createLinearGradient(0, 0, W, H)
  gradient.addColorStop(0, '#0b0e11')
  gradient.addColorStop(0.55, '#14181d')
  gradient.addColorStop(1, '#1c2128')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = 'rgba(124, 179, 240, 0.08)'
  ctx.beginPath()
  ctx.arc(W * 0.85, H * 0.18, 280, 0, Math.PI * 2)
  ctx.fill()
}

function drawBrand(ctx: CanvasRenderingContext2D, brand: string) {
  ctx.fillStyle = '#7cb3f0'
  ctx.font = '700 48px ui-sans-serif, system-ui, sans-serif'
  ctx.fillText(brand, 72, 140)
}

function drawCenteredBlock(
  ctx: CanvasRenderingContext2D,
  lines: Array<{ text: string; size: number; color: string; weight?: string }>,
  startY: number,
) {
  let y = startY
  for (const line of lines) {
    ctx.fillStyle = line.color
    ctx.font = `${line.weight ?? '600'} ${line.size}px ui-sans-serif, system-ui, sans-serif`
    ctx.fillText(line.text, 72, y)
    y += line.size + 28
  }
}

/** Render one proof-reel slide (9:16) as a PNG blob. */
export async function renderProofSlide(
  summary: SessionSummary,
  index: number,
  copy: SlideCopy,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')

  fillBackground(ctx)
  drawBrand(ctx, copy.brand)

  const facts = getProofReelFacts(summary)
  const avgRpe = facts.avgRpe != null ? String(facts.avgRpe) : '—'
  const sets = String(facts.totalSets)
  const paceDelta =
    facts.paceChangePercent !== 0
      ? `${facts.paceChangePercent > 0 ? '+' : ''}${facts.paceChangePercent}%`
      : null

  if (index === 0) {
    drawCenteredBlock(ctx, [
      { text: copy.proofLabel, size: 36, color: '#8a97a6', weight: '500' },
      { text: facts.workoutName, size: 72, color: '#e8edf2', weight: '800' },
      { text: facts.durationLabel, size: 96, color: '#7cb3f0', weight: '800' },
      { text: copy.durationLabel, size: 32, color: '#8a97a6' },
    ], 520)
  } else if (index === 1) {
    drawCenteredBlock(ctx, [
      { text: copy.setsLabel, size: 36, color: '#8a97a6' },
      { text: sets, size: 140, color: '#e8edf2', weight: '800' },
      { text: copy.paceLabel, size: 36, color: '#8a97a6' },
      { text: facts.paceLabel, size: 48, color: '#a9cbf5', weight: '700' },
      ...(paceDelta
        ? [{ text: paceDelta, size: 40, color: '#8a97a6', weight: '600' as const }]
        : []),
    ], 520)
  } else if (index === 2) {
    const peakLine =
      facts.peakRpe != null && facts.avgRpe != null && facts.peakRpe !== facts.avgRpe
        ? `${copy.peakRpeLabel ?? 'Peak'} ${facts.peakRpe}`
        : null
    drawCenteredBlock(ctx, [
      { text: copy.rpeLabel, size: 36, color: '#8a97a6' },
      { text: avgRpe, size: 160, color: '#ff8a3d', weight: '800' },
      { text: '1–10', size: 36, color: '#5a6573' },
      ...(peakLine ? [{ text: peakLine, size: 36, color: '#a9cbf5', weight: '600' as const }] : []),
    ], 560)
  } else if (index === 3) {
    drawCenteredBlock(ctx, [
      { text: copy.titleHint, size: 36, color: '#8a97a6' },
      ...facts.exerciseLines.map((line) => ({
        text: line,
        size: 40,
        color: '#e8edf2',
        weight: '700',
      })),
    ], 520)
  } else {
    drawCenteredBlock(ctx, [
      { text: copy.brand, size: 64, color: '#7cb3f0', weight: '800' },
      { text: facts.workoutName, size: 56, color: '#e8edf2', weight: '700' },
      { text: facts.durationLabel, size: 72, color: '#a9cbf5', weight: '800' },
      {
        text: `${sets} · ${facts.avgRpe != null ? `RPE ${facts.avgRpe}` : facts.paceLabel}`,
        size: 36,
        color: '#8a97a6',
      },
      { text: copy.proofLabel, size: 32, color: '#8a97a6' },
    ], 560)
  }

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/png'),
  )
  if (!blob) throw new Error('Failed to encode slide')
  return blob
}

export type ProofReelProgress = {
  phase: 'slides' | 'ffmpeg' | 'encode'
  progress: number
  text?: string
}

function assetBase(): string {
  const base = import.meta.env.BASE_URL || '/'
  return base.endsWith('/') ? base : `${base}/`
}

let ffmpegPromise: Promise<import('@ffmpeg/ffmpeg').FFmpeg> | null = null

async function getFfmpeg(
  onProgress?: (progress: ProofReelProgress) => void,
): Promise<import('@ffmpeg/ffmpeg').FFmpeg> {
  if (ffmpegPromise) return ffmpegPromise

  ffmpegPromise = (async () => {
    const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
      import('@ffmpeg/ffmpeg'),
      import('@ffmpeg/util'),
    ])
    const ffmpeg = new FFmpeg()
    ffmpeg.on('progress', ({ progress }) => {
      onProgress?.({
        phase: 'encode',
        progress: Math.min(1, Math.max(0, progress)),
      })
    })

    const base = `${assetBase()}ffmpeg`
    onProgress?.({ phase: 'ffmpeg', progress: 0.05, text: 'Loading FFmpeg…' })
    await ffmpeg.load({
      coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
    })
    return ffmpeg
  })()

  try {
    return await ffmpegPromise
  } catch (err) {
    ffmpegPromise = null
    throw err
  }
}

/** Build a ~15s vertical MP4 proof reel from session summary slides. */
export async function buildProofReel(
  summary: SessionSummary,
  copy: SlideCopy,
  onProgress?: (progress: ProofReelProgress) => void,
): Promise<Blob> {
  const { fetchFile } = await import('@ffmpeg/util')
  const slides: Blob[] = []
  for (let i = 0; i < PROOF_SLIDE_COUNT; i += 1) {
    onProgress?.({
      phase: 'slides',
      progress: (i + 1) / PROOF_SLIDE_COUNT,
      text: `Slide ${i + 1}/${PROOF_SLIDE_COUNT}`,
    })
    slides.push(await renderProofSlide(summary, i, copy))
  }

  const ffmpeg = await getFfmpeg(onProgress)
  for (let i = 0; i < slides.length; i += 1) {
    await ffmpeg.writeFile(`slide${i}.png`, await fetchFile(slides[i]))
  }

  // 1/3 fps → each still lasts 3 seconds; 5 slides = 15s.
  onProgress?.({ phase: 'encode', progress: 0.1, text: 'Encoding MP4…' })
  await ffmpeg.exec([
    '-framerate',
    String(1 / PROOF_SLIDE_SECONDS),
    '-i',
    'slide%d.png',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-t',
    String(PROOF_REEL_SECONDS),
    '-movflags',
    '+faststart',
    'proof.mp4',
  ])

  const data = await ffmpeg.readFile('proof.mp4')
  if (!(data instanceof Uint8Array)) {
    throw new Error('Unexpected FFmpeg output')
  }
  const output = new Uint8Array(data.byteLength)
  output.set(data)
  return new Blob([output.buffer], { type: 'video/mp4' })
}

export async function shareProofReel(blob: Blob, filename: string, title: string): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], filename, { type: 'video/mp4' })
  if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title, text: title })
    return 'shared'
  }

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
  return 'downloaded'
}
