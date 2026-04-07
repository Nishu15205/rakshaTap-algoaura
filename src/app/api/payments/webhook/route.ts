import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || ''

// Verify Razorpay webhook signature
function verifyWebhookSignature(body: string, signature: string): boolean {
  if (!RAZORPAY_WEBHOOK_SECRET) {
    console.warn('[RAZORPAY WEBHOOK] RAZORPAY_WEBHOOK_SECRET not configured.')
    return false
  }

  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex')

  return expectedSignature === signature
}

// Process webhook event synchronously (serverless-safe)
async function processWebhookEvent(event: Record<string, unknown>): Promise<void> {
  const eventEntity = event.entity as Record<string, unknown> | undefined
  const paymentId = (eventEntity?.id as string) || ''
  const orderId = (eventEntity?.order_id as string) || ''
  const notes = (eventEntity?.notes as Record<string, unknown>) || {}
  const userId = (notes.userId as string) || ''
  const amount = eventEntity?.amount as number || 0

  switch (event.event as string) {
    case 'payment.captured': {
      if (orderId) {
        await db.payment.updateMany({
          where: { razorpayOrderId: orderId, status: 'pending' },
          data: { status: 'completed', razorpayPaymentId: paymentId },
        })
      }
      if (userId) {
        const planId = (notes.planId as string) || ''
        if (planId) {
          const planNames: Record<string, string> = { basic: 'Basic', premium: 'Premium', unlimited: 'Unlimited' }
          await db.user.update({
            where: { id: userId },
            data: { subscriptionPlan: planNames[planId] || planId, subscriptionStatus: 'active' },
          })
        }
        await db.notification.create({
          data: { userId, title: 'Payment Confirmed', message: `Your payment of ₹${Math.round((amount || 0) / 100)} has been confirmed.`, type: 'success' },
        })
      }
      break
    }

    case 'payment.failed': {
      if (orderId) {
        await db.payment.updateMany({ where: { razorpayOrderId: orderId, status: 'pending' }, data: { status: 'failed' } })
      }
      if (userId) {
        await db.notification.create({
          data: { userId, title: 'Payment Failed', message: 'Your recent payment attempt failed. Please try again.', type: 'error' },
        })
      }
      break
    }

    case 'subscription.charged': {
      const subPayload = (event as Record<string, unknown>)['payload'] as Record<string, unknown> | undefined
      const subEntity = subPayload?.['entity'] as Record<string, unknown> | undefined
      const subNotes = subEntity?.['notes'] as Record<string, unknown> | undefined
      const subUserId = (subNotes?.['userId'] as string) || ''
      if (subUserId) {
        await db.notification.create({
          data: { userId: subUserId, title: 'Subscription Renewed', message: 'Your subscription has been renewed.', type: 'success' },
        })
      }
      break
    }

    case 'subscription.cancelled': {
      const subPayload2 = (event as Record<string, unknown>)['payload'] as Record<string, unknown> | undefined
      const subEntity2 = subPayload2?.['entity'] as Record<string, unknown> | undefined
      const subNotes2 = subEntity2?.['notes'] as Record<string, unknown> | undefined
      const subUserId2 = (subNotes2?.['userId'] as string) || ''
      if (subUserId2) {
        await db.user.update({ where: { id: subUserId2 }, data: { subscriptionStatus: 'cancelled' } })
        await db.notification.create({
          data: { userId: subUserId2, title: 'Subscription Cancelled', message: 'Your subscription has been cancelled.', type: 'warning' },
        })
      }
      break
    }

    default:
      console.log(`[WEBHOOK] Unhandled event: ${event.event}`)
  }
}

// POST /api/payments/webhook - Razorpay webhook endpoint
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-razorpay-signature') || ''

    if (RAZORPAY_WEBHOOK_SECRET && !verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ success: false, error: 'Invalid webhook signature' }, { status: 400 })
    }

    const event = JSON.parse(rawBody) as Record<string, unknown>

    // Process synchronously (serverless-compatible)
    await processWebhookEvent(event)

    return NextResponse.json({ success: true, message: 'Webhook processed' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process webhook'
    console.error('[RAZORPAY WEBHOOK ERROR]', message)
    return NextResponse.json({ success: false, error: 'Webhook processing failed' }, { status: 500 })
  }
}
