import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/api'

export interface WeeklyBucket {
  week: string
  sessionCount: number
  totalVolumeKg: number
}

export interface RecentSession {
  id: string
  workoutId: string
  startedAt: string
  endedAt: string | null
  totalVolumeKg: string | null
  avgHrBpm: number | null
  rpe: number | null
}

export interface ProgressSummary {
  weeklySessions: WeeklyBucket[]
  recentSessions: RecentSession[]
  totals: { totalSessions: number; totalVolumeKg: number }
  weekStreak: number
}

export function useProgress() {
  return useQuery({
    queryKey: ['progress', 'summary'],
    queryFn: () => apiClient.get<ProgressSummary>('/progress/summary').then((r) => r.data),
    staleTime: 60_000,
  })
}
