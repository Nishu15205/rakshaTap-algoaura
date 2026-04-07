import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper: send email notification via the email service
async function sendEmailNotification(params: {
  to: string
  subject: string
  body: string
  type: string
  userId: string
}) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    await fetch(`${baseUrl}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
  } catch {
    console.log(`[EMAIL] Failed to send email to ${params.to}`)
  }
}

// GET /api/nanny-registrations/[id] - Get single registration by id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const registration = await db.nannyRegistration.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!registration) {
      return NextResponse.json(
        { success: false, error: 'Registration not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: registration })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch registration'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// PATCH /api/nanny-registrations/[id] - Update registration with actions
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action, meetingDate, meetingTime, meetingLink, adminNotes } = body

    const registration = await db.nannyRegistration.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!registration) {
      return NextResponse.json(
        { success: false, error: 'Registration not found' },
        { status: 404 }
      )
    }

    let updatedRegistration

    if (action === 'schedule-meeting') {
      updatedRegistration = await db.nannyRegistration.update({
        where: { id },
        data: {
          meetingDate: meetingDate ? new Date(meetingDate) : undefined,
          meetingTime,
          meetingLink,
          adminNotes: adminNotes || undefined,
          status: 'meeting_scheduled',
        },
        include: { user: true },
      })

      // Notify nanny about scheduled meeting
      await db.notification.create({
        data: {
          userId: registration.userId,
          title: 'Meeting Scheduled',
          message: `Your application meeting has been scheduled${meetingDate ? ` for ${meetingDate}` : ''}. ${meetingLink ? `Join link: ${meetingLink}` : 'You will receive the meeting link shortly.'}`,
          type: 'meeting',
        },
      })

      // Send email to nanny
      await sendEmailNotification({
        to: registration.email,
        subject: 'MUMAA - Meeting Scheduled for Your Application',
        body: `Dear ${registration.fullName},\n\nYour application meeting has been scheduled.\n\nDate: ${meetingDate || 'TBD'}\nTime: ${meetingTime || 'TBD'}\n${meetingLink ? `Join Link: ${meetingLink}` : 'Meeting link will be shared shortly.'}\n${adminNotes ? `Notes: ${adminNotes}` : ''}\n\nPlease join the meeting on time. We look forward to speaking with you!\n\nBest regards,\nMUMAA Team`,
        type: 'meeting_scheduled',
        userId: registration.userId,
      })
    } else if (action === 'approve') {
      updatedRegistration = await db.nannyRegistration.update({
        where: { id },
        data: {
          status: 'approved',
          approvedAt: new Date(),
          adminNotes: adminNotes || undefined,
        },
        include: { user: true },
      })

      // Create Nanny profile from registration data
      const avatarIndex = (registration.fullName.charCodeAt(0) % 6) + 1
      await db.nanny.create({
        data: {
          name: registration.fullName,
          specialty: registration.specialty || 'General Care',
          experience: registration.experience || 0,
          bio: registration.about || `Experienced ${registration.specialty || 'nanny'} based in ${registration.city || 'India'}.`,
          avatar: `/nannies/nanny${avatarIndex}.png`,
          availability: 'available',
          pricePerMin: 0,
          languages: registration.languages || 'Hindi, English',
          isOnline: false,
          isActive: true,
          userId: registration.userId,
        },
      })

      // Update user role to nanny if not already
      await db.user.update({
        where: { id: registration.userId },
        data: { role: 'nanny' },
      })

      // Notify nanny about approval
      await db.notification.create({
        data: {
          userId: registration.userId,
          title: 'Application Approved! 🎉',
          message: 'Congratulations! Your nanny application has been approved. You are now listed as a MUMAA expert.',
          type: 'success',
        },
      })

      // Send email to nanny
      await sendEmailNotification({
        to: registration.email,
        subject: 'MUMAA - Your Application Has Been Approved! 🎉',
        body: `Dear ${registration.fullName},\n\nCongratulations! Your nanny application has been approved.\n\nYou are now listed as a MUMAA expert consultant. Parents can now book video consultations with you.\n\n${adminNotes ? `Admin Notes: ${adminNotes}` : ''}\n\nLog in to your dashboard to manage your profile, availability, and upcoming calls.\n\nWelcome to the MUMAA team!\n\nBest regards,\nMUMAA Team`,
        type: 'approval',
        userId: registration.userId,
      })
    } else if (action === 'reject') {
      updatedRegistration = await db.nannyRegistration.update({
        where: { id },
        data: {
          status: 'rejected',
          rejectedAt: new Date(),
          adminNotes: adminNotes || undefined,
        },
        include: { user: true },
      })

      // Notify nanny about rejection
      await db.notification.create({
        data: {
          userId: registration.userId,
          title: 'Application Update',
          message: `Your nanny application was not approved at this time. ${adminNotes ? `Reason: ${adminNotes}` : 'Please feel free to apply again after gaining more experience.'}`,
          type: 'warning',
        },
      })

      // Send email to nanny
      await sendEmailNotification({
        to: registration.email,
        subject: 'MUMAA - Application Update',
        body: `Dear ${registration.fullName},\n\nThank you for your interest in joining MUMAA as an expert consultant.\n\nAfter careful review, we are unable to approve your application at this time.\n${adminNotes ? `\nReason: ${adminNotes}` : ''}\n\nWe encourage you to continue building your experience and apply again in the future.\n\nBest regards,\nMUMAA Team`,
        type: 'rejection',
        userId: registration.userId,
      })
    } else {
      // Generic update without action
      const updateData: Record<string, unknown> = {}
      if (adminNotes !== undefined) updateData.adminNotes = adminNotes
      if (meetingDate !== undefined) updateData.meetingDate = meetingDate ? new Date(meetingDate) : null
      if (meetingTime !== undefined) updateData.meetingTime = meetingTime
      if (meetingLink !== undefined) updateData.meetingLink = meetingLink

      updatedRegistration = await db.nannyRegistration.update({
        where: { id },
        data: updateData,
        include: { user: true },
      })
    }

    return NextResponse.json({ success: true, data: updatedRegistration })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update registration'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
