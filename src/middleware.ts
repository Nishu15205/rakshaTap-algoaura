import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { COOKIE_NAME } from '@/lib/auth'

function generateRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'mumaa-super-secret-key-change-in-production-2024'
)

const AUTH_POST_ROUTES = ['/api/auth']

const PUBLIC_GET_ROUTES = [
  '/api/nannies',
  '/api/auth/me',
  '/api/payments/check',
  '/api/reviews',
  '/api/health',
]

function isPublicRoute(pathname: string, method: string): boolean {
  if (method === 'POST' && AUTH_POST_ROUTES.some(route => pathname.startsWith(route))) {
    return true
  }
  if (method === 'GET') {
    for (const route of PUBLIC_GET_ROUTES) {
      if (pathname === route || (route !== '/' && pathname.startsWith(route + '/'))) {
        return true
      }
    }
  }
  if (pathname.startsWith('/api/payments/check') && method === 'GET') {
    return true
  }
  return false
}

function addSecurityHeaders(response: NextResponse, requestId: string, responseTime: number): void {
  response.headers.set('X-Request-Id', requestId)
  response.headers.set('X-Response-Time', `${responseTime}ms`)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
}

async function verifyJwtInMiddleware(token: string): Promise<{ userId: string; email: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return {
      userId: (payload as Record<string, unknown>).userId as string,
      email: (payload as Record<string, unknown>).email as string,
      role: (payload as Record<string, unknown>).role as string,
    }
  } catch {
    return null
  }
}

export { addSecurityHeaders }

export default async function middleware(request: NextRequest) {
  const startTime = Date.now()
  const requestId = generateRequestId()
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/api/')) {
    const response = NextResponse.next()
    addSecurityHeaders(response, requestId, 0)
    return response
  }

  if (pathname === '/api/payments/webhook' && request.method === 'POST') {
    const response = NextResponse.next()
    addSecurityHeaders(response, requestId, Date.now() - startTime)
    return response
  }

  if (isPublicRoute(pathname, request.method)) {
    const response = NextResponse.next()
    addSecurityHeaders(response, requestId, Date.now() - startTime)
    return response
  }

  if (pathname === '/api/seed' && request.method === 'POST') {
    const token = request.cookies.get(COOKIE_NAME)?.value
    const secretKey = request.headers.get('x-seed-key')
    const expectedSecret = process.env.SEED_SECRET || 'mumaa-seed-2024'

    if (token) {
      const payload = await verifyJwtInMiddleware(token)
      if (payload) {
        const response = NextResponse.next()
        addSecurityHeaders(response, requestId, Date.now() - startTime)
        return response
      }
    }

    if (secretKey && secretKey === expectedSecret) {
      const response = NextResponse.next()
      addSecurityHeaders(response, requestId, Date.now() - startTime)
      return response
    }

    const response = NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
    addSecurityHeaders(response, requestId, Date.now() - startTime)
    return response
  }

  const token = request.cookies.get(COOKIE_NAME)?.value

  if (!token) {
    const response = NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    )
    addSecurityHeaders(response, requestId, Date.now() - startTime)
    return response
  }

  const payload = await verifyJwtInMiddleware(token)

  if (!payload) {
    const response = NextResponse.json(
      { success: false, error: 'Invalid or expired token' },
      { status: 401 }
    )
    addSecurityHeaders(response, requestId, Date.now() - startTime)
    return response
  }

  const response = NextResponse.next()
  response.headers.set('x-user-id', payload.userId)
  response.headers.set('x-user-role', payload.role)
  response.headers.set('x-user-email', payload.email)
  addSecurityHeaders(response, requestId, Date.now() - startTime)
  return response
}

export const config = {
  matcher: '/api/:path*',
}
