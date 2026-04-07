import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { cookies } from 'next/headers'

// GET /api/nannies - List active nannies with optional filters (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const specialty = searchParams.get('specialty')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = { isActive: true }

    if (specialty) {
      where.specialty = specialty
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { specialty: { contains: search } },
        { bio: { contains: search } },
      ]
    }

    const nannies = await db.nanny.findMany({
      where: Object.keys(where).length > 1 || where.isActive
        ? where
        : undefined,
      orderBy: { createdAt: 'asc' },
    })

    // Filter out isActive=false nannies (SQLite might need explicit filter)
    const activeNannies = nannies.filter((n) => n.isActive)

    return NextResponse.json({ success: true, data: activeNannies })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch nannies'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// POST /api/nannies - Admin creates a nanny directly
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
    if (payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()

    const requiredFields = ['name', 'specialty', 'experience', 'bio', 'languages']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    let userId = body.userId
    if (!userId) {
      const email = body.email || `${body.name.toLowerCase().replace(/\s+/g, '.')}@mumaa.in`
      const existingUser = await db.user.findUnique({ where: { email } })
      if (existingUser) {
        userId = existingUser.id
      } else {
        const newUser = await db.user.create({
          data: {
            name: body.name,
            email,
            phone: body.phone || null,
            role: 'nanny',
            password: 'default_password_' + Date.now(),
            specialty: body.specialty,
            experience: Number(body.experience),
            bio: body.bio,
            pricePerMin: 0,
            languages: body.languages,
          },
        })
        userId = newUser.id
      }
    }

    const avatarIndex = (body.name.charCodeAt(0) % 6) + 1
    const nanny = await db.nanny.create({
      data: {
        name: body.name,
        specialty: body.specialty,
        experience: Number(body.experience),
        rating: body.rating ? Number(body.rating) : 0,
        reviewCount: body.reviewCount ? Number(body.reviewCount) : 0,
        bio: body.bio,
        avatar: body.avatar || `/nannies/nanny${avatarIndex}.png`,
        availability: body.availability || 'available',
        pricePerMin: 0,
        languages: body.languages,
        isOnline: false,
        isActive: true,
        userId,
      },
    })

    return NextResponse.json({ success: true, data: nanny }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create nanny'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// DELETE /api/nannies - Soft delete a nanny by id (set isActive=false) — admin only
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing required query parameter: id' },
        { status: 400 }
      )
    }

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
