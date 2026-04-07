import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, verifyToken, COOKIE_NAME } from '@/lib/auth'
import { cookies } from 'next/headers'

// GET — List all accounts (admin only)
export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        subscriptionStatus: true,
        trialStartDate: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: users })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch accounts'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// POST — Create a new account (admin only) — for adding real Gmail experts
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, password, phone, role } = body

    // Validation
    const nameStr = name ? String(name) : ''
    const emailStr = email ? String(email) : ''
    const passwordStr = password ? String(password) : ''

    if (nameStr.length < 2) {
      return NextResponse.json({ success: false, error: 'Name must be at least 2 characters' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
      return NextResponse.json({ success: false, error: 'Please enter a valid email address' }, { status: 400 })
    }
    if (passwordStr.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 })
    }
    if (!['parent', 'nanny', 'admin'].includes(role)) {
      return NextResponse.json({ success: false, error: 'Role must be parent, nanny, or admin' }, { status: 400 })
    }

    // Check if email already exists
    const existing = await db.user.findUnique({ where: { email: emailStr } })
    if (existing) {
      return NextResponse.json({ success: false, error: 'An account with this email already exists' }, { status: 409 })
    }

    const hashedPassword = await hashPassword(passwordStr)

    const user = await db.user.create({
      data: {
        name: nameStr,
        email: emailStr,
        phone: phone ? String(phone) : undefined,
        password: hashedPassword,
        role: role,
      },
    })

    // Create welcome notification
    await db.notification.create({
      data: {
        userId: user.id,
        title: 'Welcome to MUMAA!',
        message: `Your account has been created by the admin. You can now log in with your credentials.`,
        type: 'success',
      },
    })

    return NextResponse.json({
      success: true,
      message: `Account created successfully for ${emailStr}`,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create account'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
