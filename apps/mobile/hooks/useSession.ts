import { useState, useCallback } from 'react'
import { apiClient } from '../lib/api'

export type SessionPhase = 'idle' | 'in_progress' | 'checking_out' | 'done'

interface ExerciseState {
  workoutExerciseId: string
  completedSets: number
  repsPerSet: number[]
  loadPerSet: number[]
  skipped: boolean
}

interface UseSessionResult {
  sessionId: string | null
  phase: SessionPhase
  exerciseStates: Record<string, ExerciseState>
  startSession: (workoutId: string) => Promise<string>
  logSet: (workoutExerciseId: string, reps: number, load: number) => Promise<void>
  skipExercise: (workoutExerciseId: string) => Promise<void>
  endSession: (opts?: { endPhotoUrl?: string; rpe?: number; clientNotes?: string }) => Promise<void>
}

export function useSession(): UseSessionResult {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [phase, setPhase] = useState<SessionPhase>('idle')
  const [exerciseStates, setExerciseStates] = useState<Record<string, ExerciseState>>({})

  const startSession = useCallback(async (workoutId: string): Promise<string> => {
    const res = await apiClient.post<{ id: string }>('/workout-sessions', { workoutId })
    setSessionId(res.data.id)
    setPhase('in_progress')
    setExerciseStates({})
    return res.data.id
  }, [])

  const persistLog = useCallback(async (sid: string, weId: string, state: ExerciseState) => {
    await apiClient.post(`/workout-sessions/${sid}/exercises/${weId}/log`, {
      completedSets: state.completedSets,
      repsPerSet: state.repsPerSet,
      loadPerSet: state.loadPerSet,
      skipped: state.skipped,
    })
  }, [])

  const logSet = useCallback(
    async (workoutExerciseId: string, reps: number, load: number) => {
      if (!sessionId) return

      setExerciseStates((prev) => {
        const current = prev[workoutExerciseId] ?? {
          workoutExerciseId,
          completedSets: 0,
          repsPerSet: [],
          loadPerSet: [],
          skipped: false,
        }
        const updated: ExerciseState = {
          ...current,
          completedSets: current.completedSets + 1,
          repsPerSet: [...current.repsPerSet, reps],
          loadPerSet: [...current.loadPerSet, load],
        }
        void persistLog(sessionId, workoutExerciseId, updated)
        return { ...prev, [workoutExerciseId]: updated }
      })
    },
    [sessionId, persistLog],
  )

  const skipExercise = useCallback(
    async (workoutExerciseId: string) => {
      if (!sessionId) return
      const state: ExerciseState = {
        workoutExerciseId,
        completedSets: 0,
        repsPerSet: [],
        loadPerSet: [],
        skipped: true,
      }
      setExerciseStates((prev) => ({ ...prev, [workoutExerciseId]: state }))
      await persistLog(sessionId, workoutExerciseId, state)
    },
    [sessionId, persistLog],
  )

  const endSession = useCallback(
    async (opts?: { endPhotoUrl?: string; rpe?: number; clientNotes?: string }) => {
      if (!sessionId) return
      setPhase('checking_out')
      await apiClient.post(`/workout-sessions/${sessionId}/end`, opts ?? {})
      setPhase('done')
    },
    [sessionId],
  )

  return { sessionId, phase, exerciseStates, startSession, logSet, skipExercise, endSession }
}
