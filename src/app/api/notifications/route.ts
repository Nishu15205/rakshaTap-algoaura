import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { cookies } from 'next/headers'

// GET /api/notifications - List notifications (auth required, own data only)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }
    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Users can only read their own notifications (admin can read any)
    if (userId && userId !== payload.userId && payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    const queryUserId = userId || payload.userId

    const notifications = await db.notification.findMany({
      where: { userId: queryUserId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: notifications })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch notifications'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// POST /api/notifications - Create a notification (auth required)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }
    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, title, message, type } = body

    if (!userId || !title || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, title, message' },
        { status: 400 }
      )
    }

    // Users can only create notifications for themselves (admin can create for any)
    if (userId !== payload.userId && payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    const notificationType = type || 'info'

    const notification = await db.notification.create({
      data: {
        userId,
        title,
        message,
        type: notificationType,
      },
    })

    // Future: integrate with real email/SMS for meeting notifications
    void notificationType

    return NextResponse.json({ success: true, data: notification }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create notification'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
