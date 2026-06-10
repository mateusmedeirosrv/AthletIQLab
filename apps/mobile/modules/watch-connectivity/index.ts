import { NativeModules, Platform } from 'react-native'

export interface WatchExercisePayload {
  sessionId: string
  exerciseName: string
  setNumber: number
  totalSets: number
  reps: number
  loadKg: number | null
  phase: 'active' | 'resting'
  restSeconds?: number
}

export interface HeartRateSample {
  timestamp: string // ISO 8601
  bpm: number
}

interface WatchConnectivityNative {
  isSupported(): Promise<boolean>
  isPaired(): Promise<boolean>
  isReachable(): Promise<boolean>
  sendMessage(payload: Record<string, unknown>): Promise<void>
  transferUserInfo(info: Record<string, unknown>): Promise<void>
}

const { WatchConnectivity } = NativeModules as { WatchConnectivity?: WatchConnectivityNative }

function noop(): Promise<void> {
  return Promise.resolve()
}

function noopBool(): Promise<boolean> {
  return Promise.resolve(false)
}

// Graceful no-op when the native module is not available (Android phone, simulator, etc.)
const nativeModule: WatchConnectivityNative = WatchConnectivity ?? {
  isSupported: noopBool,
  isPaired: noopBool,
  isReachable: noopBool,
  sendMessage: noop,
  transferUserInfo: noop,
}

export const watchConnectivity = {
  isAvailable: Platform.OS === 'ios',

  async isSupported(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false
    return nativeModule.isSupported()
  },

  async sendExercise(payload: WatchExercisePayload): Promise<void> {
    if (Platform.OS !== 'ios') return
    await nativeModule.sendMessage({ type: 'exercise', ...payload })
  },

  async sendSessionEnd(): Promise<void> {
    if (Platform.OS !== 'ios') return
    await nativeModule.sendMessage({ type: 'session_end' })
  },
}
