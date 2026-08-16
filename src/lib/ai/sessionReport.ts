import type { SessionSummary } from '@/lib/workout/sessionSummary'

/** Smallest Gemma 3 instruct build available in WebLLM prebuilt list. */
export const SESSION_REPORT_MODEL_ID = 'gemma3-1b-it-q4f16_1-MLC'

export type WebGpuSupport = {
  available: boolean
  reason?: string
}

export function checkWebGpuSupport(): WebGpuSupport {
  if (typeof navigator === 'undefined') {
    return { available: false, reason: 'Navigator unavailable' }
  }
  if (!('gpu' in navigator)) {
    return { available: false, reason: 'WebGPU not supported in this browser' }
  }
  return { available: true }
}

export type EngineProgress = {
  progress: number
  text: string
}

type EngineHandle = {
  chat: {
    completions: {
      create: (req: {
        messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
        temperature?: number
        max_tokens?: number
        stream?: boolean
      }) => Promise<{ choices: Array<{ message?: { content?: string | null } }> }>
    }
  }
}

let enginePromise: Promise<EngineHandle> | null = null
let loadedModelId: string | null = null

export async function loadSessionReportEngine(
  onProgress?: (progress: EngineProgress) => void,
): Promise<EngineHandle> {
  const support = checkWebGpuSupport()
  if (!support.available) {
    throw new Error(support.reason ?? 'WebGPU unavailable')
  }

  if (enginePromise && loadedModelId === SESSION_REPORT_MODEL_ID) {
    return enginePromise
  }

  enginePromise = (async () => {
    const { CreateMLCEngine } = await import('@mlc-ai/web-llm')
    const engine = await CreateMLCEngine(SESSION_REPORT_MODEL_ID, {
      initProgressCallback: (report) => {
        onProgress?.({
          progress: report.progress,
          text: report.text,
        })
      },
    })
    loadedModelId = SESSION_REPORT_MODEL_ID
    return engine as unknown as EngineHandle
  })()

  try {
    return await enginePromise
  } catch (err) {
    enginePromise = null
    loadedModelId = null
    throw err
  }
}

export function buildSessionReportPrompt(summary: SessionSummary, locale: string): string {
  const setLines = summary.sets
    .map((set) => {
      const rpe = set.rpe != null ? `, RPE ${set.rpe}` : ''
      return `- ${set.label}: ${set.durationSeconds}s${rpe}`
    })
    .join('\n')

  const exerciseLines = summary.exercises
    .slice(0, 12)
    .map((ex) => {
      const trend =
        ex.trend === 'stable' ? 'stable' : `${ex.trend} (${Math.abs(ex.trendPercent)}%)`
      return `- ${ex.name} [${ex.metric}]: total ${ex.durationSeconds}s, trend ${trend}`
    })
    .join('\n')

  const avgRpe =
    summary.stats.avgRpe != null ? `Average RPE: ${summary.stats.avgRpe}/10.` : 'No RPE logged.'

  return [
    `Write a concise post-workout coaching report for a privacy-first home training app.`,
    `Respond in language code "${locale}" (use that language for the whole report).`,
    `Use short paragraphs and 3–5 concrete bullet takeaways. No medical claims.`,
    `Do not invent sensors, velocities, or form scores that are not in the data.`,
    ``,
    `Workout: ${summary.workoutName}`,
    `Duration: ${summary.totalDurationSeconds} seconds`,
    `Sets/rounds: ${summary.stats.totalSets}`,
    `Pace: ${summary.stats.paceLabel}`,
    avgRpe,
    ``,
    `Per set:`,
    setLines || '- (none)',
    ``,
    `Exercises:`,
    exerciseLines || '- (none)',
  ].join('\n')
}

export async function generateSessionReport(
  summary: SessionSummary,
  locale: string,
  onProgress?: (progress: EngineProgress) => void,
): Promise<{ text: string; modelId: string }> {
  const engine = await loadSessionReportEngine(onProgress)
  const prompt = buildSessionReportPrompt(summary, locale)
  const result = await engine.chat.completions.create({
    messages: [
      {
        role: 'system',
        content:
          'You are SOLO., a calm on-device coach for home strength training. Be brief, specific, and encouraging.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.6,
    max_tokens: 512,
    stream: false,
  })

  const text = result.choices[0]?.message?.content?.trim()
  if (!text) throw new Error('Empty model response')
  return { text, modelId: SESSION_REPORT_MODEL_ID }
}
