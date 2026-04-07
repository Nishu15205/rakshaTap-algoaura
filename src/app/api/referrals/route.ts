import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { validateInput, referralSchema } from '@/lib/validation'
import { logger, logApiRequest, logApiError } from '@/lib/logger'

// GET: Get user's referral code and referral list
export async function GET() {
  const start = Date.now()
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: authUser.userId },
      select: { id: true, referralCode: true },
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Auto-generate referral code if user doesn't have one
    let code = user.referralCode
    if (!code) {
      code = `MUMAA-${user.id.substring(0, 6).toUpperCase()}`
      await db.user.update({
        where: { id: user.id },
        data: { referralCode: code },
      })
    }

    // Get all referrals made by this user
    const referrals = await db.referral.findMany({
      where: { referrerId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    logApiRequest('GET', '/api/referrals', 200, Date.now() - start, authUser.userId)
    return NextResponse.json({
      success: true,
      data: {
        code,
        referralCount: referrals.length,
        referrals,
      },
    })
  } catch (error: unknown) {
    logApiError('GET', '/api/referrals', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch referrals'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// POST: Claim a referral code
export async function POST(request: NextRequest) {
  const start = Date.now()
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()

    // Validate with Zod
    const validation = validateInput(referralSchema, body)
    if (!validation.success) {
      logApiRequest('POST', '/api/referrals', 400, Date.now() - start, authUser.userId)
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 })
    }

    const { code } = validation.data

    // Find the referrer by code
    const referrer = await db.user.findUnique({
      where: { referralCode: code },
      select: { id: true, name: true, email: true },
    })

    if (!referrer) {
      return NextResponse.json({ success: false, error: 'Invalid referral code' }, { status: 404 })
    }

    // Cannot refer yourself
    if (referrer.id === authUser.userId) {
      return NextResponse.json({ success: false, error: 'You cannot use your own referral code' }, { status: 400 })
    }

    // Check if user already has a referral (referredBy)
    const existingReferral = await db.referral.findUnique({
      where: { refereeId: authUser.userId },
    })

    if (existingReferral) {
      return NextResponse.json({ success: false, error: 'You have already used a referral code' }, { status: 400 })
    }

    // Get current user info
    const currentUser = await db.user.findUnique({
      where: { id: authUser.userId },
      select: { name: true, email: true },
    })

    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Create referral record
    const referral = await db.referral.create({
      data: {
        referrerId: referrer.id,
        refereeId: authUser.userId,
        refereeName: currentUser.name,
        refereeEmail: currentUser.email,
        code,
        status: 'completed',
      },
    })

    logger.info('Referral claimed', { refereeId: authUser.userId, referrerId: referrer.id, code })

    logApiRequest('POST', '/api/referrals', 200, Date.now() - start, authUser.userId)
    return NextResponse.json({
      success: true,
      data: {
        referral,
        message: `Successfully referred by ${referrer.name}! You earned 1 free call.`,
      },
    })
  } catch (error: unknown) {
    logApiError('POST', '/api/referrals', error)
    const message = error instanceof Error ? error.message : 'Failed to claim referral'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
