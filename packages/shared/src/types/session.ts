export type SessionStatus = 'in_progress' | 'completed' | 'abandoned'

export interface SessionExerciseLog {
  workoutExerciseId: string
  completedSets: number
  repsPerSet: number[]
  loadPerSet: number[]
  skipped: boolean
}
