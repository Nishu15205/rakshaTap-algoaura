import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { cookies } from 'next/headers'

// GET /api/bookings/[id] - Get a single booking by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    const booking = await db.booking.findUnique({
      where: { id },
      include: { nanny: true, callSession: true },
    })

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Ownership check: user must be the parent, the nanny, or admin
    const isOwner = booking.parentId === payload.userId
    const isNanny = booking.nanny?.userId === payload.userId
    const isAdmin = payload.role === 'admin'
    if (!isOwner && !isNanny && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ success: true, data: booking })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch booking'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// PATCH /api/bookings/[id] - Update booking status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()

    const booking = await db.booking.findUnique({
      where: { id },
      include: { nanny: true, callSession: true },
    })

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Ownership check: user must be the parent, the nanny, or admin
    const isOwner = booking.parentId === payload.userId
    const isNanny = booking.nanny?.userId === payload.userId
    const isAdmin = payload.role === 'admin'
    if (!isOwner && !isNanny && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    const { action } = body

    if (action === 'start') {
      // Start the call
      if (booking.status !== 'confirmed' && booking.status !== 'pending') {
        return NextResponse.json(
          { success: false, error: `Cannot start a booking with status: ${booking.status}` },
          { status: 400 }
        )
      }

      const roomId = `room-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

      // Create CallSession if not exists
      if (!booking.callSession) {
        await db.callSession.create({
          data: {
            bookingId: booking.id,
            roomId,
            status: 'active',
          },
        })
      } else {
        await db.callSession.update({
          where: { bookingId: booking.id },
          data: { status: 'active' },
        })
      }

      const updatedBooking = await db.booking.update({
        where: { id },
        data: {
          status: 'in_progress',
          startedAt: new Date(),
        },
        include: { nanny: true, callSession: true },
      })

      return NextResponse.json({ success: true, data: updatedBooking })
    }

    if (action === 'end') {
      // End the call
      if (booking.status !== 'in_progress') {
        return NextResponse.json(
          { success: false, error: `Cannot end a booking with status: ${booking.status}` },
          { status: 400 }
        )
      }

      const endedAt = new Date()
      const startedAt = booking.startedAt ? new Date(booking.startedAt) : endedAt
      const durationMs = endedAt.getTime() - startedAt.getTime()
      const durationMin = Math.max(1, Math.ceil(durationMs / 60000))
      const totalPrice = 0 // Included in subscription/trial

      // Update call session status
      if (booking.callSession) {
        await db.callSession.update({
          where: { bookingId: booking.id },
          data: { status: 'ended' },
        })
      }

      const updatedBooking = await db.booking.update({
        where: { id },
        data: {
          status: 'completed',
          endedAt,
          duration: durationMin,
          totalPrice,
        },
        include: { nanny: true, callSession: true },
      })

      return NextResponse.json({ success: true, data: updatedBooking })
    }

    if (action === 'cancel') {
      // Cancel the booking
      if (booking.status === 'completed' || booking.status === 'cancelled') {
        return NextResponse.json(
          { success: false, error: `Cannot cancel a booking with status: ${booking.status}` },
          { status: 400 }
        )
      }

      // Update call session status if exists
      if (booking.callSession) {
        await db.callSession.update({
          where: { bookingId: booking.id },
          data: { status: 'ended' },
        })
      }

      const updatedBooking = await db.booking.update({
        where: { id },
        data: { status: 'cancelled' },
        include: { nanny: true, callSession: true },
      })

      return NextResponse.json({ success: true, data: updatedBooking })
    }

    // Generic update for other fields
    const allowedFields = ['parentName', 'parentEmail', 'type', 'notes', 'scheduledAt']
    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = field === 'scheduledAt' && body[field]
          ? new Date(body[field])
          : body[field]
      }
    }
    if (body.status) updateData.status = body.status

    const updatedBooking = await db.booking.update({
      where: { id },
      data: updateData,
      include: { nanny: true, callSession: true },
    })

    return NextResponse.json({ success: true, data: updatedBooking })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update booking'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// DELETE /api/bookings/[id] - Delete a booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    const booking = await db.booking.findUnique({
      where: { id },
      include: { nanny: true, callSession: true },
    })

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Ownership check: user must be the parent, the nanny, or admin
    const isOwner = booking.parentId === payload.userId
    const isNanny = booking.nanny?.userId === payload.userId
    const isAdmin = payload.role === 'admin'
    if (!isOwner && !isNanny && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    // Delete associated call session if exists
    if (booking.callSession) {
      await db.callSession.delete({ where: { bookingId: booking.id } })
    }

    await db.booking.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Booking deleted' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete booking'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
