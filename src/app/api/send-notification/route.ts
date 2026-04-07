import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/send-notification - Send notification via multiple channels
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, title, message, type, channel } = body

    if (!userId || !title || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, title, message' },
        { status: 400 }
      )
    }

    const notificationType = type || 'info'
    const channels = channel ? [channel] : ['in-app']

    // Get user info for email/SMS channels
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Always create in-app notification
    await db.notification.create({
      data: {
        userId,
        title,
        message,
        type: notificationType,
      },
    })

    // Process channel-specific sending
    const sentChannels: string[] = ['in-app']

    if (channels.includes('email')) {
      // Placeholder for real email service (e.g., Nodemailer, SendGrid)
      console.log(`[Email] Sent to: ${user.email}`)
      console.log(`[Email] Subject: ${title}`)
      console.log(`[Email] Body: ${message}`)
      sentChannels.push('email')
    }

    if (channels.includes('sms')) {
      // Placeholder for real SMS service (e.g., Twilio, MSG91)
      console.log(`[SMS] Sent to: ${user.phone || 'no phone number'}`)
      console.log(`[SMS] Message: ${title} - ${message}`)
      sentChannels.push('sms')
    }

    return NextResponse.json({
      success: true,
      data: {
        channels: sentChannels,
        userId,
        title,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send notification'
    console.error('Notification sending error:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
