import Fastify from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import sensible from '@fastify/sensible'

import { authPlugin } from './plugins/auth'
import { adminRoutes } from './routes/admin'
import { aiChatRoutes } from './routes/ai-chat'
import { authRoutes } from './routes/auth'
import { billingRoutes } from './routes/billing'
import { conversationRoutes } from './routes/conversations'
import { exerciseRoutes } from './routes/exercises'
import { feedbackRoutes } from './routes/feedback'
import { notificationRoutes } from './routes/notifications'
import { personalRoutes } from './routes/personals'
import { progressRoutes } from './routes/progress'
import { sessionRoutes } from './routes/sessions'
import { studentRoutes } from './routes/students'
import { webhookRoutes } from './routes/webhooks'
import { workoutRoutes } from './routes/workouts'

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env['LOG_LEVEL'] ?? 'info',
    },
  })

  await app.register(cors, {
    origin: process.env['APP_URL'] ?? 'http://localhost:3000',
    credentials: true,
  })

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  })

  await app.register(sensible)
  await app.register(authPlugin)

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  await app.register(authRoutes, { prefix: '/auth' })
  await app.register(personalRoutes, { prefix: '/personals' })
  await app.register(studentRoutes, { prefix: '/students' })
  await app.register(exerciseRoutes, { prefix: '/exercises' })
  await app.register(workoutRoutes, { prefix: '/workouts' })
  await app.register(sessionRoutes, { prefix: '/workout-sessions' })
  await app.register(progressRoutes, { prefix: '/progress' })
  await app.register(conversationRoutes, { prefix: '/conversations' })
  await app.register(notificationRoutes, { prefix: '/notifications' })
  await app.register(billingRoutes, { prefix: '/billing' })
  await app.register(webhookRoutes, { prefix: '/webhooks' })
  await app.register(aiChatRoutes, { prefix: '/ai/workout-chat' })
  await app.register(feedbackRoutes, { prefix: '/feedback' })
  await app.register(adminRoutes, { prefix: '/admin/personals' })

  return app
}
