import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { cookies } from 'next/headers'

// GET /api/nannies/[id] - Get single nanny by ID (public)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const nanny = await db.nanny.findUnique({
      where: { id },
      include: {
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    if (!nanny) {
      return NextResponse.json(
        { success: false, error: 'Nanny not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: nanny })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch nanny'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// PATCH /api/nannies/[id] - Update nanny fields (own profile or admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()

    const existing = await db.nanny.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Nanny not found' },
        { status: 404 }
      )
    }

    // Ownership check: user can update their own nanny profile, or admin can update any
    const isOwnProfile = existing.userId === payload.userId
    const isAdmin = payload.role === 'admin'
    if (!isOwnProfile && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    const allowedFields = [
      'name', 'specialty', 'experience', 'bio', 'avatar',
      'availability', 'pricePerMin', 'languages', 'rating',
      'reviewCount', 'isActive', 'isOnline',
    ]
    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (['experience', 'pricePerMin', 'reviewCount'].includes(field)) {
          updateData[field] = Number(body[field])
        } else if (field === 'rating') {
          updateData[field] = Number(body[field])
        } else if (['isActive', 'isOnline'].includes(field)) {
          updateData[field] = Boolean(body[field])
        } else {
          updateData[field] = body[field]
        }
      }
    }

    const nanny = await db.nanny.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: nanny })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update nanny'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// DELETE /api/nannies/[id] - Soft delete (set isActive=false) — admin only
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    if (payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params

    const existing = await db.nanny.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Nanny not found' },
        { status: 404 }
      )
    }

    const nanny = await db.nanny.update({
      where: { id },
      data: { isActive: false, isOnline: false, availability: 'offline' },
    })

    return NextResponse.json({ success: true, data: nanny })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete nanny'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
