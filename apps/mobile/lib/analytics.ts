import { Platform } from 'react-native'

const POSTHOG_HOST = process.env['EXPO_PUBLIC_POSTHOG_HOST'] ?? 'https://app.posthog.com'
const POSTHOG_KEY = process.env['EXPO_PUBLIC_POSTHOG_KEY'] ?? ''
const APP_VERSION = process.env['EXPO_PUBLIC_APP_VERSION'] ?? 'unknown'

let distinctId: string | null = null

function getDistinctId(): string {
  if (!distinctId) {
    // Use a stable anonymous ID until identify() is called
    distinctId = `anon_${Math.random().toString(36).slice(2)}`
  }
  return distinctId
}

export function identifyUser(userId: string) {
  distinctId = userId
}

export async function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (!POSTHOG_KEY) return
  try {
    await fetch(`${POSTHOG_HOST}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        event,
        distinct_id: getDistinctId(),
        properties: {
          $lib: 'athletiqlab-mobile',
          platform: Platform.OS,
          app_version: APP_VERSION,
          ...properties,
        },
        timestamp: new Date().toISOString(),
      }),
    })
  } catch {
    // Non-critical — analytics failures are silent
  }
}
