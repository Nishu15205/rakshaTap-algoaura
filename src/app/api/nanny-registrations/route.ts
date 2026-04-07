import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/nanny-registrations - Create a nanny registration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId, fullName, email, phone, age, city, experience,
      specialty, languages, about, qualifications, resumeUrl, workExperience,
    } = body

    if (!fullName || !email || !phone) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: fullName, email, phone' },
        { status: 400 }
      )
    }

    // Create or link user
    let targetUserId = userId
    if (!targetUserId) {
      const existingUser = await db.user.findUnique({ where: { email } })
      if (existingUser) {
        targetUserId = existingUser.id
      } else {
        const newUser = await db.user.create({
          data: {
            name: fullName,
            email,
            phone,
            role: 'nanny',
            password: 'default_password_' + Date.now(),
          },
        })
        targetUserId = newUser.id
      }
    }

    // Check for existing registration
    const existingRegistration = await db.nannyRegistration.findUnique({
      where: { userId: targetUserId },
    })
    if (existingRegistration) {
      return NextResponse.json(
        { success: false, error: 'A registration already exists for this user' },
        { status: 409 }
      )
    }

    // Create registration with all fields including new ones
    const registration = await db.nannyRegistration.create({
      data: {
        userId: targetUserId,
        fullName,
        email,
        phone,
        age: age ? Number(age) : undefined,
        city,
        experience: experience ? Number(experience) : undefined,
        specialty,
        languages,
        about,
        qualifications: qualifications || undefined,
        resumeUrl: resumeUrl || undefined,
        workExperience: workExperience || undefined,
        status: 'pending',
      },
      include: { user: true },
    })

    // Create notification for admin — find admin user
    const adminUser = await db.user.findFirst({ where: { role: 'admin' } })
    const adminNotificationUserId = adminUser?.id || 'u3'

    await db.notification.create({
      data: {
        userId: adminNotificationUserId,
        title: 'New Nanny Application',
        message: `${fullName} has submitted a new nanny registration application.`,
        type: 'info',
      },
    })

    // Send email notification to admin via email service
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'admin@mumaa.in',
          subject: 'New Nanny Application Received',
          body: `A new nanny registration has been submitted:\n\nName: ${fullName}\nEmail: ${email}\nPhone: ${phone}\nSpecialty: ${specialty || 'N/A'}\nExperience: ${experience || 'N/A'} years\nCity: ${city || 'N/A'}\n\nPlease review the application in the admin dashboard.`,
          type: 'registration_notification',
          userId: adminNotificationUserId,
        }),
      })
    } catch {
      // Email send failure should not block registration
      console.log(`[EMAIL] Failed to send admin notification for new registration from ${email}`)
    }

    return NextResponse.json({ success: true, data: registration }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create registration'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// GET /api/nanny-registrations - List all registrations with optional status/userId filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (userId) where.userId = userId

    const registrations = await db.nannyRegistration.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: registrations })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch registrations'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
