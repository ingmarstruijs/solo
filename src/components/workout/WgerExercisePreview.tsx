import { ArrowLeft, Check } from 'lucide-react'
import type { WgerExerciseInfo } from '@/types/wger'
import { MarkdownText } from '@/components/MarkdownText'
import { LabActionButton } from '@/components/lab/LabPrimitives'
import { exerciseDisplayName, htmlToMarkdown } from '@/lib/wger/client'
import { mapWgerEquipment } from '@/lib/wger/mapEquipment'
import { pickWgerTranslation } from '@/lib/wger/pickTranslation'
import { wgerLanguageCode } from '@/lib/translate/wgerLanguages'
import { getAutoTranslateWger } from '@/lib/storage/translateStore'

type WgerExercisePreviewProps = {
  info: WgerExerciseInfo
  selected: boolean
  onBack: () => void
  onToggleSelect: () => void
}

function previewImageUrl(info: WgerExerciseInfo): string | undefined {
  const image = info.images?.find((img) => img.is_main) ?? info.images?.[0]
  return image?.thumbnails?.medium ?? image?.thumbnails?.small ?? image?.image
}

function previewDescription(info: WgerExerciseInfo): string {
  const translation = pickWgerTranslation(info.translations)
  return htmlToMarkdown(translation?.description ?? '')
}

function previewLanguageLabel(info: WgerExerciseInfo): string | undefined {
  const translation = pickWgerTranslation(info.translations)
  if (!translation) return undefined
  const code = wgerLanguageCode(translation.language)
  const labels: Record<string, string> = {
    nl: 'Nederlands',
    en: 'Engels',
    de: 'Duits',
    fr: 'Frans',
    es: 'Spaans',
    it: 'Italiaans',
  }
  return labels[code] ?? code.toUpperCase()
}

export function WgerExercisePreview({
  info,
  selected,
  onBack,
  onToggleSelect,
}: WgerExercisePreviewProps) {
  const name = exerciseDisplayName(info)
  const imageUrl = previewImageUrl(info)
  const description = previewDescription(info)
  const equipment = mapWgerEquipment(info.equipment)
  const languageLabel = previewLanguageLabel(info)
  const willTranslate = getAutoTranslateWger() && languageLabel !== 'Nederlands' && Boolean(description)

  const muscles = [
    ...info.muscles.map((m) => m.name_en || m.name),
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-2 border-b border-line p-4">
        <button
          type="button"
          onClick={onBack}
          className="grid size-9 shrink-0 place-items-center rounded-lg text-muted active:bg-surface-2"
          aria-label="Terug naar lijst"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="label-mono text-faint">Preview</p>
          <h2 className="truncate text-lg font-bold">{name}</h2>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {imageUrl && (
          <div className="mb-4 overflow-hidden rounded-xl border border-line bg-surface-2">
            <img
              src={imageUrl}
              alt={name}
              className="mx-auto max-h-56 w-full object-contain p-2"
              loading="lazy"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-lg border border-line bg-surface-2 px-2 py-1 text-muted">
            {info.category.name}
          </span>
          {languageLabel && (
            <span className="rounded-lg border border-line bg-surface-2 px-2 py-1 text-muted">
              {languageLabel}
            </span>
          )}
          {willTranslate && (
            <span className="rounded-lg border border-solo-400/30 bg-solo-400/10 px-2 py-1 text-solo-300">
              Vertaling bij import
            </span>
          )}
        </div>

        {equipment.length > 0 && (
          <div className="mt-4">
            <p className="label-mono text-faint">Materiaal</p>
            <p className="mt-1 text-sm text-muted">{equipment.join(' · ')}</p>
          </div>
        )}

        {muscles.length > 0 && (
          <div className="mt-4">
            <p className="label-mono text-faint">Spieren</p>
            <p className="mt-1 text-sm text-muted">{muscles.join(' · ')}</p>
          </div>
        )}

        {description ? (
          <div className="mt-4 border-t border-line pt-4">
            <p className="label-mono text-faint">Uitleg</p>
            <MarkdownText content={description} className="mt-2" />
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">Geen uitleg beschikbaar voor deze oefening.</p>
        )}
      </div>

      <footer className="border-t border-line p-4">
        <LabActionButton
          variant={selected ? 'secondary' : 'primary'}
          onClick={onToggleSelect}
          className="w-full gap-2"
        >
          {selected ? (
            <>
              <Check className="size-4" />
              Geselecteerd — tik om te verwijderen
            </>
          ) : (
            'Toevoegen aan selectie'
          )}
        </LabActionButton>
      </footer>
    </div>
  )
}
