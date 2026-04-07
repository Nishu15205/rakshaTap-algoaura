import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'

// In serverless (Netlify), files are served from /tmp or object storage
// For now, return a graceful message since file serving requires persistent storage
const ALLOWED_TYPES = ['resume', 'avatar'] as const

// GET /api/serve-file?type=resume|avatar&filename=xyz.pdf
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const type = searchParams.get('type') || ''
    const filename = searchParams.get('filename') || ''

    if (!ALLOWED_TYPES.includes(type as typeof ALLOWED_TYPES[number])) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Must be "resume" or "avatar".' },
        { status: 400 }
      )
    }

    if (!filename || filename.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Filename is required.' },
        { status: 400 }
      )
    }

    // In a serverless environment, file storage requires an object storage service
    // (e.g., Netlify Blobs, AWS S3, Cloudflare R2)
    // For now, return 404 as files are not available in serverless
    return NextResponse.json(
      { success: false, error: 'File storage is not available in this deployment environment.' },
      { status: 404 }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to serve file'
    console.error('[SERVE FILE ERROR]', message)
    return NextResponse.json({ success: false, error: 'Failed to serve file.' }, { status: 500 })
  }
}
