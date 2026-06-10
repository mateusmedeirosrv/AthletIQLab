import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/api'

export interface WorkoutExercise {
  id: string
  exerciseId: string
  order: number
  sets: number
  reps: string
  load: string | null
  restSeconds: number | null
  notes: string | null
  tempo: string | null
}

export interface Exercise {
  id: string
  name: string
  videoUrl: string | null
  thumbnailUrl: string | null
  description: string | null
  techniqueTips: string | null
}

export interface WorkoutWithExercises {
  id: string
  title: string
  modality: string
  estimatedDurationMin: number | null
  status: string
  aiGenerated: boolean
  exercises: (WorkoutExercise & { exercise: Exercise })[]
}

export interface Workout {
  id: string
  title: string
  modality: string
  estimatedDurationMin: number | null
  status: string
  aiGenerated: boolean
  publishedAt: string | null
  createdAt: string
}

export function useWorkouts() {
  return useQuery({
    queryKey: ['workouts', 'student'],
    queryFn: () => apiClient.get<Workout[]>('/workouts'),
    select: (res) => res.data,
  })
}

export function useWorkout(id: string) {
  return useQuery({
    queryKey: ['workouts', id],
    queryFn: () => apiClient.get<WorkoutWithExercises>(`/workouts/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  })
}
