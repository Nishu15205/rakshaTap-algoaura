import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { cookies } from 'next/headers'

// Valid email types
const VALID_TYPES = [
  'registration_notification',
  'meeting_scheduled',
  'approval',
  'rejection',
  'otp',
  'password_reset',
  'welcome',
  'general',
]

// Simple rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
function isRateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }
  if (entry.count >= max) return true
  entry.count++
  return false
}

// POST /api/send-email — Send email notification (auth required, rate limited)
export async function POST(request: NextRequest) {
  try {
    // Auth check — only authenticated users can send emails
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }
    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 })
    }

    // Rate limit: max 20 emails per user per hour
    if (isRateLimited(`email:${payload.userId}`, 20, 60 * 60 * 1000)) {
      return NextResponse.json({ success: false, error: 'Too many email requests. Try again later.' }, { status: 429 })
    }

    const body = await request.json()
    const { to, subject, body: emailBody, type, userId } = body

    if (!to || !subject || !emailBody) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, subject, body' },
        { status: 400 }
      )
    }

    if (type && !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid email type. Valid types: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Only allow sending to the authenticated user's own email (or admin can send to anyone)
    if (payload.role !== 'admin' && to.toLowerCase() !== payload.email.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'You can only send emails to your own address' },
        { status: 403 }
      )
    }

    // Create in-app notification if userId is provided and belongs to the authenticated user
    const targetUserId = userId || payload.userId
    if (targetUserId) {
      const notificationType = mapEmailTypeToNotificationType(type)
      await db.notification.create({
        data: {
          userId: payload.role === 'admin' ? targetUserId : payload.userId,
          title: subject,
          message: emailBody.length > 200 ? emailBody.substring(0, 200) + '...' : emailBody,
          type: notificationType,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Notification created successfully',
      data: { to, subject, type: type || 'general', sentAt: new Date().toISOString() },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send email'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

function mapEmailTypeToNotificationType(emailType?: string): string {
  switch (emailType) {
    case 'registration_notification': return 'info'
    case 'meeting_scheduled': return 'info'
    case 'approval': return 'success'
    case 'rejection': return 'warning'
    case 'otp': case 'password_reset': return 'info'
    case 'welcome': return 'success'
    default: return 'info'
  }
}
