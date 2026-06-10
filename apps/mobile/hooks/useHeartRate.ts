import { useCallback, useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/api'
import { healthKit, type HRSample } from '../modules/health-kit'

interface ApiHRSample {
  id: number
  sessionId: string
  timestamp: string
  bpm: number
}

export interface HeartRateData {
  samples: HRSample[]
  avgBpm: number | null
  maxBpm: number | null
}

/**
 * Fetches stored HR samples from the API for a completed session.
 */
export function useSessionHeartRate(sessionId: string | null) {
  return useQuery({
    queryKey: ['session-hr', sessionId],
    queryFn: async (): Promise<HeartRateData> => {
      if (!sessionId) return { samples: [], avgBpm: null, maxBpm: null }
      const res = await apiClient.get<ApiHRSample[]>(`/workout-sessions/${sessionId}/heart-rate`)
      const samples: HRSample[] = res.data.map((s) => ({ timestamp: s.timestamp, bpm: s.bpm }))
      if (samples.length === 0) return { samples: [], avgBpm: null, maxBpm: null }
      const avg = Math.round(samples.reduce((acc, s) => acc + s.bpm, 0) / samples.length)
      const max = Math.max(...samples.map((s) => s.bpm))
      return { samples, avgBpm: avg, maxBpm: max }
    },
    enabled: !!sessionId,
    staleTime: 5 * 60_000,
  })
}

/**
 * Reads HR from the device health store (Android Health Connect only) for a
 * given session time range, then POSTs the samples to the API.
 */
export function useSyncHealthStoreHR(
  sessionId: string | null,
  startedAt: string | null,
  endedAt: string | null,
) {
  const [synced, setSynced] = useState(false)
  const syncRef = useRef(false)

  const sync = useCallback(async () => {
    if (!sessionId || !startedAt || !endedAt || syncRef.current) return
    if (Platform.OS !== 'android') return

    syncRef.current = true
    try {
      const granted = await healthKit.requestPermissions()
      if (!granted) return

      const samples = await healthKit.readHeartRate(new Date(startedAt), new Date(endedAt))
      if (samples.length === 0) return

      await apiClient.post(`/workout-sessions/${sessionId}/heart-rate`, { samples })
      setSynced(true)
    } catch {
      // Non-critical — HR data is supplemental
    }
  }, [sessionId, startedAt, endedAt])

  useEffect(() => {
    void sync()
  }, [sync])

  return { synced }
}
