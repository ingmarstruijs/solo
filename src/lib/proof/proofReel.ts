import type { SessionMoment } from '@/lib/storage/sessionMomentsStore'
import {
  getSessionMomentsByIds,
  getSessionMomentsBySessionKey,
  selectProofMoments,
} from '@/lib/storage/sessionMomentsStore'
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
  momentLabel?: string
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
  momentCount: number
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
    momentCount: summary.momentIds?.length ?? 0,
    setDurations: summary.sets.map((set) => set.durationSeconds),
  }
}

type SlideKind =
  | { type: 'title' }
  | { type: 'sets' }
  | { type: 'rpe' }
  | { type: 'exercises' }
  | { type: 'outro' }
  | { type: 'moment'; moment: SessionMoment }

function planSlides(moments: SessionMoment[]): SlideKind[] {
  const selected = selectProofMoments(moments, 3)
  if (selected.length === 0) {
    return [{ type: 'title' }, { type: 'sets' }, { type: 'rpe' }, { type: 'exercises' }, { type: 'outro' }]
  }
  if (selected.length === 1) {
    return [
      { type: 'title' },
      { type: 'moment', moment: selected[0]! },
      { type: 'sets' },
      { type: 'rpe' },
      { type: 'outro' },
    ]
  }
  if (selected.length === 2) {
    return [
      { type: 'title' },
      { type: 'moment', moment: selected[0]! },
      { type: 'sets' },
      { type: 'moment', moment: selected[1]! },
      { type: 'outro' },
    ]
  }
  return [
    { type: 'title' },
    { type: 'moment', moment: selected[0]! },
    { type: 'sets' },
    { type: 'moment', moment: selected[1]! },
    { type: 'moment', moment: selected[2]! },
  ]
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

function drawCoverImage(ctx: CanvasRenderingContext2D, image: CanvasImageSource, iw: number, ih: number) {
  const scale = Math.max(W / iw, H / ih)
  const dw = iw * scale
  const dh = ih * scale
  const dx = (W - dw) / 2
  const dy = (H - dh) / 2
  ctx.drawImage(image, dx, dy, dw, dh)

  const top = ctx.createLinearGradient(0, 0, 0, 420)
  top.addColorStop(0, 'rgba(11, 14, 17, 0.72)')
  top.addColorStop(1, 'rgba(11, 14, 17, 0)')
  ctx.fillStyle = top
  ctx.fillRect(0, 0, W, 420)

  const bottom = ctx.createLinearGradient(0, H - 720, 0, H)
  bottom.addColorStop(0, 'rgba(11, 14, 17, 0)')
  bottom.addColorStop(1, 'rgba(11, 14, 17, 0.88)')
  ctx.fillStyle = bottom
  ctx.fillRect(0, H - 720, W, 720)
}

async function loadImageBitmap(blob: Blob): Promise<ImageBitmap> {
  return createImageBitmap(blob)
}

async function renderMomentSlide(
  summary: SessionSummary,
  moment: SessionMoment,
  copy: SlideCopy,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')

  const bitmap = await loadImageBitmap(moment.blob)
  try {
    drawCoverImage(ctx, bitmap, bitmap.width, bitmap.height)
  } finally {
    bitmap.close()
  }

  drawBrand(ctx, copy.brand)
  const label = moment.exerciseName?.trim() || copy.momentLabel || copy.proofLabel
  const setLine = `Set ${moment.setNumber}`
  const facts = getProofReelFacts(summary)

  drawCenteredBlock(
    ctx,
    [
      { text: copy.momentLabel ?? copy.proofLabel, size: 32, color: '#a9cbf5', weight: '500' },
      { text: label, size: 64, color: '#e8edf2', weight: '800' },
      { text: setLine, size: 36, color: '#8a97a6', weight: '600' },
      {
        text: `${facts.durationLabel} · ${facts.totalSets} sets`,
        size: 32,
        color: '#8a97a6',
      },
    ],
    H - 520,
  )

  return canvasToPng(canvas)
}

async function renderStatsSlide(
  summary: SessionSummary,
  kind: Exclude<SlideKind['type'], 'moment'>,
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

  if (kind === 'title') {
    drawCenteredBlock(
      ctx,
      [
        { text: copy.proofLabel, size: 36, color: '#8a97a6', weight: '500' },
        { text: facts.workoutName, size: 72, color: '#e8edf2', weight: '800' },
        { text: facts.durationLabel, size: 96, color: '#7cb3f0', weight: '800' },
        { text: copy.durationLabel, size: 32, color: '#8a97a6' },
      ],
      520,
    )
  } else if (kind === 'sets') {
    drawCenteredBlock(
      ctx,
      [
        { text: copy.setsLabel, size: 36, color: '#8a97a6' },
        { text: sets, size: 140, color: '#e8edf2', weight: '800' },
        { text: copy.paceLabel, size: 36, color: '#8a97a6' },
        { text: facts.paceLabel, size: 48, color: '#a9cbf5', weight: '700' },
        ...(paceDelta
          ? [{ text: paceDelta, size: 40, color: '#8a97a6', weight: '600' as const }]
          : []),
      ],
      520,
    )
  } else if (kind === 'rpe') {
    const peakLine =
      facts.peakRpe != null && facts.avgRpe != null && facts.peakRpe !== facts.avgRpe
        ? `${copy.peakRpeLabel ?? 'Peak'} ${facts.peakRpe}`
        : null
    drawCenteredBlock(
      ctx,
      [
        { text: copy.rpeLabel, size: 36, color: '#8a97a6' },
        { text: avgRpe, size: 160, color: '#ff8a3d', weight: '800' },
        { text: '1–10', size: 36, color: '#5a6573' },
        ...(peakLine ? [{ text: peakLine, size: 36, color: '#a9cbf5', weight: '600' as const }] : []),
      ],
      560,
    )
  } else if (kind === 'exercises') {
    drawCenteredBlock(
      ctx,
      [
        { text: copy.titleHint, size: 36, color: '#8a97a6' },
        ...facts.exerciseLines.map((line) => ({
          text: line,
          size: 40,
          color: '#e8edf2',
          weight: '700',
        })),
      ],
      520,
    )
  } else {
    drawCenteredBlock(
      ctx,
      [
        { text: copy.brand, size: 64, color: '#7cb3f0', weight: '800' },
        { text: facts.workoutName, size: 56, color: '#e8edf2', weight: '700' },
        { text: facts.durationLabel, size: 72, color: '#a9cbf5', weight: '800' },
        {
          text: `${sets} · ${facts.avgRpe != null ? `RPE ${facts.avgRpe}` : facts.paceLabel}`,
          size: 36,
          color: '#8a97a6',
        },
        { text: copy.proofLabel, size: 32, color: '#8a97a6' },
      ],
      560,
    )
  }

  return canvasToPng(canvas)
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error('Failed to encode slide'))
      else resolve(blob)
    }, 'image/png')
  })
}

/** Render one proof-reel slide (9:16) as a PNG blob. Stats-only path for tests/tools. */
export async function renderProofSlide(
  summary: SessionSummary,
  index: number,
  copy: SlideCopy,
): Promise<Blob> {
  const kinds: Array<Exclude<SlideKind['type'], 'moment'>> = [
    'title',
    'sets',
    'rpe',
    'exercises',
    'outro',
  ]
  return renderStatsSlide(summary, kinds[Math.min(index, kinds.length - 1)]!, copy)
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

/** Build a ~15s vertical MP4 proof reel from stats + selected workout moments. */
export async function buildProofReel(
  summary: SessionSummary,
  copy: SlideCopy,
  onProgress?: (progress: ProofReelProgress) => void,
): Promise<Blob> {
  const { fetchFile } = await import('@ffmpeg/util')
  const byIds = await getSessionMomentsByIds(summary.momentIds ?? [])
  const bySession = await getSessionMomentsBySessionKey(summary.startedAt)
  const seen = new Set<string>()
  const moments: SessionMoment[] = []
  for (const moment of [...byIds, ...bySession]) {
    if (seen.has(moment.id)) continue
    seen.add(moment.id)
    moments.push(moment)
  }
  moments.sort((a, b) => a.capturedAt.localeCompare(b.capturedAt))
  const plan = planSlides(moments)

  const slides: Blob[] = []
  for (let i = 0; i < plan.length; i += 1) {
    onProgress?.({
      phase: 'slides',
      progress: (i + 1) / plan.length,
      text: `Slide ${i + 1}/${plan.length}`,
    })
    const slide = plan[i]!
    slides.push(
      slide.type === 'moment'
        ? await renderMomentSlide(summary, slide.moment, copy)
        : await renderStatsSlide(summary, slide.type, copy),
    )
  }

  const ffmpeg = await getFfmpeg(onProgress)
  for (let i = 0; i < slides.length; i += 1) {
    await ffmpeg.writeFile(`slide${i}.png`, await fetchFile(slides[i]!))
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

export async function shareProofReel(
  blob: Blob,
  filename: string,
  title: string,
): Promise<'shared' | 'downloaded'> {
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
