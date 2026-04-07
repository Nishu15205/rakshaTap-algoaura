import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })

    const payload = await verifyToken(token)
    if (!payload) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })

    const { planId, planName, amount } = await request.json()
    if (!planId || !amount) {
      return NextResponse.json({ success: false, error: 'Plan details required' }, { status: 400 })
    }

    // Validate plan
    if (!['standard', 'premium'].includes(planId)) {
      return NextResponse.json({ success: false, error: 'Invalid plan' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: payload.userId } })
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 })

    // For production: integrate Razorpay here
    // For now: create payment record and activate subscription
    const payment = await db.payment.create({
      data: {
        userId: payload.userId,
        amount: parseFloat(amount),
        status: 'completed',
        paymentMethod: 'card',
        description: `${planName} plan subscription`,
      },
    })

    const updatedUser = await db.user.update({
      where: { id: payload.userId },
      data: {
        subscriptionPlan: planId,
        subscriptionStatus: 'active',
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        subscriptionPlan: updatedUser.subscriptionPlan,
        subscriptionStatus: updatedUser.subscriptionStatus,
        paymentId: payment.id,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Payment failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
