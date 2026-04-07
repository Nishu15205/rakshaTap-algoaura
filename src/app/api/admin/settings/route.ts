import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, COOKIE_NAME, hashPassword, comparePassword } from '@/lib/auth'
import { cookies } from 'next/headers'

// Helper: verify admin JWT token
async function verifyAdmin(): Promise<NextResponse | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) {
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
  }
  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  }
  return null
}

// Helper: strip password from admin settings
function sanitizeSettings(settings: Record<string, unknown>) {
  const { password, ...safeSettings } = settings
  return safeSettings
}

// GET /api/admin/settings — Fetch admin settings (create default if none exists)
export async function GET() {
  try {
    const authError = await verifyAdmin()
    if (authError) return authError

    let settings = await db.adminSettings.findFirst()

    if (!settings) {
      // Create default admin settings with bcrypt-hashed password
      settings = await db.adminSettings.create({
        data: {
          notificationEmail: 'admin@mumaa.in',
          password: await hashPassword('Admin@2025'),
        },
      })
    }

    const sanitized = sanitizeSettings(settings as unknown as Record<string, unknown>)
    return NextResponse.json({ success: true, data: sanitized })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch admin settings'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// PATCH /api/admin/settings — Update admin settings
export async function PATCH(request: NextRequest) {
  try {
    const authError = await verifyAdmin()
    if (authError) return authError

    const body = await request.json()
    const { notificationEmail, password, currentPassword } = body

    // Find existing settings
    let settings = await db.adminSettings.findFirst()

    if (!settings) {
      // Create default if none exists
      settings = await db.adminSettings.create({
        data: {
          notificationEmail: 'admin@mumaa.in',
          password: await hashPassword('Admin@2025'),
        },
      })
    }

    const updateData: Record<string, string> = {}

    // Update notification email if provided
    if (notificationEmail !== undefined) {
      updateData.notificationEmail = notificationEmail
    }

    // Update password if provided (requires currentPassword)
    if (password !== undefined) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: 'Current password is required to update password' },
          { status: 400 }
        )
      }

      const isMatch = await comparePassword(currentPassword, settings.password)
      if (!isMatch) {
        return NextResponse.json(
          { success: false, error: 'Current password is incorrect' },
          { status: 401 }
        )
      }

      if (password.length < 6) {
        return NextResponse.json(
          { success: false, error: 'New password must be at least 6 characters long' },
          { status: 400 }
        )
      }

      updateData.password = await hashPassword(password)
    }

    // Perform update if there's anything to update
    if (Object.keys(updateData).length === 0) {
      const sanitized = sanitizeSettings(settings as unknown as Record<string, unknown>)
      return NextResponse.json({ success: true, data: sanitized })
    }

    const updatedSettings = await db.adminSettings.update({
      where: { id: settings.id },
      data: updateData,
    })

    const sanitized = sanitizeSettings(updatedSettings as unknown as Record<string, unknown>)
    return NextResponse.json({ success: true, data: sanitized })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update admin settings'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
