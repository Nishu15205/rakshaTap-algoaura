import { NextRequest, NextResponse } from 'next/server'
import { logApiError } from '@/lib/logger'

// ─── In-memory rate limit store ──────────────────────────────────────────────

const rateLimitStore = new Map<string, { count: number; lastReset: number }>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.lastReset > 300_000) {
      rateLimitStore.delete(key)
    }
  }
}, 300_000)

// ─── Config presets ──────────────────────────────────────────────────────────

interface RateLimitConfig {
  windowMs: number
  max: number
}

const rateLimitConfigs: Record<string, RateLimitConfig> = {
  auth: { windowMs: 60_000, max: 10 },
  forgotPassword: { windowMs: 300_000, max: 3 },
  booking: { windowMs: 60_000, max: 5 },
  review: { windowMs: 60_000, max: 3 },
  registration: { windowMs: 60_000, max: 2 },
  upload: { windowMs: 60_000, max: 10 },
  general: { windowMs: 60_000, max: 30 },
}

// ─── Core rate limit check ───────────────────────────────────────────────────

function checkRateLimit(key: string, config: RateLimitConfig): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now - entry.lastReset > config.windowMs) {
    rateLimitStore.set(key, { count: 1, lastReset: now })
    return true // allowed
  }

  if (entry.count >= config.max) {
    return false // rate limited
  }

  entry.count++
  return true // allowed
}

// ─── Backward-compatible function ────────────────────────────────────────────

export function rateLimit(key: string, maxRequests = 10, windowMs = 60_000): boolean {
  return checkRateLimit(key, { windowMs, max: maxRequests })
}

// ─── Named rate limiters for each preset ─────────────────────────────────────

const DEFAULT_WINDOW_MS = 60_000
const DEFAULT_MAX = 30

export function createRateLimiter(preset: keyof typeof rateLimitConfigs) {
  const config = rateLimitConfigs[preset]
  return function (key: string): boolean {
    return checkRateLimit(`${preset}:${key}`, config)
  }
}

// Pre-built rate limiters for common use cases
export const authRateLimit = (key: string) => checkRateLimit(`auth:${key}`, rateLimitConfigs.auth)
export const forgotPasswordRateLimit = (key: string) => checkRateLimit(`forgotPassword:${key}`, rateLimitConfigs.forgotPassword)
export const bookingRateLimit = (key: string) => checkRateLimit(`booking:${key}`, rateLimitConfigs.booking)
export const reviewRateLimit = (key: string) => checkRateLimit(`review:${key}`, rateLimitConfigs.review)
export const registrationRateLimit = (key: string) => checkRateLimit(`registration:${key}`, rateLimitConfigs.registration)
export const uploadRateLimit = (key: string) => checkRateLimit(`upload:${key}`, rateLimitConfigs.upload)
export const generalRateLimit = (key: string) => checkRateLimit(`general:${key}`, rateLimitConfigs.general)

// ─── Middleware factory ──────────────────────────────────────────────────────

export function createRateLimitMiddleware(
  preset: keyof typeof rateLimitConfigs,
  options?: { keyPrefix?: string; errorMessage?: string }
) {
  const config = rateLimitConfigs[preset]
  const prefix = options?.keyPrefix || preset
  const message = options?.errorMessage || `Too many requests. Please try again later.`

  return function rateLimitMiddleware(request: NextRequest) {
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const key = `${prefix}:${clientIp}`

    if (!checkRateLimit(key, config)) {
      return NextResponse.json(
        { success: false, error: message },
        { status: 429 }
      )
    }

    return null // allowed
  }
}

// ─── Helper: get client IP ───────────────────────────────────────────────────

export function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
}

// ─── Helper: check rate limit and return error response ─────────────────────

export function checkRateLimitResponse(
  request: NextRequest,
  preset: keyof typeof rateLimitConfigs,
  errorMessage?: string
): NextResponse | null {
  const clientIp = getClientIp(request)
  const config = rateLimitConfigs[preset]

  if (!checkRateLimit(`${preset}:${clientIp}`, config)) {
    logApiError(
      'RATE_LIMIT',
      request.nextUrl.pathname,
      `Rate limited: ${preset}`,
      undefined
    )
    return NextResponse.json(
      { success: false, error: errorMessage || `Too many requests. Please try again later.` },
      { status: 429 }
    )
  }

  return null
}
