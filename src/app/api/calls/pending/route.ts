import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/calls/pending?nannyId=xxx — Get pending (waiting) calls for a nanny
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const nannyId = searchParams.get('nannyId')
    if (!nannyId) {
      return NextResponse.json({ success: false, error: 'nannyId required' }, { status: 400 })
    }

    // Find bookings for this nanny that have a waiting call session
    const bookings = await db.booking.findMany({
      where: {
        nannyId,
        status: 'confirmed',
      },
      include: {
        callSession: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    // Filter to only those with waiting call sessions (not yet accepted/rejected)
    const pendingCalls = bookings.filter((b) => b.callSession && b.callSession.status === 'waiting')

    return NextResponse.json({ success: true, data: pendingCalls })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch pending calls'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
