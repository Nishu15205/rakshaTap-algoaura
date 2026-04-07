import { z } from 'zod'

// ─── Auth Schemas ────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['parent', 'nanny']).default('parent'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
})

// ─── Booking Schemas ─────────────────────────────────────────────────────────

export const createBookingSchema = z.object({
  nannyId: z.string().min(1, 'Nanny ID is required'),
  type: z.enum(['instant', 'scheduled'], { message: 'Type must be "instant" or "scheduled"' }),
  parentName: z.string().min(1, 'Parent name is required'),
  parentEmail: z.string().email('Invalid parent email'),
  scheduledAt: z.string().datetime({ message: 'Must be a valid ISO date' }).optional(),
  notes: z.string().optional(),
})

export const updateBookingSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']).optional(),
  notes: z.string().optional(),
})

// ─── Review Schemas ──────────────────────────────────────────────────────────

export const createReviewSchema = z.object({
  nannyId: z.string().min(1, 'Nanny ID is required'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  parentName: z.string().min(1, 'Parent name is required'),
  comment: z.string().optional(),
})

// ─── Nanny Registration Schema ───────────────────────────────────────────────

export const createNannyRegistrationSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  age: z.number().int().positive().optional(),
  city: z.string().optional(),
  experience: z.number().int().min(0).optional(),
  specialty: z.string().optional(),
  languages: z.string().optional(),
  qualifications: z.string().optional(),
  certifications: z.string().optional(),
  workExperience: z.string().optional(),
  about: z.string().max(500, 'About must be at most 500 characters').optional(),
})

// ─── Send Email Schema ───────────────────────────────────────────────────────

export const sendEmailSchema = z.object({
  to: z.union([z.string().email('Invalid email'), z.array(z.string().email('Invalid email'))]),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().optional(),
  type: z.enum([
    'registration_notification',
    'otp',
    'application_approved',
    'application_rejected',
    'meeting_scheduled',
    'payment_confirmation',
    'welcome',
    'password_reset',
    'general',
  ]).optional(),
})

// ─── Admin Settings Schema ───────────────────────────────────────────────────

export const updateAdminSettingsSchema = z.object({
  notificationEmail: z.string().email('Invalid email address').optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').optional(),
})

// ─── Referral Schema ─────────────────────────────────────────────────────────

export const referralSchema = z.object({
  code: z.string().min(1, 'Referral code is required'),
})

// ─── File Upload Constants ────────────────────────────────────────────────────

export const AVATAR_UPLOAD_CONFIG = {
  maxSizeBytes: 2 * 1024 * 1024, // 2MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const,
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
}

export const RESUME_UPLOAD_CONFIG = {
  maxSizeBytes: 5 * 1024 * 1024, // 5MB
  allowedTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ] as const,
  allowedExtensions: ['.pdf', '.doc', '.docx'],
}

// ─── Validation Helper ───────────────────────────────────────────────────────

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export function validateInput<T>(
  schema: z.ZodType<T>,
  body: unknown
): ValidationResult<T> {
  const result = schema.safeParse(body)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const firstError = result.error.issues[0]
  const message = firstError ? firstError.message : 'Invalid input'
  return { success: false, error: message }
}
