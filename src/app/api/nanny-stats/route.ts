import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/nanny-stats?userId=XXX
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    // Find the nanny profile linked to this user
    const nanny = await db.nanny.findUnique({
      where: { userId },
      include: {
        reviews: {
          orderBy: { createdAt: 'desc' },
        },
        bookings: {
          include: {
            callSession: {
              include: {
                messages: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!nanny) {
      return NextResponse.json(
        { success: false, error: 'Nanny profile not found for this user' },
        { status: 404 }
      )
    }

    // 1. Count completed bookings
    const completedBookings = nanny.bookings.filter(
      (b) => b.status === 'completed'
    )
    const callsCompleted = completedBookings.length

    // 2. Sum totalPrice of completed bookings
    const totalEarnings = completedBookings.reduce(
      (sum, b) => sum + (b.totalPrice || 0),
      0
    )

    // 3. Average rating from reviews
    const avgRating =
      nanny.reviews.length > 0
        ? nanny.reviews.reduce((sum, r) => sum + r.rating, 0) /
          nanny.reviews.length
        : 0

    // 4. Total review count
    const totalReviews = nanny.reviews.length

    // 5. Total call minutes (sum of all completed booking durations)
    const totalCallMinutes = completedBookings.reduce(
      (sum, b) => sum + (b.duration || 0),
      0
    )

    // 6. Recent reviews (last 5)
    const recentReviews = nanny.reviews.slice(0, 5).map((r) => ({
      id: r.id,
      parentName: r.parentName,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    }))

    // 7. Earnings breakdown (last 6 months from completed bookings)
    const now = new Date()
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ]

    const earningsBreakdown: Array<{ month: string; amount: number }> = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = d.getFullYear()
      const month = d.getMonth()
      const label = `${monthNames[month]} ${year}`

      const monthEarnings = completedBookings
        .filter((b) => {
          if (!b.createdAt) return false
          const bDate = new Date(b.createdAt)
          return bDate.getFullYear() === year && bDate.getMonth() === month
        })
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0)

      earningsBreakdown.push({ month: label, amount: Math.round(monthEarnings) })
    }

    // 8. Get upcoming bookings (confirmed or pending)
    const upcomingCalls = nanny.bookings
      .filter((b) => ['confirmed', 'pending'].includes(b.status))
      .map((b) => ({
        id: b.id,
        type: b.type,
        status: b.status,
        parentName: b.parentName,
        scheduledAt: b.scheduledAt,
        createdAt: b.createdAt.toISOString(),
      }))

    // 9. Get recent bookings (last 10)
    const recentCalls = nanny.bookings.slice(0, 10).map((b) => ({
      id: b.id,
      type: b.type,
      status: b.status,
      parentName: b.parentName,
      totalPrice: b.totalPrice,
      scheduledAt: b.scheduledAt,
      duration: b.duration,
      createdAt: b.createdAt.toISOString(),
    }))

    // 10. Get recent notifications for this user
    const recentNotifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    return NextResponse.json({
      success: true,
      data: {
        nanny: {
          id: nanny.id,
          name: nanny.name,
          specialty: nanny.specialty,
          experience: nanny.experience,
          rating: nanny.rating,
          reviewCount: nanny.reviewCount,
          pricePerMin: nanny.pricePerMin,
          availability: nanny.availability,
          isOnline: nanny.isOnline,
        },
        callsCompleted,
        totalEarnings,
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews,
        totalCallMinutes,
        recentReviews,
        earningsBreakdown,
        upcomingCalls,
        recentCalls,
        recentNotifications,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch nanny stats'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
