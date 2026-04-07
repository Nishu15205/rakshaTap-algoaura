import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, comparePassword, generateToken, COOKIE_NAME, validatePasswordStrength } from '@/lib/auth'
import { sendWelcomeEmail } from '@/lib/email'

// Simple in-memory rate limiter (per email, per endpoint)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(key: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }
  if (entry.count >= maxAttempts) return true
  entry.count++
  return false
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) rateLimitMap.delete(key)
  }
}, 5 * 60 * 1000)

function sanitizeUser(user: Record<string, unknown>) {
  const { password, otpCode, otpExpiry, ...safeUser } = user
  return safeUser
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'login') {
      return handleLogin(body)
    } else if (action === 'signup') {
      return handleSignup(body)
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "login" or "signup".' },
      { status: 400 }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Authentication failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

async function handleLogin(body: Record<string, unknown>) {
  const { email, password } = body
  const emailStr = String(email || '').toLowerCase().trim()

  if (!emailStr || !password) {
    return NextResponse.json(
      { success: false, error: 'Email and password are required' },
      { status: 400 }
    )
  }

  // Rate limiting: max 10 login attempts per email per 15 minutes
  if (isRateLimited(`login:${emailStr}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json(
      { success: false, error: 'Too many login attempts. Please try again later.' },
      { status: 429 }
    )
  }

  const user = await db.user.findUnique({ where: { email: emailStr } })

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Invalid email or password' },
      { status: 401 }
    )
  }

  const isMatch = await comparePassword(String(password), user.password)
  if (!isMatch) {
    return NextResponse.json(
      { success: false, error: 'Invalid email or password' },
      { status: 401 }
    )
  }

  const token = await generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  })

  const isProduction = process.env.NODE_ENV === 'production'

  const response = NextResponse.json({
    success: true,
    data: sanitizeUser(user as unknown as Record<string, unknown>),
  })

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 86400,
    path: '/',
  })

  return response
}

async function handleSignup(body: Record<string, unknown>) {
  const { name, email, password, role, phone } = body

  const nameStr = name ? String(name).trim() : ''
  const emailStr = email ? String(email).toLowerCase().trim() : ''
  const passwordStr = password ? String(password) : ''

  if (nameStr.length < 2) {
    return NextResponse.json(
      { success: false, error: 'Name must be at least 2 characters' },
      { status: 400 }
    )
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(emailStr)) {
    return NextResponse.json(
      { success: false, error: 'Please enter a valid email address' },
      { status: 400 }
    )
  }

  // Password strength validation
  const pwCheck = validatePasswordStrength(passwordStr)
  if (!pwCheck.valid) {
    return NextResponse.json(
      { success: false, error: pwCheck.errors[0] },
      { status: 400 }
    )
  }

  // Rate limiting: max 5 signups per email per hour
  if (isRateLimited(`signup:${emailStr}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json(
      { success: false, error: 'Too many signup attempts. Please try again later.' },
      { status: 429 }
    )
  }

  // Check if email already exists
  const existingUser = await db.user.findUnique({ where: { email: emailStr } })
  if (existingUser) {
    return NextResponse.json(
      { success: false, error: 'An account already exists' },
      { status: 409 }
    )
  }

  // Hash password
  const hashedPassword = await hashPassword(passwordStr)

  // Create user
  const user = await db.user.create({
    data: {
      name: nameStr,
      email: emailStr,
      phone: phone ? String(phone) : undefined,
      password: hashedPassword,
      role: role ? String(role) : 'parent',
    },
  })

  // Create welcome notification
  await db.notification.create({
    data: {
      userId: user.id,
      title: 'Welcome to MUMAA! 🎉',
      message: `Hello ${user.name}, your account has been created successfully. Start exploring our expert consultants now!`,
      type: 'success',
    },
  })

  // Send welcome email (non-blocking)
  sendWelcomeEmail(user.email, user.name, user.role).catch(() => {})

  // Generate JWT and set cookie
  const token = await generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  })

  const isProduction = process.env.NODE_ENV === 'production'

  const response = NextResponse.json(
    { success: true, data: sanitizeUser(user as unknown as Record<string, unknown>) },
    { status: 201 }
  )

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 86400,
    path: '/',
  })

  return response
}
