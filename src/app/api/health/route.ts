import { NextResponse } from 'next/server'
import { ensureDatabase } from '@/lib/ensure-db'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Auto-initialize database on Netlify (creates tables + seeds if needed)
    await ensureDatabase()

    // Check database connectivity
    const userCount = await db.user.count()

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      users: userCount,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Database connection failed'
    return NextResponse.json(
      { status: 'error', message },
      { status: 503 }
    )
  }
}
