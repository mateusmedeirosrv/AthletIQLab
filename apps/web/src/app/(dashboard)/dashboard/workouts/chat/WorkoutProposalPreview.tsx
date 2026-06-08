import { CheckCircle2, AlertTriangle, Clock, Dumbbell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AiChatWorkoutProposal } from '@athletiqlab/shared'

interface WorkoutProposalPreviewProps {
  proposal: AiChatWorkoutProposal
  onAuthorize: () => void
  onContinueAdjusting: () => void
  loading: boolean
}

export function WorkoutProposalPreview({
  proposal,
  onAuthorize,
  onContinueAdjusting,
  loading,
}: WorkoutProposalPreviewProps) {
  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-blue-500">
            Treino proposto pela IA
          </p>
          <h3 className="mt-1 text-base font-semibold text-neutral-900">{proposal.title}</h3>
          <div className="mt-1 flex items-center gap-3 text-xs text-neutral-500">
            <span className="capitalize">{proposal.modality}</span>
            {proposal.estimatedDurationMin && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {proposal.estimatedDurationMin} min
                </span>
              </>
            )}
            <span>·</span>
            <span className="flex items-center gap-1">
              <Dumbbell className="h-3 w-3" />
              {proposal.exercises.length} exercícios
            </span>
          </div>
        </div>
        <CheckCircle2 className="h-5 w-5 shrink-0 text-blue-500" />
      </div>

      {proposal.safetyNotes && proposal.safetyNotes.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <p className="text-xs font-medium text-amber-700">Notas de segurança</p>
          </div>
          {proposal.safetyNotes.map((note, i) => (
            <p key={i} className="text-xs text-amber-600">
              • {note}
            </p>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        {proposal.warmUp && proposal.warmUp.length > 0 && (
          <ExerciseSection title="Aquecimento" exercises={proposal.warmUp} />
        )}
        <ExerciseSection title="Treino principal" exercises={proposal.exercises} />
        {proposal.coolDown && proposal.coolDown.length > 0 && (
          <ExerciseSection title="Volta à calma" exercises={proposal.coolDown} />
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          variant="outline"
          onClick={onContinueAdjusting}
          disabled={loading}
          className="flex-1 text-sm"
        >
          Continuar ajustando
        </Button>
        <Button onClick={onAuthorize} disabled={loading} className="flex-1 text-sm">
          {loading ? 'Criando treino...' : 'Autorizar criação'}
        </Button>
      </div>
    </div>
  )
}

function ExerciseSection({
  title,
  exercises,
}: {
  title: string
  exercises: AiChatWorkoutProposal['exercises']
}) {
  return (
    <>
      <div className="border-b border-neutral-100 bg-neutral-50 px-4 py-2">
        <p className="text-xs font-medium text-neutral-500">{title}</p>
      </div>
      <div className="divide-y divide-neutral-100">
        {exercises.map((ex, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-2.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-neutral-900">{ex.name}</p>
              <p className="mt-0.5 text-xs text-neutral-500">
                {ex.sets}×{ex.reps}
                {ex.load ? ` · ${ex.load}` : ''}
                {ex.restSeconds ? ` · ${ex.restSeconds}s` : ''}
              </p>
              {ex.notes && <p className="mt-0.5 text-xs italic text-neutral-400">{ex.notes}</p>}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
