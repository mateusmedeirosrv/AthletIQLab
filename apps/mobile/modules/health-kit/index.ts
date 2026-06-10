/**
 * Unified health data module.
 *
 * Android: uses expo-health-connect (Health Connect API, Android 9+)
 * iOS:     HealthKit is accessed via the watchOS companion (WatchConnectivity).
 *          This module provides a no-op shim so callers don't need platform guards.
 *
 * Usage:
 *   const samples = await healthKit.readHeartRate(startDate, endDate)
 */

import { Platform } from 'react-native'

export interface HRSample {
  timestamp: string // ISO-8601
  bpm: number
}

// Inline interface for the Health Connect runtime API.
// expo-health-connect@0.1.1 is config-plugin only — no TS types for runtime.
interface HealthConnectModule {
  getSdkStatus(): Promise<number>
  initialize(): Promise<void>
  requestPermission(
    permissions: Array<{ accessType: string; recordType: string }>,
  ): Promise<Array<{ recordType: string; accessType: string }>>
  readRecords(
    type: string,
    options: { timeRangeFilter: { operator: string; startTime: string; endTime: string } },
  ): Promise<{ records: unknown[] }>
}

// Dynamic import to avoid crashing on iOS where the module isn't linked
async function getHealthConnect(): Promise<HealthConnectModule | null> {
  if (Platform.OS !== 'android') return null
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-health-connect') as HealthConnectModule
  } catch {
    return null
  }
}

async function requestAndroidPermissions(): Promise<boolean> {
  const hc = await getHealthConnect()
  if (!hc) return false
  try {
    const sdkStatus = await hc.getSdkStatus()
    // SdkAvailabilityStatus.SDK_AVAILABLE = 3
    if (sdkStatus !== 3) return false
    await hc.initialize()
    const result = await hc.requestPermission([{ accessType: 'read', recordType: 'HeartRate' }])
    return result.some(
      (r: { recordType: string; accessType: string }) =>
        r.recordType === 'HeartRate' && r.accessType === 'read',
    )
  } catch {
    return false
  }
}

async function readAndroidHeartRate(start: Date, end: Date): Promise<HRSample[]> {
  const hc = await getHealthConnect()
  if (!hc) return []
  try {
    const result = await hc.readRecords('HeartRate', {
      timeRangeFilter: {
        operator: 'between',
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      },
    })
    const samples: HRSample[] = []
    for (const record of result.records) {
      for (const sample of (record as { samples?: Array<{ time: string; beatsPerMinute: number }> })
        .samples ?? []) {
        samples.push({ timestamp: sample.time, bpm: sample.beatsPerMinute })
      }
    }
    return samples
  } catch {
    return []
  }
}

export const healthKit = {
  /**
   * Request health permissions. Should be called once before reading data.
   * Returns true if permission was granted.
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') return requestAndroidPermissions()
    // iOS: no explicit request — HealthKit entitlement is set at build time;
    // live HR comes via WatchConnectivity in useWatch.ts
    return false
  },

  /**
   * Read heart-rate samples for a given time range.
   * Returns [] on iOS (data comes through the watch bridge instead).
   */
  async readHeartRate(start: Date, end: Date): Promise<HRSample[]> {
    if (Platform.OS === 'android') return readAndroidHeartRate(start, end)
    return []
  },

  isAvailable: Platform.OS === 'android',
}
