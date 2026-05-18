import Fastify from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import sensible from '@fastify/sensible'

import { authPlugin } from './plugins/auth'
import { authRoutes } from './routes/auth'
import { personalRoutes } from './routes/personals'
import { studentRoutes } from './routes/students'

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

  return app
}
