import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { cookies } from 'next/headers'

// GET /api/bookings - List all bookings with optional filters (auth required)
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
    const nannyId = searchParams.get('nannyId')
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')

    const where: Record<string, string> = {}

    // Non-admin users can only see their own bookings (or bookings for their nanny profile)
    if (payload.role !== 'admin') {
      if (userId && userId !== payload.userId) {
        return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
      }
      // Check if user is a nanny and filter accordingly
      const nannyProfile = await db.nanny.findUnique({ where: { userId: payload.userId } })
      if (nannyProfile) {
        where.nannyId = nannyProfile.id
      } else {
        where.parentId = payload.userId
      }
    } else if (userId) {
      where.parentId = userId
    }

    if (nannyId) where.nannyId = nannyId
    if (status) where.status = status

    const bookings = await db.booking.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        nanny: true,
        callSession: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: bookings })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch bookings'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// POST /api/bookings - Create a new booking (auth required, subscription check)
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

    // Check subscription eligibility
    const user = await db.user.findUnique({ where: { id: payload.userId } })
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 })
    }

    let canBook = false
    if (user.trialStartDate) {
      const daysPassed = Math.floor((Date.now() - new Date(user.trialStartDate).getTime()) / (1000 * 60 * 60 * 24))
      canBook = daysPassed < 30
    }
    if (!canBook && user.subscriptionStatus === 'active') {
      canBook = true
    }
    if (!canBook) {
      return NextResponse.json(
        { success: false, error: 'Active subscription or trial required to book calls' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const requiredFields = ['nannyId', 'parentName', 'parentEmail', 'type']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    if (!['instant', 'scheduled'].includes(body.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid booking type. Must be "instant" or "scheduled"' },
        { status: 400 }
      )
    }

    // Validate nanny exists
    const nanny = await db.nanny.findUnique({ where: { id: body.nannyId } })
    if (!nanny) {
      return NextResponse.json(
        { success: false, error: 'Nanny not found' },
        { status: 404 }
      )
    }

    const isInstant = body.type === 'instant'
    const roomId = `room-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    // Create booking
    const booking = await db.booking.create({
      data: {
        nannyId: body.nannyId,
        parentId: payload.userId,
        parentName: body.parentName,
        parentEmail: body.parentEmail,
        type: body.type,
        status: isInstant ? 'confirmed' : 'pending',
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        notes: body.notes || null,
      },
    })

    // For instant bookings, auto-create a CallSession
    if (isInstant) {
      await db.callSession.create({
        data: {
          bookingId: booking.id,
          roomId,
          status: 'waiting',
        },
      })
    }

    // Return booking with callSession
    const bookingWithSession = await db.booking.findUnique({
      where: { id: booking.id },
      include: {
        nanny: true,
        callSession: true,
      },
    })

    return NextResponse.json({ success: true, data: bookingWithSession }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create booking'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
