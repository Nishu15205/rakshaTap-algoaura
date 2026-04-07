import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { logApiRequest, logApiError } from '@/lib/logger'

// Helper: parse pagination params
function parsePagination(searchParams: URLSearchParams, defaultLimit = 20, maxLimit = 100) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const limit = Math.min(maxLimit, Math.max(1, parseInt(searchParams.get('limit') || String(defaultLimit), 10) || defaultLimit))
  return { page, limit, skip: (page - 1) * limit }
}

// Helper: build paginated response
function paginatedResponse(data: unknown[], page: number, limit: number, total: number) {
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// GET /api/activity-log - List activity logs (admin only, paginated)
export async function GET(request: NextRequest) {
  const start = Date.now()
  try {
    // Verify admin access
    const authUser = await getAuthUser()
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')

    const where: Record<string, unknown> = {}
    if (userId) where.userId = userId
    if (action) where.action = action

    const { page, limit, skip } = parsePagination(searchParams)

    const [logs, total] = await Promise.all([
      db.activityLog.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.activityLog.count({
        where: Object.keys(where).length > 0 ? where : undefined,
      }),
    ])

    logApiRequest('GET', '/api/activity-log', 200, Date.now() - start, authUser.userId)
    return NextResponse.json(paginatedResponse(logs, page, limit, total))
  } catch (error: unknown) {
    logApiError('GET', '/api/activity-log', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch activity logs'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// POST /api/activity-log - Create activity log entry (authenticated)
export async function POST(request: NextRequest) {
  const start = Date.now()
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, details } = body

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
        { status: 400 }
      )
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
    const userAgent = request.headers.get('user-agent') || null

    // Fetch user info for the log
    let userName = authUser.role
    let role = authUser.role
    try {
      const user = await db.user.findUnique({
        where: { id: authUser.userId },
        select: { name: true, role: true },
      })
      if (user) {
        userName = user.name
        role = user.role
      }
    } catch {
      // Use defaults
    }

    const log = await db.activityLog.create({
      data: {
        userId: authUser.userId,
        userName,
        role,
        action,
        details: details || null,
        ipAddress,
        userAgent,
      },
    })

    logApiRequest('POST', '/api/activity-log', 201, Date.now() - start, authUser.userId)
    return NextResponse.json({ success: true, data: log }, { status: 201 })
  } catch (error: unknown) {
    logApiError('POST', '/api/activity-log', error)
    const message = error instanceof Error ? error.message : 'Failed to create activity log'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
