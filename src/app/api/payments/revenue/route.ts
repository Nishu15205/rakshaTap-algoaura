import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function GET() {
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
    if (payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const completedPayments = await db.payment.findMany({
      where: { status: 'completed' },
    })
    const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0)
    return NextResponse.json({ success: true, data: Math.round(totalRevenue) })
  } catch {
    return NextResponse.json({ success: false, data: 0 })
  }
}
