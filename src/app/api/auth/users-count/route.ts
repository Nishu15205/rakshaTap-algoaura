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

    const count = await db.user.count()
    return NextResponse.json({ success: true, data: count })
  } catch {
    return NextResponse.json({ success: false, data: 0 })
  }
}
