import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, hashOTP, compareOTP } from '@/lib/auth'
import { sendOTPEmail, sendPasswordChangedEmail } from '@/lib/email'

// Simple in-memory rate limiter
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

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// POST /api/auth/forgot-password — Send OTP or Reset Password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'send' || !action) {
      return handleSendOTP(body)
    } else if (action === 'reset') {
      return handleResetPassword(body)
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action.' },
      { status: 400 }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Password reset failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

async function handleSendOTP(body: Record<string, unknown>) {
  const { email } = body
  const emailStr = String(email || '').toLowerCase().trim()

  if (!emailStr) {
    return NextResponse.json(
      { success: false, error: 'Email is required' },
      { status: 400 }
    )
  }

  // Rate limiting: max 3 OTP requests per email per 15 minutes
  if (isRateLimited(`otp:${emailStr}`, 3, 15 * 60 * 1000)) {
    return NextResponse.json(
      { success: false, error: 'Too many OTP requests. Please try again after 15 minutes.' },
      { status: 429 }
    )
  }

  const user = await db.user.findUnique({ where: { email: emailStr } })

  if (!user) {
    // Don't reveal if user exists or not — return generic message
    return NextResponse.json({
      success: true,
      message: 'If an account with this email exists, a verification code has been sent.',
    })
  }

  const otp = generateOTP()
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

  // Hash the OTP before storing (SEC-I09 fix)
  const hashedOTP = await hashOTP(otp)

  await db.user.update({
    where: { id: user.id },
    data: { otpCode: hashedOTP, otpExpiry },
  })

  await db.notification.create({
    data: {
      userId: user.id,
      title: 'Password Reset Code',
      message: 'A password reset code has been sent to your email. It expires in 5 minutes.',
      type: 'info',
    },
  })

  // Send real email (OTP NOT logged to console in production)
  const emailSent = await sendOTPEmail(user.email, otp, user.name)

  // Only log OTP in development, not production
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[OTP-DEV] Password reset code for ${emailStr}: ${otp}`)
  }

  return NextResponse.json({
    success: true,
    message: emailSent
      ? 'Verification code sent to your email.'
      : 'If an account with this email exists, a verification code has been sent.',
    // Only show OTP hint in development when email not configured
    ...(process.env.NODE_ENV !== 'production' && !emailSent ? { data: { hint: `Code is: ${otp}` } } : {}),
  })
}

async function handleResetPassword(body: Record<string, unknown>) {
  const { email, otp, newPassword } = body
  const emailStr = String(email || '').toLowerCase().trim()
  const otpStr = String(otp || '')
  const newPwStr = String(newPassword || '')

  if (!emailStr || !otpStr || !newPwStr) {
    return NextResponse.json(
      { success: false, error: 'Email, verification code, and new password are required' },
      { status: 400 }
    )
  }

  if (newPwStr.length < 8) {
    return NextResponse.json(
      { success: false, error: 'Password must be at least 8 characters long' },
      { status: 400 }
    )
  }

  // Rate limiting: max 5 reset attempts per email per 15 minutes
  if (isRateLimited(`reset:${emailStr}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json(
      { success: false, error: 'Too many reset attempts. Please try again later.' },
      { status: 429 }
    )
  }

  const user = await db.user.findUnique({ where: { email: emailStr } })

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Invalid email or verification code' },
      { status: 401 }
    )
  }

  if (!user.otpCode || !user.otpExpiry) {
    return NextResponse.json(
      { success: false, error: 'No active code found. Please request a new one.' },
      { status: 400 }
    )
  }

  if (new Date() > user.otpExpiry) {
    await db.user.update({
      where: { id: user.id },
      data: { otpCode: null, otpExpiry: null },
    })
    return NextResponse.json(
      { success: false, error: 'Code has expired. Please request a new one.' },
      { status: 400 }
    )
  }

  // Compare OTP using bcrypt (hashed OTP in database)
  const otpMatch = await compareOTP(otpStr, user.otpCode)
  if (!otpMatch) {
    return NextResponse.json(
      { success: false, error: 'Invalid verification code.' },
      { status: 401 }
    )
  }

  // Hash the new password before storing
  const hashedPassword = await hashPassword(newPwStr)

  await db.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      otpCode: null,
      otpExpiry: null,
    },
  })

  await db.notification.create({
    data: {
      userId: user.id,
      title: 'Password Updated',
      message: 'Your password has been successfully changed. You can now log in with your new password.',
      type: 'success',
    },
  })

  // Send password changed confirmation email
  sendPasswordChangedEmail(user.email, user.name).catch(() => {})

  return NextResponse.json({
    success: true,
    message: 'Password reset successfully. You can now log in.',
  })
}
