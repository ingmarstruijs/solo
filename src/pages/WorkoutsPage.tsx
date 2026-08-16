import { CheckSquare, Dumbbell, Square } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { parseFitFile } from '@/lib/workout/fitImport'
import { shareWorkoutLink } from '@/lib/workout/shareLink'
import { useWorkouts } from '@/hooks/useWorkouts'
import { useWorkoutSelection } from '@/hooks/useWorkoutSelection'
import { WgerBrowser } from '@/components/workout/WgerBrowser'
import { WorkoutCard } from '@/components/workout/WorkoutCard'
import { WorkoutCompactToolbar } from '@/components/workout/WorkoutCompactToolbar'
import { useTranslation } from '@/i18n/hooks'
import { cn } from '@/lib/cn'

export function WorkoutsPage() {
  const { t } = useTranslation('workouts')
  const navigate = useNavigate()
  const { workouts, add, remove, duplicate, toggleFav, exportData, importData } = useWorkouts()
  const {
    selectionMode,
    selectedIds,
    toggleSelectionMode,
    toggleMulti,
    removeFromSelection,
  } = useWorkoutSelection()
  const [wgerOpen, setWgerOpen] = useState(false)

  function handleExport() {
    const data = exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `solo-workouts-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleFitImport(buffer: ArrayBuffer) {
    const { workout, warnings, fileType } = parseFitFile(buffer)
    add(workout)
    alert(
      t('fitImported', {
        fileType,
        name: workout.name,
        warnings: warnings.join('\n'),
      }),
    )
  }

  function openPrep(id: string) {
    navigate(`/workouts/prep?ids=${id}`)
  }

  async function handleShare(workout: import('@/types/workout').WorkoutTemplate) {
    try {
      const result = await shareWorkoutLink(workout)
      if (result === 'copied') alert(t('linkCopied'))
    } catch {
      // user dismissed native share sheet
    }
  }

  function handleDelete(id: string) {
    const workout = workouts.find((w) => w.id === id)
    if (!workout) return
    if (!confirm(t('deleteNamedConfirm', { name: workout.name }))) return
    remove(id)
    removeFromSelection(id)
  }

  return (
    <div className="flex flex-col gap-3 py-2">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-surface-2 text-solo-400">
            <Dumbbell className="size-5" />
          </span>
          <div>
            <h1 className="text-lg font-bold tracking-tight">{t('title')}</h1>
            <p className="text-[11px] text-muted">{t('available', { count: workouts.length })}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleSelectionMode}
          className={cn(
            'flex min-h-10 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium',
            selectionMode ? 'border-solo-400/50 bg-solo-400/10 text-solo-300' : 'border-line text-muted',
          )}
        >
          {selectionMode ? <CheckSquare className="size-4" /> : <Square className="size-4" />}
          {t('multi')}
        </button>
      </header>

      <WorkoutCompactToolbar
        onNew={() => navigate('/workouts/new')}
        onExport={handleExport}
        onImportJson={importData}
        onImportFit={handleFitImport}
        onBrowseWger={() => setWgerOpen(true)}
      />

      {!selectionMode && <p className="text-[11px] text-faint">{t('tapHint')}</p>}
      {selectionMode && <p className="text-[11px] text-solo-400">{t('multiHint')}</p>}

      <div className="flex flex-col gap-2 pb-20">
        {workouts.map((workout) => (
          <WorkoutCard
            key={workout.id}
            workout={workout}
            selectionMode={selectionMode}
            multiSelected={selectedIds.includes(workout.id)}
            onOpen={(w) => (selectionMode ? toggleMulti(w.id) : openPrep(w.id))}
            onEdit={(w) => navigate(`/workouts/${w.id}/edit`)}
            onDuplicate={(w) => {
              duplicate(w.id)
            }}
            onShare={handleShare}
            onDelete={handleDelete}
            onToggleFavorite={toggleFav}
          />
        ))}

        {workouts.length === 0 && (
          <p className="rounded-card border border-dashed border-line p-6 text-center text-sm text-muted">
            {t('emptyCreate')}
          </p>
        )}
      </div>

      <WgerBrowser
        open={wgerOpen}
        onClose={() => setWgerOpen(false)}
        onImportWorkout={(workout) => add(workout)}
      />
    </div>
  )
}
