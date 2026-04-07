import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'mumaa-super-secret-key-change-in-production-2024')
const COOKIE_NAME = 'mumaa_token'
const DEFAULT_SECRET = 'mumaa-super-secret-key-change-in-production-2024'

// Check if JWT_SECRET is the default (insecure) value
export function isDefaultSecret(): boolean {
  const secret = process.env.JWT_SECRET
  return !secret || secret === DEFAULT_SECRET
}

// Validate critical environment variables at startup
export function validateEnvVars(): { valid: boolean; warnings: string[] } {
  const warnings: string[] = []

  if (isDefaultSecret()) {
    warnings.push('JWT_SECRET is using the default value. Change it in .env for production security.')
  }

  if (!process.env.DATABASE_URL) {
    warnings.push('DATABASE_URL is not set.')
  }

  if (!process.env.SMTP_EMAIL || process.env.SMTP_EMAIL === 'your-email@gmail.com') {
    warnings.push('SMTP credentials not configured. Emails will log to console only.')
  }

  if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    warnings.push('Razorpay keys not configured. Payment gateway is disabled.')
  }

  return { valid: warnings.length === 0, warnings }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Compare password
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Hash OTP code for secure storage
export async function hashOTP(otp: string): Promise<string> {
  return bcrypt.hash(otp, 4)
}

// Compare OTP code
export async function compareOTP(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash)
}

// Password strength validation
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (password.length < 8) errors.push('Password must be at least 8 characters')
  if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter')
  if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter')
  if (!/[0-9]/.test(password)) errors.push('Password must contain at least one number')
  return { valid: errors.length === 0, errors }
}

// Sanitize user-generated text (prevent XSS)
export function sanitizeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

// Generate access token (short-lived: 1 hour)
export async function generateAccessToken(payload: { userId: string; email: string; role: string }): Promise<string> {
  return new SignJWT({ ...payload, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(JWT_SECRET)
}

// Generate refresh token (long-lived: 7 days)
export async function generateRefreshToken(payload: { userId: string; email: string; role: string }): Promise<string> {
  return new SignJWT({ ...payload, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

// Verify access token — ensures the token is of type 'access'
export async function verifyAccessToken(token: string): Promise<{ userId: string; email: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const data = payload as unknown as { userId: string; email: string; role: string; type: string }
    if (data.type !== 'access') return null
    return { userId: data.userId, email: data.email, role: data.role }
  } catch {
    return null
  }
}

// Verify refresh token — ensures the token is of type 'refresh'
export async function verifyRefreshToken(token: string): Promise<{ userId: string; email: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const data = payload as unknown as { userId: string; email: string; role: string; type: string }
    if (data.type !== 'refresh') return null
    return { userId: data.userId, email: data.email, role: data.role }
  } catch {
    return null
  }
}

// Generate JWT token (backward-compatible alias for generateAccessToken)
// Expires in 1 hour for security
export async function generateToken(payload: { userId: string; email: string; role: string }): Promise<string> {
  return generateAccessToken(payload)
}

// Verify JWT token (backward-compatible — accepts both access and refresh)
export async function verifyToken(token: string): Promise<{ userId: string; email: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as { userId: string; email: string; role: string }
  } catch {
    return null
  }
}

// Server-side helper to get authenticated user from cookies
// Use this in API route handlers
export async function getAuthUser(_request?: NextRequest): Promise<{ userId: string; email: string; role: string } | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null
    return await verifyToken(token)
  } catch {
    return null
  }
}

export { COOKIE_NAME }
