import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { cookies } from 'next/headers'

function sanitizeUser(user: Record<string, unknown>) {
  const { password, otpCode, otpExpiry, ...safeUser } = user
  return safeUser
}

async function getAuthUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  const payload = await verifyToken(token)
  return payload
}

// GET /api/auth/me — Get current authenticated user
export async function GET() {
  try {
    const payload = await getAuthUser()

    if (!payload) {
      return NextResponse.json({ success: false, user: null })
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
    })

    if (!user) {
      return NextResponse.json({ success: false, user: null })
    }

    return NextResponse.json({
      success: true,
      data: sanitizeUser(user as unknown as Record<string, unknown>),
    })
  } catch {
    return NextResponse.json({ success: false, user: null })
  }
}

// PUT /api/auth/me — Update current user's profile
export async function PUT(request: NextRequest) {
  try {
    const payload = await getAuthUser()
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const allowedFields = ['name', 'phone', 'address', 'babyAge', 'emergencyContact', 'bio', 'availability', 'trialStartDate', 'subscriptionStatus', 'subscriptionPlan']
    const updateData: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: 'No valid fields to update' }, { status: 400 })
    }

    const updated = await db.user.update({
      where: { id: payload.userId },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: sanitizeUser(updated as unknown as Record<string, unknown>),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update profile'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
