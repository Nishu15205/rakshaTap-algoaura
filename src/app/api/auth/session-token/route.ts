import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { cookies } from 'next/headers'

// POST /api/auth/session-token — Returns verified user data from JWT cookie
// SECURITY: Removed insecure body-based userId fallback (SEC-04 fix)
export async function POST(_request: NextRequest) {
  try {
    // Only accept JWT token from httpOnly cookie — no body-based auth
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, name: true },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      )
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Session verification failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
