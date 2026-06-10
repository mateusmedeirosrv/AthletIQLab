'use client'

import posthog from 'posthog-js'

let initialized = false

export function initPostHog() {
  if (initialized || typeof window === 'undefined') return
  const key = process.env['NEXT_PUBLIC_POSTHOG_KEY']
  if (!key) return
  posthog.init(key, {
    api_host: process.env['NEXT_PUBLIC_POSTHOG_HOST'] ?? 'https://app.posthog.com',
    capture_pageview: false, // manual via usePathname
    persistence: 'localStorage',
  })
  initialized = true
}

export function identifyUser(userId: string, email: string) {
  if (!initialized) return
  posthog.identify(userId, { email })
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (!initialized) return
  posthog.capture(event, properties)
}

export function trackPageView(path: string) {
  if (!initialized) return
  posthog.capture('$pageview', { $current_url: path })
}

export { posthog }
