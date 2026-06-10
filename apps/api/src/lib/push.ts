import { eq } from 'drizzle-orm'
import { db, notificationTokens } from '@athletiqlab/db'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

interface PushMessage {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
  sound?: 'default' | null
  badge?: number
}

export async function sendPushToUser(
  userId: string,
  message: Omit<PushMessage, 'to'>,
): Promise<void> {
  const tokens = await db
    .select({ expoToken: notificationTokens.expoToken })
    .from(notificationTokens)
    .where(eq(notificationTokens.userId, userId))

  if (tokens.length === 0) return

  const messages: PushMessage[] = tokens.map((t) => ({
    to: t.expoToken,
    sound: 'default',
    ...message,
  }))

  await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(messages),
  })
}
