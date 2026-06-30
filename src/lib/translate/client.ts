import {
  getCachedTranslation,
  makeTranslationCacheKey,
  setCachedTranslation,
} from './cache'

const MYMEMORY_URL = 'https://api.mymemory.translated.net/get'
const CHUNK_SIZE = 450

type MyMemoryResponse = {
  responseStatus: number
  responseData?: { translatedText?: string }
}

async function translateChunk(text: string, from: string, to: string): Promise<string> {
  const cacheKey = makeTranslationCacheKey(from, to, text)
  const cached = getCachedTranslation(cacheKey)
  if (cached) return cached

  const params = new URLSearchParams({
    q: text,
    langpair: `${from}|${to}`,
  })

  const res = await fetch(`${MYMEMORY_URL}?${params}`)
  if (!res.ok) throw new Error(`Vertaling mislukt (${res.status})`)

  const data = (await res.json()) as MyMemoryResponse
  if (data.responseStatus !== 200 || !data.responseData?.translatedText) {
    throw new Error('Vertaling niet beschikbaar')
  }

  const translated = data.responseData.translatedText.trim()
  setCachedTranslation(cacheKey, translated)
  return translated
}

function splitForTranslation(text: string): string[] {
  const paragraphs = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
  const chunks: string[] = []

  for (const paragraph of paragraphs) {
    if (paragraph.length <= CHUNK_SIZE) {
      chunks.push(paragraph)
      continue
    }

    let rest = paragraph
    while (rest.length > CHUNK_SIZE) {
      const sliceAt = rest.lastIndexOf(' ', CHUNK_SIZE)
      const cut = sliceAt > 80 ? sliceAt : CHUNK_SIZE
      chunks.push(rest.slice(0, cut).trim())
      rest = rest.slice(cut).trim()
    }
    if (rest) chunks.push(rest)
  }

  return chunks
}

export async function translateText(
  text: string,
  from: string,
  to: string,
): Promise<string> {
  const source = from.toLowerCase()
  const target = to.toLowerCase()
  const trimmed = text.trim()
  if (!trimmed || source === target) return trimmed

  const chunks = splitForTranslation(trimmed)
  const translated = await Promise.all(chunks.map((chunk) => translateChunk(chunk, source, target)))
  return translated.join('\n\n')
}

export async function translateMarkdownToDutch(
  markdown: string,
  sourceLang: string,
): Promise<string> {
  return translateText(markdown, sourceLang, 'nl')
}
