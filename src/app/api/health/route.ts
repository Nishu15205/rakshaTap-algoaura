import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Check database connectivity
    await db.adminSettings.count()

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    })
  } catch {
    return NextResponse.json(
      { status: 'error', message: 'Database connection failed' },
      { status: 503 }
    )
  }
}
