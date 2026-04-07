import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { cookies } from 'next/headers'

// GET /api/reviews?nannyId=X - Get reviews for a nanny (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const nannyId = searchParams.get('nannyId')

    if (!nannyId) {
      return NextResponse.json(
        { success: false, error: 'Missing required query param: nannyId' },
        { status: 400 }
      )
    }

    const reviews = await db.review.findMany({
      where: { nannyId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: reviews })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch reviews'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// POST /api/reviews - Create a review and update nanny rating (auth required)
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

    const body = await request.json()

    const requiredFields = ['nannyId', 'parentName', 'rating']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Validate nanny exists
    const nanny = await db.nanny.findUnique({ where: { id: body.nannyId } })
    if (!nanny) {
      return NextResponse.json(
        { success: false, error: 'Nanny not found' },
        { status: 404 }
      )
    }

    // Create the review
    const review = await db.review.create({
      data: {
        nannyId: body.nannyId,
        parentName: body.parentName,
        rating: Number(body.rating),
        comment: body.comment || null,
      },
    })

    // Recalculate nanny's average rating and review count
    const allReviews = await db.review.findMany({
      where: { nannyId: body.nannyId },
      select: { rating: true },
    })

    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0)
    const avgRating = Math.round((totalRating / allReviews.length) * 10) / 10
    const reviewCount = allReviews.length

    await db.nanny.update({
      where: { id: body.nannyId },
      data: {
        rating: avgRating,
        reviewCount,
      },
    })

    return NextResponse.json({ success: true, data: review }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create review'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
