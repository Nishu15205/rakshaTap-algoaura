import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { cookies } from 'next/headers'

// GET — Show all account credentials (admin only) for easy reference
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
        role: true,
        createdAt: true,
      },
      orderBy: { role: 'asc' },
    })

    // Group by role
    const accounts: Record<string, Array<{ id: string; name: string; email: string; createdAt: string }>> = {
      admin: [],
      nanny: [],
      parent: [],
    }

    for (const user of users) {
      const role = user.role as string
      if (!accounts[role]) accounts[role] = []
      accounts[role].push({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        totalAccounts: users.length,
        accounts,
        note: 'Passwords are bcrypt hashed in the database. To reset a password, use the Forgot Password feature.',
        smtpConfigured: !!(process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD && process.env.SMTP_EMAIL !== 'your-email@gmail.com'),
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch credentials'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
