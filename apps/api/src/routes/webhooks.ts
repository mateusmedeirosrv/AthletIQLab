import { createHmac, timingSafeEqual } from 'node:crypto'
import { eq } from 'drizzle-orm'
import type { FastifyPluginAsync } from 'fastify'
import { db, personals, subscriptions } from '@athletiqlab/db'

const MP_API = 'https://api.mercadopago.com'

interface MpPreapproval {
  id: string
  status: 'pending' | 'authorized' | 'paused' | 'cancelled'
  external_reference: string | null
  auto_recurring?: { transaction_amount: number; currency_id: string }
  next_payment_date?: string
}

async function fetchMpPreapproval(id: string): Promise<MpPreapproval> {
  const res = await fetch(`${MP_API}/preapproval/${id}`, {
    headers: { Authorization: `Bearer ${process.env['MP_ACCESS_TOKEN'] ?? ''}` },
  })
  return res.json() as Promise<MpPreapproval>
}

function validateSignature(secret: string, xSignature: string, notificationId: string): boolean {
  const ts = xSignature.match(/ts=([^,]+)/)?.[1] ?? ''
  const v1 = xSignature.match(/v1=([^,]+)/)?.[1] ?? ''
  if (!ts || !v1) return false

  const manifest = `id:${notificationId};request-date:${ts};`
  const expected = createHmac('sha256', secret).update(manifest).digest('hex')

  try {
    return timingSafeEqual(Buffer.from(v1, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

export const webhookRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /webhooks/mercadopago — handles subscription lifecycle events
  fastify.post('/mercadopago', async (request, reply) => {
    const body = request.body as {
      type?: string
      action?: string
      data?: { id?: string }
      id?: string
    }

    // Only handle subscription events
    if (body?.type !== 'subscription_preapproval') {
      return reply.code(200).send({ received: true })
    }

    const preapprovalId = body?.data?.id ?? (body?.id as string | undefined)
    if (!preapprovalId) return reply.code(200).send({ received: true })

    // Validate signature if secret is configured
    const secret = process.env['MP_WEBHOOK_SECRET']
    if (secret) {
      const xSignature = (request.headers['x-signature'] as string | undefined) ?? ''
      const notificationId = (request.query as Record<string, string>)['id'] ?? preapprovalId
      if (!validateSignature(secret, xSignature, notificationId)) {
        return reply.code(401).send({ error: 'Invalid signature' })
      }
    }

    let preapproval: MpPreapproval
    try {
      preapproval = await fetchMpPreapproval(preapprovalId)
    } catch {
      return reply.code(200).send({ received: true })
    }

    const externalRef = preapproval.external_reference
    if (!externalRef) return reply.code(200).send({ received: true })

    // Find our subscription by DB id (stored in external_reference)
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, externalRef))
      .limit(1)

    if (!sub) return reply.code(200).send({ received: true })

    // Map MP status to our enums
    const mpStatus = preapproval.status
    const dbStatus = (
      {
        pending: 'pending',
        authorized: 'authorized',
        paused: 'paused',
        cancelled: 'cancelled',
      } as const
    )[mpStatus]

    const nextPeriodEnd = preapproval.next_payment_date
      ? new Date(preapproval.next_payment_date)
      : null

    await db
      .update(subscriptions)
      .set({
        status: dbStatus,
        mpSubscriptionId: preapproval.id,
        ...(nextPeriodEnd ? { currentPeriodEnd: nextPeriodEnd } : {}),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, sub.id))

    // Mirror onto personals
    if (mpStatus === 'authorized') {
      await db
        .update(personals)
        .set({
          plan: sub.plan as 'starter' | 'pro' | 'elite',
          subscriptionStatus: 'active',
          mpSubscriptionId: preapproval.id,
          updatedAt: new Date(),
        })
        .where(eq(personals.userId, sub.personalId))
    } else if (mpStatus === 'paused') {
      await db
        .update(personals)
        .set({
          subscriptionStatus: 'past_due',
          updatedAt: new Date(),
        })
        .where(eq(personals.userId, sub.personalId))
    } else if (mpStatus === 'cancelled') {
      await db
        .update(personals)
        .set({
          plan: 'starter',
          subscriptionStatus: 'canceled',
          mpSubscriptionId: null,
          updatedAt: new Date(),
        })
        .where(eq(personals.userId, sub.personalId))
    }

    return reply.code(200).send({ received: true })
  })
}
