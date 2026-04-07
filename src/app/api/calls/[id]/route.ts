import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH /api/calls/[id] - End a call
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const callSession = await db.callSession.findUnique({
      where: { id },
      include: {
        booking: {
          include: { nanny: true },
        },
      },
    })

    if (!callSession) {
      return NextResponse.json(
        { success: false, error: 'Call session not found' },
        { status: 404 }
      )
    }

    // End the call session
    const updatedSession = await db.callSession.update({
      where: { id },
      data: { status: 'ended' },
    })

    // Calculate duration and total price for the booking
    const booking = callSession.booking
    const endedAt = new Date()
    const startedAt = booking.startedAt ? new Date(booking.startedAt) : endedAt
    const durationMs = endedAt.getTime() - startedAt.getTime()
    const durationMin = Math.max(1, Math.ceil(durationMs / 60000))
    const totalPrice = 0 // Included in subscription/trial

    await db.booking.update({
      where: { id: booking.id },
      data: {
        status: 'completed',
        endedAt,
        duration: durationMin,
        totalPrice,
      },
    })

    return NextResponse.json({ success: true, data: updatedSession })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to end call'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
