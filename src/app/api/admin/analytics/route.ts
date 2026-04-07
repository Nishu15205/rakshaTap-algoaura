import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Daily bookings last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      d.setHours(0, 0, 0, 0)
      return d
    })

    const dailyBookings = await Promise.all(
      last7Days.map(async (day) => {
        const nextDay = new Date(day)
        nextDay.setDate(nextDay.getDate() + 1)
        const count = await db.booking.count({
          where: {
            createdAt: { gte: day, lt: nextDay },
          },
        })
        return { day: day.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }), bookings: count }
      })
    )

    // Booking status distribution
    const statusCounts = await db.booking.groupBy({
      by: ['status'],
      _count: { status: true },
    })

    const statusData = statusCounts.map((s) => ({
      name: s.status,
      value: s._count.status,
    }))

    // Revenue data
    const completedPayments = await db.payment.findMany({
      where: { status: 'completed' },
    })
    const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0)
    const recentPayments = completedPayments.slice(-7)

    // User growth
    const userCount = await db.user.count()
    const recentUsers = await db.user.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    })

    // Top nannies by booking count
    const topNannies = await db.booking.groupBy({
      by: ['nannyId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    })
    const topNannyData = await Promise.all(
      topNannies.map(async (tn) => {
        const nanny = await db.nanny.findUnique({ where: { id: tn.nannyId } })
        return { name: nanny?.name || 'Unknown', bookings: tn._count.id }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        dailyBookings,
        statusData,
        totalRevenue,
        userCount,
        recentUsers,
        topNannyData,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch analytics'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
