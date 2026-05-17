import Fastify from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import sensible from '@fastify/sensible'

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

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  // Routes will be registered here as sprints progress
  // app.register(authRoutes, { prefix: '/auth' })
  // app.register(personalRoutes, { prefix: '/personals' })
  // app.register(studentRoutes, { prefix: '/students' })
  // app.register(workoutRoutes, { prefix: '/workouts' })
  // app.register(aiRoutes, { prefix: '/ai' })

  return app
}
