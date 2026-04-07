import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/calls?bookingId=X - Get call session by bookingId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'Missing required query param: bookingId' },
        { status: 400 }
      )
    }

    const callSession = await db.callSession.findUnique({
      where: { bookingId },
      include: {
        booking: {
          include: { nanny: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!callSession) {
      return NextResponse.json(
        { success: false, error: 'Call session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: callSession })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch call session'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// POST /api/calls - Start a call for a booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.bookingId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: bookingId' },
        { status: 400 }
      )
    }

    // Validate booking exists
    const booking = await db.booking.findUnique({
      where: { id: body.bookingId },
      include: { callSession: true },
    })

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    const roomId = `room-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    let callSession

    if (booking.callSession) {
      // Update existing session
      callSession = await db.callSession.update({
        where: { bookingId: body.bookingId },
        data: {
          roomId: roomId,
          status: 'active',
        },
      })
    } else {
      // Create new session
      callSession = await db.callSession.create({
        data: {
          bookingId: body.bookingId,
          roomId,
          status: 'active',
        },
      })
    }

    // Update booking status to in_progress
    await db.booking.update({
      where: { id: body.bookingId },
      data: {
        status: 'in_progress',
        startedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, data: callSession }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to start call'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
