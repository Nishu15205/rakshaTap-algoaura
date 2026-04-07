import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { logApiRequest, logApiError } from '@/lib/logger'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now()
  try {
    const { id } = await params
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const notification = await db.notification.findUnique({ where: { id } })
    if (!notification) {
      return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 })
    }

    // Ownership check: user can only mark their own notifications as read (admin can mark any)
    if (notification.userId !== authUser.userId && authUser.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    await db.notification.update({
      where: { id },
      data: { read: true },
    })

    logApiRequest('PATCH', `/api/notifications/${id}/read`, 200, Date.now() - start, authUser.userId)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const { id } = await params
    logApiError('PATCH', `/api/notifications/${id}/read`, error)
    const message = error instanceof Error ? error.message : 'Failed to update notification'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
