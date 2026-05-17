export type UserRole = 'personal' | 'student'

export type Plan = 'starter' | 'pro' | 'elite'

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled'

export type OAuthProvider = 'google' | 'apple' | 'email'

export interface User {
  id: string
  email: string
  role: UserRole
  oauthProvider: OAuthProvider
  locale: string
  consentLgpdAt: Date | null
  consentHealthDataAt: Date | null
  deletedAt: Date | null
}
