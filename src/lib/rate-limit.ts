import { NextRequest, NextResponse } from 'next/server'
import { logApiError } from '@/lib/logger'

// Simple in-memory rate limit store (per-function-instance in serverless)
const rateLimitStore = new Map<string, { count: number; lastReset: number }>()

// Lazily clean up expired entries on each check (no setInterval needed)
function cleanupExpired(): void {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.lastReset > 300_000) {
      rateLimitStore.delete(key)
    }
  }
}

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

function checkRateLimit(key: string, config: RateLimitConfig): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now - entry.lastReset > config.windowMs) {
    rateLimitStore.set(key, { count: 1, lastReset: now })
    cleanupExpired()
    return true
  }

  if (entry.count >= config.max) return false
  entry.count++
  return true
}

export function rateLimit(key: string, maxRequests = 10, windowMs = 60_000): boolean {
  return checkRateLimit(key, { windowMs, max: maxRequests })
}

export function createRateLimiter(preset: keyof typeof rateLimitConfigs) {
  const config = rateLimitConfigs[preset]
  return function (key: string): boolean {
    return checkRateLimit(`${preset}:${key}`, config)
  }
}

export const authRateLimit = (key: string) => checkRateLimit(`auth:${key}`, rateLimitConfigs.auth)
export const forgotPasswordRateLimit = (key: string) => checkRateLimit(`forgotPassword:${key}`, rateLimitConfigs.forgotPassword)
export const bookingRateLimit = (key: string) => checkRateLimit(`booking:${key}`, rateLimitConfigs.booking)
export const reviewRateLimit = (key: string) => checkRateLimit(`review:${key}`, rateLimitConfigs.review)
export const registrationRateLimit = (key: string) => checkRateLimit(`registration:${key}`, rateLimitConfigs.registration)
export const uploadRateLimit = (key: string) => checkRateLimit(`upload:${key}`, rateLimitConfigs.upload)
export const generalRateLimit = (key: string) => checkRateLimit(`general:${key}`, rateLimitConfigs.general)

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
      return NextResponse.json({ success: false, error: message }, { status: 429 })
    }
    return null
  }
}

export function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
}

export function checkRateLimitResponse(
  request: NextRequest,
  preset: keyof typeof rateLimitConfigs,
  errorMessage?: string
): NextResponse | null {
  const clientIp = getClientIp(request)
  const config = rateLimitConfigs[preset]

  if (!checkRateLimit(`${preset}:${clientIp}`, config)) {
    logApiError('RATE_LIMIT', request.nextUrl.pathname, `Rate limited: ${preset}`, undefined)
    return NextResponse.json(
      { success: false, error: errorMessage || `Too many requests. Please try again later.` },
      { status: 429 }
    )
  }
  return null
}
