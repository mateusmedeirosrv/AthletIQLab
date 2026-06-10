import { useCallback, useEffect, useRef } from 'react'
import { NativeEventEmitter, NativeModules, Platform } from 'react-native'
import { watchConnectivity, type WatchExercisePayload } from '../modules/watch-connectivity'
import { apiClient } from '../lib/api'

interface HRSample {
  timestamp: string
  bpm: number
}

/**
 * Manages the watch session: sends exercise state updates to the watch
 * and collects HR samples from the watch (via NativeEventEmitter) for
 * batch upload to the API.
 */
export function useWatch(sessionId: string | null) {
  const pendingHR = useRef<HRSample[]>([])
  const flushRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Set up HR sample listener and flush timer
  useEffect(() => {
    if (!sessionId || Platform.OS !== 'ios') return

    // Listen for HR batches relayed from the watch via WatchConnectivity.transferUserInfo
    let subscription: ReturnType<NativeEventEmitter['addListener']> | null = null
    if (NativeModules['WatchConnectivity']) {
      const emitter = new NativeEventEmitter(
        NativeModules['WatchConnectivity'] as ConstructorParameters<typeof NativeEventEmitter>[0],
      )
      subscription = emitter.addListener('hrBatch', (data: { samples: HRSample[] }) => {
        pendingHR.current.push(...data.samples)
      })
    }

    // Flush HR samples every 5 seconds
    flushRef.current = setInterval(() => {
      flushHR(sessionId)
    }, 5_000)

    return () => {
      subscription?.remove()
      if (flushRef.current) clearInterval(flushRef.current)
      flushHR(sessionId) // final flush on cleanup
    }
  }, [sessionId])

  const flushHR = useCallback(async (sid: string) => {
    const samples = pendingHR.current.splice(0)
    if (samples.length === 0) return
    try {
      await apiClient.post(`/workout-sessions/${sid}/heart-rate`, { samples })
    } catch {
      // Non-critical — put samples back so next flush retries
      pendingHR.current.unshift(...samples)
    }
  }, [])

  const sendExercise = useCallback(async (payload: WatchExercisePayload) => {
    try {
      await watchConnectivity.sendExercise(payload)
    } catch {
      // Watch not reachable — silently ignore
    }
  }, [])

  const sendSessionEnd = useCallback(async () => {
    try {
      await watchConnectivity.sendSessionEnd()
    } catch {
      // ignore
    }
  }, [])

  return { sendExercise, sendSessionEnd }
}
