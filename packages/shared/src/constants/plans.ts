import type { Plan } from '../types/user'

export const PLAN_LIMITS: Record<
  Plan,
  { maxStudents: number; aiCallsPerMonth: number; customVideos: boolean; whiteLabel: boolean }
> = {
  starter: {
    maxStudents: 10,
    aiCallsPerMonth: 50,
    customVideos: false,
    whiteLabel: false,
  },
  pro: {
    maxStudents: 30,
    aiCallsPerMonth: 200,
    customVideos: true,
    whiteLabel: false,
  },
  elite: {
    maxStudents: Infinity,
    aiCallsPerMonth: 1000,
    customVideos: true,
    whiteLabel: true,
  },
} as const

export const PLAN_PRICES_BRL: Record<Plan, number> = {
  starter: 4900,
  pro: 9900,
  elite: 19900,
} as const
