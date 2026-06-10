import { and, eq } from 'drizzle-orm'
import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { db, personals, subscriptions, users } from '@athletiqlab/db'
import { PLAN_LIMITS, PLAN_PRICES_BRL } from '@athletiqlab/shared'
import type { Plan } from '@athletiqlab/shared'

const MP_API = 'https://api.mercadopago.com'

function mpHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env['MP_ACCESS_TOKEN'] ?? ''}`,
  }
}

async function createMpPreapproval(opts: {
  plan: Plan
  externalReference: string
  payerEmail: string
  backUrl: string
}): Promise<{ id: string; initPoint: string }> {
  const amount = PLAN_PRICES_BRL[opts.plan] / 100 // cents → BRL
  const res = await fetch(`${MP_API}/preapproval`, {
    method: 'POST',
    headers: mpHeaders(),
    body: JSON.stringify({
      reason: `AthletiQLab ${opts.plan.charAt(0).toUpperCase() + opts.plan.slice(1)}`,
      external_reference: opts.externalReference,
      payer_email: opts.payerEmail,
      back_url: opts.backUrl,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: amount,
        currency_id: 'BRL',
      },
    }),
  })
  if (!res.ok) {
    const err = (await res.json()) as { message?: string }
    throw new Error(err.message ?? `MP error ${res.status}`)
  }
  const data = (await res.json()) as { id: string; init_point: string }
  return { id: data.id, initPoint: data.init_point }
}

async function cancelMpPreapproval(mpId: string): Promise<void> {
  await fetch(`${MP_API}/preapproval/${mpId}`, {
    method: 'PUT',
    headers: mpHeaders(),
    body: JSON.stringify({ status: 'cancelled' }),
  })
}

const checkoutSchema = z.object({ plan: z.enum(['starter', 'pro', 'elite']) })

export const billingRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /billing/subscription — current plan + subscription status
  fastify.get('/subscription', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const [personal] = await db
      .select({
        plan: personals.plan,
        subscriptionStatus: personals.subscriptionStatus,
        trialEndsAt: personals.trialEndsAt,
        mpSubscriptionId: personals.mpSubscriptionId,
      })
      .from(personals)
      .where(eq(personals.userId, request.userId))
      .limit(1)

    if (!personal) return reply.notFound('Personal não encontrado')

    const [sub] = personal.mpSubscriptionId
      ? await db
          .select({
            plan: subscriptions.plan,
            status: subscriptions.status,
            currentPeriodEnd: subscriptions.currentPeriodEnd,
            cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
          })
          .from(subscriptions)
          .where(eq(subscriptions.mpSubscriptionId, personal.mpSubscriptionId))
          .limit(1)
      : []

    return {
      data: {
        plan: personal.plan,
        subscriptionStatus: personal.subscriptionStatus,
        trialEndsAt: personal.trialEndsAt,
        limits: PLAN_LIMITS[personal.plan],
        subscription: sub ?? null,
      },
    }
  })

  // POST /billing/checkout — create MP preapproval, return checkout URL
  fastify.post('/checkout', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const parsed = checkoutSchema.safeParse(request.body)
    if (!parsed.success)
      return reply.badRequest(parsed.error.issues[0]?.message ?? 'Plano inválido')

    const { plan } = parsed.data
    if (plan === 'starter') return reply.badRequest('Plano Starter é gratuito')

    if (!process.env['MP_ACCESS_TOKEN']) {
      return reply.internalServerError('Pagamento não configurado')
    }

    const [personal] = await db
      .select({ plan: personals.plan, mpSubscriptionId: personals.mpSubscriptionId })
      .from(personals)
      .where(eq(personals.userId, request.userId))
      .limit(1)

    if (!personal) return reply.notFound()

    if (personal.mpSubscriptionId) {
      return reply.conflict('Você já possui uma assinatura ativa')
    }

    const [userRow] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, request.userId))
      .limit(1)

    if (!userRow) return reply.notFound()

    // Create pending subscription record first
    const rows = await db
      .insert(subscriptions)
      .values({ personalId: request.userId, plan, status: 'pending' })
      .returning()
    const sub = rows[0]
    if (!sub) return reply.internalServerError('Falha ao criar assinatura')

    const backUrl = `${process.env['APP_URL'] ?? 'http://localhost:3000'}/dashboard/billing`

    let mpId: string
    let initPoint: string
    try {
      const mp = await createMpPreapproval({
        plan,
        externalReference: sub.id,
        payerEmail: userRow.email,
        backUrl,
      })
      mpId = mp.id
      initPoint = mp.initPoint
    } catch (err) {
      // Clean up pending subscription on MP failure
      await db.delete(subscriptions).where(eq(subscriptions.id, sub.id))
      throw err
    }

    // Link MP preapproval ID to subscription
    await db
      .update(subscriptions)
      .set({ mpSubscriptionId: mpId })
      .where(eq(subscriptions.id, sub.id))

    return { data: { checkoutUrl: initPoint } }
  })

  // POST /billing/cancel — cancel at period end
  fastify.post('/cancel', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const [personal] = await db
      .select({ mpSubscriptionId: personals.mpSubscriptionId })
      .from(personals)
      .where(eq(personals.userId, request.userId))
      .limit(1)

    if (!personal?.mpSubscriptionId) return reply.badRequest('Nenhuma assinatura ativa encontrada')

    try {
      await cancelMpPreapproval(personal.mpSubscriptionId)
    } catch {
      // MP call failed; still mark cancel in DB so webhook can finish
    }

    await db
      .update(subscriptions)
      .set({ cancelAtPeriodEnd: true })
      .where(
        and(
          eq(subscriptions.personalId, request.userId),
          eq(subscriptions.mpSubscriptionId, personal.mpSubscriptionId),
        ),
      )

    return reply.code(204).send()
  })
}
