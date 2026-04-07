import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import { join } from 'path'
import { getAuthUser } from '@/lib/auth'

const BASE_DIR = '/home/z/my-project/uploads'
const ALLOWED_TYPES = ['resume', 'avatar'] as const

const MIME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
}

// Resume files require authentication; avatar files are public
async function isAuthorized(type: string): Promise<boolean> {
  if (type === 'avatar') return true
  if (type === 'resume') {
    const user = await getAuthUser()
    return !!user
  }
  return false
}

// Sanitize filename to prevent path traversal
function sanitizeFilename(filename: string): string {
  // Remove any directory components
  return filename.replace(/[/\\]/g, '').replace(/\.\./g, '')
}

// GET /api/serve-file?type=resume|avatar&filename=xyz.pdf
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const type = searchParams.get('type') || ''
    const filename = searchParams.get('filename') || ''

    // Validate type
    if (!ALLOWED_TYPES.includes(type as typeof ALLOWED_TYPES[number])) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Must be "resume" or "avatar".' },
        { status: 400 }
      )
    }

    // Validate filename
    if (!filename || filename.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Filename is required.' },
        { status: 400 }
      )
    }

    // Check authorization (resume requires auth, avatar is public)
    if (!(await isAuthorized(type))) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to access this file.' },
        { status: 401 }
      )
    }

    // Sanitize and construct file path
    const safeFilename = sanitizeFilename(filename)
    const filepath = join(BASE_DIR, type, safeFilename)

    // Check file exists
    try {
      await stat(filepath)
    } catch {
      return NextResponse.json(
        { success: false, error: 'File not found.' },
        { status: 404 }
      )
    }

    // Read file
    const fileBuffer = await readFile(filepath)

    // Determine content type
    const ext = safeFilename.split('.').pop()?.toLowerCase() || ''
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'

    // Set Content-Disposition
    const disposition = type === 'resume'
      ? `attachment; filename="${safeFilename}"`
      : `inline; filename="${safeFilename}"`

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': disposition,
        'Content-Length': String(fileBuffer.length),
        'Cache-Control': type === 'avatar' ? 'public, max-age=86400' : 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to serve file'
    console.error('[SERVE FILE ERROR]', message)
    return NextResponse.json({ success: false, error: 'Failed to serve file.' }, { status: 500 })
  }
}
