import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { COOKIE_NAME } from '@/lib/auth'

// Generate a simple unique request ID without Node.js crypto (Edge Runtime compatible)
function generateRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`
}

// JWT secret for middleware verification (Edge Runtime compatible)
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'mumaa-super-secret-key-change-in-production-2024'
)

// Routes that allow unauthenticated POST (auth endpoints)
const AUTH_POST_ROUTES = ['/api/auth']

// Routes that allow unauthenticated GET (public data)
const PUBLIC_GET_ROUTES = [
  '/api/nannies',
  '/api/auth/me',
  '/api/payments/check',
  '/api/reviews',
  '/api/health',
]

function isPublicRoute(pathname: string, method: string): boolean {
  // Auth POST routes (login, signup, forgot-password)
  if (method === 'POST' && AUTH_POST_ROUTES.some(route => pathname.startsWith(route))) {
    return true
  }

  // Public GET routes (exact match or prefix with ID)
  if (method === 'GET') {
    for (const route of PUBLIC_GET_ROUTES) {
      if (pathname === route || (route !== '/' && pathname.startsWith(route + '/'))) {
        return true
      }
    }
  }

  // Payment gateway check
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
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  response.headers.set('Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' ws: wss: https://checkout.razorpay.com; frame-src https://checkout.razorpay.com;"
  )
}

// Verify JWT token in Edge Runtime (using jose library)
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

export default async function middleware(request: NextRequest) {
  const startTime = Date.now()
  const requestId = generateRequestId()
  const { pathname } = request.nextUrl

  // Allow all non-API routes (pages, static files, Next.js internals, etc.)
  if (!pathname.startsWith('/api/')) {
    const response = NextResponse.next()
    addSecurityHeaders(response, requestId, 0)
    return response
  }

  // Allow webhook endpoint (Razorpay authenticates via signature, not JWT)
  if (pathname === '/api/payments/webhook' && request.method === 'POST') {
    const response = NextResponse.next()
    const elapsed = Date.now() - startTime
    addSecurityHeaders(response, requestId, elapsed)
    return response
  }

  // Check public routes
  if (isPublicRoute(pathname, request.method)) {
    const response = NextResponse.next()
    const elapsed = Date.now() - startTime
    addSecurityHeaders(response, requestId, elapsed)
    return response
  }

  // Protect seed endpoint — require valid JWT or strong secret key
  if (pathname === '/api/seed' && request.method === 'POST') {
    const token = request.cookies.get(COOKIE_NAME)?.value
    const secretKey = request.headers.get('x-seed-key')
    const expectedSecret = process.env.SEED_SECRET || 'mumaa-seed-2024'

    // If token present, verify it
    if (token) {
      const payload = await verifyJwtInMiddleware(token)
      if (payload) {
        const response = NextResponse.next()
        addSecurityHeaders(response, requestId, Date.now() - startTime)
        return response
      }
    }

    // If seed secret provided and matches
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

  // For all other API routes: VERIFY JWT (not just check it exists)
  const token = request.cookies.get(COOKIE_NAME)?.value

  if (!token) {
    const response = NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    )
    addSecurityHeaders(response, requestId, Date.now() - startTime)
    return response
  }

  // CRITICAL: Actually verify the JWT token signature and expiry
  const payload = await verifyJwtInMiddleware(token)

  if (!payload) {
    const response = NextResponse.json(
      { success: false, error: 'Invalid or expired token' },
      { status: 401 }
    )
    addSecurityHeaders(response, requestId, Date.now() - startTime)
    return response
  }

  // Token is valid — forward request with user info in headers for downstream use
  const response = NextResponse.next()
  response.headers.set('x-user-id', payload.userId)
  response.headers.set('x-user-role', payload.role)
  response.headers.set('x-user-email', payload.email)
  const elapsed = Date.now() - startTime
  addSecurityHeaders(response, requestId, elapsed)
  return response
}

export const config = {
  matcher: '/api/:path*',
}
