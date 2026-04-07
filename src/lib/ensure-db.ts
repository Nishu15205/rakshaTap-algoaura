import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

let initialized = false

// Creates SQLite tables via raw SQL if they don't exist
// This is needed on Netlify because /tmp is empty on cold starts
async function createTables() {
  const tableCheck = await db.$queryRawUnsafe(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='User'"
  )

  if (Array.isArray(tableCheck) && tableCheck.length > 0) {
    return // Tables already exist
  }

  // Create all tables matching the Prisma schema
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "phone" TEXT,
      "role" TEXT NOT NULL DEFAULT 'parent',
      "password" TEXT NOT NULL,
      "avatar" TEXT NOT NULL DEFAULT '',
      "address" TEXT,
      "babyAge" TEXT,
      "emergencyContact" TEXT,
      "bio" TEXT,
      "experience" INTEGER,
      "specialty" TEXT,
      "certifications" TEXT,
      "pricePerMin" INTEGER,
      "languages" TEXT,
      "availability" TEXT NOT NULL DEFAULT 'available',
      "isOnline" BOOLEAN NOT NULL DEFAULT 0,
      "subscriptionPlan" TEXT,
      "subscriptionStatus" TEXT NOT NULL DEFAULT 'none',
      "trialStartDate" DATETIME,
      "razorpayCustomerId" TEXT,
      "otpCode" TEXT,
      "otpExpiry" DATETIME,
      "referralCode" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
    CREATE UNIQUE INDEX IF NOT EXISTS "User_referralCode_key" ON "User"("referralCode");
    CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
    CREATE INDEX IF NOT EXISTS "User_subscriptionStatus_idx" ON "User"("subscriptionStatus");

    CREATE TABLE IF NOT EXISTS "Nanny" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "specialty" TEXT NOT NULL,
      "experience" INTEGER NOT NULL,
      "rating" REAL NOT NULL DEFAULT 0,
      "reviewCount" INTEGER NOT NULL DEFAULT 0,
      "bio" TEXT NOT NULL,
      "avatar" TEXT NOT NULL,
      "availability" TEXT NOT NULL DEFAULT 'offline',
      "pricePerMin" INTEGER NOT NULL,
      "languages" TEXT NOT NULL,
      "isOnline" BOOLEAN NOT NULL DEFAULT 0,
      "isActive" BOOLEAN NOT NULL DEFAULT 1,
      "userId" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "Nanny_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "Nanny_userId_key" ON "Nanny"("userId");

    CREATE TABLE IF NOT EXISTS "Booking" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "nannyId" TEXT NOT NULL,
      "parentId" TEXT,
      "parentName" TEXT NOT NULL,
      "parentEmail" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "scheduledAt" DATETIME,
      "startedAt" DATETIME,
      "endedAt" DATETIME,
      "duration" INTEGER,
      "totalPrice" REAL,
      "notes" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "Booking_nannyId_fkey" FOREIGN KEY ("nannyId") REFERENCES "Nanny" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );
    CREATE INDEX IF NOT EXISTS "Booking_nannyId_idx" ON "Booking"("nannyId");
    CREATE INDEX IF NOT EXISTS "Booking_parentId_idx" ON "Booking"("parentId");
    CREATE INDEX IF NOT EXISTS "Booking_status_idx" ON "Booking"("status");

    CREATE TABLE IF NOT EXISTS "CallSession" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "bookingId" TEXT NOT NULL,
      "roomId" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'waiting',
      "recordingUrl" TEXT,
      "aiSummary" TEXT,
      "duration" INTEGER,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "CallSession_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "CallSession_bookingId_key" ON "CallSession"("bookingId");
    CREATE UNIQUE INDEX IF NOT EXISTS "CallSession_roomId_key" ON "CallSession"("roomId");

    CREATE TABLE IF NOT EXISTS "ChatMessage" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "sessionId" TEXT NOT NULL,
      "senderName" TEXT NOT NULL,
      "senderType" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CallSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );
    CREATE INDEX IF NOT EXISTS "ChatMessage_sessionId_idx" ON "ChatMessage"("sessionId");

    CREATE TABLE IF NOT EXISTS "Review" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "nannyId" TEXT NOT NULL,
      "parentName" TEXT NOT NULL,
      "rating" INTEGER NOT NULL,
      "comment" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Review_nannyId_fkey" FOREIGN KEY ("nannyId") REFERENCES "Nanny" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );
    CREATE INDEX IF NOT EXISTS "Review_nannyId_idx" ON "Review"("nannyId");

    CREATE TABLE IF NOT EXISTS "AdminSettings" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "notificationEmail" TEXT NOT NULL,
      "password" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "AdminSettings_notificationEmail_key" ON "AdminSettings"("notificationEmail");

    CREATE TABLE IF NOT EXISTS "Payment" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "amount" REAL NOT NULL,
      "currency" TEXT NOT NULL DEFAULT 'inr',
      "status" TEXT NOT NULL DEFAULT 'pending',
      "paymentMethod" TEXT NOT NULL DEFAULT 'razorpay',
      "razorpayPaymentId" TEXT,
      "razorpayOrderId" TEXT,
      "razorpaySignature" TEXT,
      "description" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );
    CREATE INDEX IF NOT EXISTS "Payment_userId_idx" ON "Payment"("userId");
    CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status");

    CREATE TABLE IF NOT EXISTS "Notification" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "type" TEXT NOT NULL DEFAULT 'info',
      "read" BOOLEAN NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");

    CREATE TABLE IF NOT EXISTS "NannyRegistration" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "fullName" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "phone" TEXT NOT NULL,
      "age" INTEGER,
      "city" TEXT,
      "experience" INTEGER,
      "specialty" TEXT,
      "languages" TEXT,
      "qualifications" TEXT,
      "certifications" TEXT,
      "resumeUrl" TEXT,
      "workExperience" TEXT,
      "about" TEXT,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "adminNotes" TEXT,
      "meetingDate" DATETIME,
      "meetingTime" TEXT,
      "meetingLink" TEXT,
      "approvedAt" DATETIME,
      "rejectedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "NannyRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "NannyRegistration_userId_key" ON "NannyRegistration"("userId");
    CREATE INDEX IF NOT EXISTS "NannyRegistration_status_idx" ON "NannyRegistration"("status");
    CREATE INDEX IF NOT EXISTS "NannyRegistration_email_idx" ON "NannyRegistration"("email");

    CREATE TABLE IF NOT EXISTS "ActivityLog" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "userName" TEXT NOT NULL,
      "role" TEXT NOT NULL,
      "action" TEXT NOT NULL,
      "details" TEXT,
      "ipAddress" TEXT,
      "userAgent" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS "ActivityLog_userId_idx" ON "ActivityLog"("userId");
    CREATE INDEX IF NOT EXISTS "ActivityLog_action_idx" ON "ActivityLog"("action");
    CREATE INDEX IF NOT EXISTS "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

    CREATE TABLE IF NOT EXISTS "Referral" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "referrerId" TEXT NOT NULL,
      "refereeId" TEXT NOT NULL,
      "refereeName" TEXT NOT NULL,
      "refereeEmail" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'completed',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "Referral_refereeId_key" ON "Referral"("refereeId");
    CREATE INDEX IF NOT EXISTS "Referral_referrerId_idx" ON "Referral"("referrerId");
    CREATE INDEX IF NOT EXISTS "Referral_refereeId_idx" ON "Referral"("refereeId");
  `)
}

async function seedData() {
  // Check if already seeded
  const count = await db.nanny.count()
  if (count > 0) return

  const now = Date.now()
  const day = 24 * 60 * 60 * 1000

  // Seed users
  const users = [
    { id: 'u1', name: 'Ritu Mehra', email: 'ritu.mehra@gmail.com', phone: '+91 98765 43210', role: 'parent', password: await hashPassword('Ritu@2025'), trialStartDate: new Date(now - 5 * day), subscriptionStatus: 'trial' },
    { id: 'u2', name: 'Priya Sharma', email: 'priya.sharma.childcare@gmail.com', phone: '+91 98765 43211', role: 'nanny', password: await hashPassword('Priya@2025') },
    { id: 'u3', name: 'MUMAA Admin', email: 'admin.mumaa@gmail.com', phone: '+91 98765 43212', role: 'admin', password: await hashPassword('Admin@2025') },
    { id: 'u_nanny_pending', name: 'Kavitha Nair', email: 'kavitha.nair@example.com', phone: '+91 98765 43210', role: 'nanny', password: await hashPassword('seed_pass') },
    { id: 'u_nanny_approved', name: 'Deepika Joshi', email: 'deepika.joshi@example.com', phone: '+91 87654 32109', role: 'nanny', password: await hashPassword('seed_pass') },
  ]

  for (const u of users) {
    await db.user.create({ data: u as any })
  }

  // Seed nannies
  const nannies = [
    { id: 'n1', name: 'Priya Sharma', specialty: 'Newborn Care', experience: 8, rating: 4.9, reviewCount: 127, bio: 'Certified newborn care specialist with 8 years of experience.', avatar: '/nannies/nanny1.png', availability: 'available', pricePerMin: 0, languages: 'Hindi, English', isOnline: true, isActive: true, userId: 'u2' },
    { id: 'n2', name: 'Anjali Gupta', specialty: 'Sleep Training', experience: 12, rating: 4.8, reviewCount: 95, bio: 'Pediatric sleep consultant helping families establish healthy sleep habits.', avatar: '/nannies/nanny2.png', availability: 'available', pricePerMin: 0, languages: 'Hindi, English, Marathi', isOnline: true, isActive: true },
    { id: 'n3', name: 'Sneha Patel', specialty: 'Lactation Consultant', experience: 6, rating: 4.9, reviewCount: 84, bio: 'IBCLC certified lactation consultant helping mothers with breastfeeding.', avatar: '/nannies/nanny3.png', availability: 'available', pricePerMin: 0, languages: 'Hindi, English, Gujarati', isOnline: false, isActive: true },
    { id: 'n4', name: 'Dr. Meera Iyer', specialty: 'Postpartum Care', experience: 15, rating: 5.0, reviewCount: 203, bio: 'Postpartum care specialist and Ayurvedic practitioner for new mothers.', avatar: '/nannies/nanny4.png', availability: 'available', pricePerMin: 0, languages: 'Hindi, English, Kannada, Tamil', isOnline: true, isActive: true },
    { id: 'n5', name: 'Roshni Kapoor', specialty: 'Toddler Nutrition', experience: 7, rating: 4.7, reviewCount: 62, bio: 'Child nutrition expert specializing in toddler meal planning.', avatar: '/nannies/nanny5.png', availability: 'available', pricePerMin: 0, languages: 'Hindi, English, Punjabi', isOnline: false, isActive: true },
    { id: 'n6', name: 'Neha Reddy', specialty: 'Child Development', experience: 10, rating: 4.8, reviewCount: 156, bio: 'Child psychologist and development specialist for milestone tracking.', avatar: '/nannies/nanny6.png', availability: 'available', pricePerMin: 0, languages: 'Hindi, English, Telugu', isOnline: false, isActive: true },
  ]

  for (const n of nannies) {
    await db.nanny.create({ data: n as any })
  }

  // Seed reviews
  const reviews = [
    { id: 'seed-r1', nannyId: 'n1', parentName: 'Ritu M.', rating: 5, comment: 'Priya was amazing! Helped us with breastfeeding and sleep routine.' },
    { id: 'seed-r2', nannyId: 'n1', parentName: 'Megha S.', rating: 5, comment: 'Very knowledgeable and patient. Highly recommend!' },
    { id: 'seed-r3', nannyId: 'n2', parentName: 'Sakshi T.', rating: 5, comment: 'Instant call feature was a lifesaver at 2 AM for baby colic.' },
    { id: 'seed-r4', nannyId: 'n4', parentName: 'Pooja K.', rating: 5, comment: "Dr. Meera's postpartum guidance helped me recover faster." },
    { id: 'seed-r5', nannyId: 'n6', parentName: 'Divya R.', rating: 5, comment: "Neha helped us understand our toddler's behavior perfectly." },
  ]

  for (const r of reviews) {
    await db.review.create({ data: r as any })
  }

  // Seed admin settings
  await db.adminSettings.create({
    data: { id: 'admin-settings-1', notificationEmail: 'admin.mumaa@gmail.com', password: 'admin123' },
  })

  // Seed bookings
  const bookings = [
    { id: 'seed-b1', nannyId: 'n1', parentId: 'u1', parentName: 'Ritu Mehra', parentEmail: 'ritu.mehra@gmail.com', type: 'instant', status: 'completed', startedAt: new Date(now - 2 * day), endedAt: new Date(now - 2 * day + 25 * 60000), duration: 25 },
    { id: 'seed-b2', nannyId: 'n1', parentId: 'u1', parentName: 'Anita Desai', parentEmail: 'anita@example.com', type: 'scheduled', status: 'completed', scheduledAt: new Date(now - day), startedAt: new Date(now - day), endedAt: new Date(now - day + 30 * 60000), duration: 30 },
    { id: 'seed-b3', nannyId: 'n1', parentId: 'u1', parentName: 'Kavita Singh', parentEmail: 'kavita@example.com', type: 'instant', status: 'confirmed', scheduledAt: new Date(now + 2 * day) },
    { id: 'seed-b4', nannyId: 'n1', parentId: 'u1', parentName: 'Megha Sharma', parentEmail: 'megha@example.com', type: 'scheduled', status: 'pending', scheduledAt: new Date(now + 5 * day) },
    { id: 'seed-b5', nannyId: 'n2', parentId: 'u1', parentName: 'Sakshi Tandon', parentEmail: 'sakshi@example.com', type: 'instant', status: 'completed', startedAt: new Date(now - 3 * day), endedAt: new Date(now - 3 * day + 35 * 60000), duration: 35 },
    { id: 'seed-b6', nannyId: 'n2', parentId: 'u1', parentName: 'Nisha Agarwal', parentEmail: 'nisha@example.com', type: 'scheduled', status: 'confirmed', scheduledAt: new Date(now + day) },
    { id: 'seed-b7', nannyId: 'n3', parentId: 'u1', parentName: 'Priti Joshi', parentEmail: 'priti@example.com', type: 'scheduled', status: 'completed', scheduledAt: new Date(now - 4 * day), startedAt: new Date(now - 4 * day), endedAt: new Date(now - 4 * day + 20 * 60000), duration: 20 },
    { id: 'seed-b8', nannyId: 'n3', parentId: 'u1', parentName: 'Swati Deshmukh', parentEmail: 'swati@example.com', type: 'instant', status: 'pending' },
    { id: 'seed-b9', nannyId: 'n4', parentId: 'u1', parentName: 'Pooja Krishnan', parentEmail: 'pooja@example.com', type: 'scheduled', status: 'completed', scheduledAt: new Date(now - 5 * day), startedAt: new Date(now - 5 * day), endedAt: new Date(now - 5 * day + 45 * 60000), duration: 45 },
    { id: 'seed-b10', nannyId: 'n4', parentId: 'u1', parentName: 'Aparna Menon', parentEmail: 'aparna@example.com', type: 'scheduled', status: 'confirmed', scheduledAt: new Date(now + 3 * day) },
  ]

  for (const b of bookings) {
    await db.booking.create({ data: b as any })
  }

  // Seed call sessions
  const sessions = [
    { id: 'call-s1', bookingId: 'seed-b1', roomId: 'room-b1', status: 'completed', duration: 25 },
    { id: 'call-s2', bookingId: 'seed-b2', roomId: 'room-b2', status: 'completed', duration: 30 },
    { id: 'call-s3', bookingId: 'seed-b3', roomId: 'room-b3', status: 'waiting' },
    { id: 'call-s5', bookingId: 'seed-b5', roomId: 'room-b5', status: 'completed', duration: 35 },
    { id: 'call-s6', bookingId: 'seed-b6', roomId: 'room-b6', status: 'waiting' },
    { id: 'call-s7', bookingId: 'seed-b7', roomId: 'room-b7', status: 'completed', duration: 20 },
    { id: 'call-s9', bookingId: 'seed-b9', roomId: 'room-b9', status: 'completed', duration: 45 },
    { id: 'call-s10', bookingId: 'seed-b10', roomId: 'room-b10', status: 'waiting' },
  ]

  for (const s of sessions) {
    await db.callSession.create({ data: s as any })
  }

  // Seed notifications
  const notifications = [
    { id: 'seed-not1', userId: 'u2', title: 'New Booking Request', message: 'Kavita Singh wants to schedule a call for tomorrow', type: 'info', read: false },
    { id: 'seed-not2', userId: 'u2', title: 'Payment Received', message: '₹450 received for call with Anita Desai', type: 'success', read: false },
    { id: 'seed-not3', userId: 'u2', title: 'Rating Update', message: 'You received a 5-star rating from Ritu Mehra', type: 'info', read: true },
    { id: 'seed-not4', userId: 'u2', title: 'Welcome to MUMAA!', message: 'Your expert profile is now live. Start accepting calls!', type: 'success', read: true },
  ]

  for (const n of notifications) {
    await db.notification.create({ data: n as any })
  }

  // Seed payments
  const payments = [
    { id: 'pay-seed-1', userId: 'u1', amount: 375, status: 'completed', description: 'Instant call with Priya Sharma (25 min)', createdAt: new Date(now - 2 * day) },
    { id: 'pay-seed-2', userId: 'u1', amount: 450, status: 'completed', description: 'Scheduled call with Priya Sharma (30 min)', createdAt: new Date(now - day) },
    { id: 'pay-seed-3', userId: 'u1', amount: 700, status: 'completed', description: 'Instant call with Anjali Gupta (35 min)', createdAt: new Date(now - 3 * day) },
    { id: 'pay-seed-4', userId: 'u1', amount: 500, status: 'completed', description: 'Scheduled call with Sneha Patel (20 min)', createdAt: new Date(now - 4 * day) },
    { id: 'pay-seed-5', userId: 'u1', amount: 1350, status: 'completed', description: 'Scheduled call with Dr. Meera Iyer (45 min)', createdAt: new Date(now - 5 * day) },
  ]

  for (const p of payments) {
    await db.payment.create({ data: p as any })
  }
}

// Call this at the start of every API route on Netlify
// Creates tables + seeds data if needed (idempotent, runs once per cold start)
export async function ensureDatabase(): Promise<void> {
  if (initialized) return

  try {
    await createTables()
    await seedData()
    initialized = true
  } catch (error) {
    // Log but don't crash — another invocation may have already initialized
    console.error('Database initialization error (may already be initialized):', error)
    initialized = true
  }
}
