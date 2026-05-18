import fp from 'fastify-plugin'
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import type { UserRole } from '@athletiqlab/shared'
import { supabaseAdmin } from './supabase'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
  interface FastifyRequest {
    userId: string
    userRole: UserRole
  }
}

const plugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorateRequest('userId', '')
  fastify.decorateRequest('userRole', 'student' as UserRole)

  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const auth = request.headers.authorization
      if (!auth?.startsWith('Bearer ')) {
        return reply.unauthorized('Missing authorization header')
      }
      const token = auth.slice(7)
      const {
        data: { user },
        error,
      } = await supabaseAdmin.auth.getUser(token)
      if (error || !user) {
        return reply.unauthorized('Token inválido ou expirado')
      }
      request.userId = user.id
      request.userRole = (user.user_metadata?.['role'] as UserRole | undefined) ?? 'student'
    },
  )
}

export const authPlugin = fp(plugin, { name: 'auth' })
