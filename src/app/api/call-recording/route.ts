import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { cookies } from 'next/headers'

const ALLOWED_EXTENSIONS = ['webm', 'mp4']

// POST /api/call-recording
// FormData: callSessionId (string) and recording (File/Blob)
export async function POST(request: NextRequest) {
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

    const formData = await request.formData()
    const callSessionId = formData.get('callSessionId') as string | null
    const recording = formData.get('recording') as File | null

    if (!callSessionId) {
      return NextResponse.json(
        { success: false, error: 'callSessionId is required' },
        { status: 400 }
      )
    }

    if (!recording) {
      return NextResponse.json(
        { success: false, error: 'Recording file is required' },
        { status: 400 }
      )
    }

    if (recording.size > 100 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: `File size exceeds the 100MB limit.` },
        { status: 400 }
      )
    }

    const fileExtension = (recording.name?.split('.').pop() || 'webm').toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return NextResponse.json(
        { success: false, error: `Invalid file type. Only ${ALLOWED_EXTENSIONS.join(', ')} are allowed.` },
        { status: 400 }
      )
    }

    // Verify the call session exists
    const session = await db.callSession.findUnique({
      where: { id: callSessionId },
      include: { booking: true },
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Call session not found' },
        { status: 404 }
      )
    }

    // Ownership check
    const isParent = session.booking?.parentId === payload.userId
    let isNannyCheck = false
    if (session.booking) {
      const nanny = await db.nanny.findUnique({ where: { id: session.booking.nannyId } })
      isNannyCheck = nanny?.userId === payload.userId
    }
    const isAdmin = payload.role === 'admin'
    if (!isParent && !isNannyCheck && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    // In serverless, recordings would be uploaded to object storage (S3, R2, etc.)
    // Store a placeholder URL
    const recordingUrl = `recording://${callSessionId}.${fileExtension}`

    await db.callSession.update({
      where: { id: callSessionId },
      data: { recordingUrl },
    })

    return NextResponse.json({
      success: true,
      data: {
        callSessionId,
        recordingUrl,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to upload recording'
    console.error('Recording upload error:', error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
