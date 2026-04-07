import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

// GET /api/auth/verify?token=XXX
// Verifies token — now accepts real JWT tokens (backward compatible with base64 during transition)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    // Try JWT verification first (preferred)
    const jwtPayload = await verifyToken(token)
    if (jwtPayload) {
      // Verify user exists in database
      const user = await db.user.findUnique({ where: { id: jwtPayload.userId } })
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 401 }
        )
      }
      return NextResponse.json({
        success: true,
        data: {
          userId: user.id,
          role: user.role,
          email: user.email,
          name: user.name,
        },
      })
    }

    // Fallback: try base64 JSON decode (for backward compatibility with video call signaling)
    let decoded: { userId: string; role: string; email: string }
    try {
      decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'))

      if (!decoded.userId || !decoded.role || !decoded.email) {
        return NextResponse.json(
          { success: false, error: 'Invalid token' },
          { status: 401 }
        )
      }

      if (!['parent', 'nanny', 'admin'].includes(decoded.role)) {
        return NextResponse.json(
          { success: false, error: 'Invalid token: unsupported role' },
          { status: 401 }
        )
      }
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid token format' },
        { status: 401 }
      )
    }

    // Verify user exists and email matches
    const user = await db.user.findUnique({ where: { id: decoded.userId } })
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      )
    }

    if (user.email.toLowerCase() !== decoded.email.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'Email mismatch' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        role: user.role,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Token verification failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
