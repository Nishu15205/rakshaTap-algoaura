import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const count = await db.nanny.count({ where: { isActive: true } })
    return NextResponse.json({ success: true, data: count })
  } catch {
    return NextResponse.json({ success: false, data: 0 })
  }
}
