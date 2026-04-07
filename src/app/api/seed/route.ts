import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

const sampleNannies = [
  {
    id: 'n1',
    name: 'Priya Sharma',
    specialty: 'Newborn Care',
    experience: 8,
    rating: 4.9,
    reviewCount: 127,
    bio: 'Certified newborn care specialist with 8 years of experience.',
    avatar: '/nannies/nanny1.png',
    availability: 'available',
    pricePerMin: 0,
    languages: 'Hindi, English',
    isOnline: true,
    isActive: true,
    userId: 'u2',
  },
  {
    id: 'n2',
    name: 'Anjali Gupta',
    specialty: 'Sleep Training',
    experience: 12,
    rating: 4.8,
    reviewCount: 95,
    bio: 'Pediatric sleep consultant helping families establish healthy sleep habits.',
    avatar: '/nannies/nanny2.png',
    availability: 'available',
    pricePerMin: 0,
    languages: 'Hindi, English, Marathi',
    isOnline: true,
    isActive: true,
  },
  {
    id: 'n3',
    name: 'Sneha Patel',
    specialty: 'Lactation Consultant',
    experience: 6,
    rating: 4.9,
    reviewCount: 84,
    bio: 'IBCLC certified lactation consultant helping mothers with breastfeeding.',
    avatar: '/nannies/nanny3.png',
    availability: 'available',
    pricePerMin: 0,
    languages: 'Hindi, English, Gujarati',
    isOnline: false,
    isActive: true,
  },
  {
    id: 'n4',
    name: 'Dr. Meera Iyer',
    specialty: 'Postpartum Care',
    experience: 15,
    rating: 5.0,
    reviewCount: 203,
    bio: 'Postpartum care specialist and Ayurvedic practitioner for new mothers.',
    avatar: '/nannies/nanny4.png',
    availability: 'available',
    pricePerMin: 0,
    languages: 'Hindi, English, Kannada, Tamil',
    isOnline: true,
    isActive: true,
  },
  {
    id: 'n5',
    name: 'Roshni Kapoor',
    specialty: 'Toddler Nutrition',
    experience: 7,
    rating: 4.7,
    reviewCount: 62,
    bio: 'Child nutrition expert specializing in toddler meal planning.',
    avatar: '/nannies/nanny5.png',
    availability: 'available',
    pricePerMin: 0,
    languages: 'Hindi, English, Punjabi',
    isOnline: false,
    isActive: true,
  },
  {
    id: 'n6',
    name: 'Neha Reddy',
    specialty: 'Child Development',
    experience: 10,
    rating: 4.8,
    reviewCount: 156,
    bio: 'Child psychologist and development specialist for milestone tracking.',
    avatar: '/nannies/nanny6.png',
    availability: 'available',
    pricePerMin: 0,
    languages: 'Hindi, English, Telugu',
    isOnline: false,
    isActive: true,
  },
]

const sampleReviews = [
  { nannyId: 'n1', parentName: 'Ritu M.', rating: 5, comment: 'Priya was amazing! Helped us with breastfeeding and sleep routine.' },
  { nannyId: 'n1', parentName: 'Megha S.', rating: 5, comment: 'Very knowledgeable and patient. Highly recommend!' },
  { nannyId: 'n2', parentName: 'Sakshi T.', rating: 5, comment: 'Instant call feature was a lifesaver at 2 AM for baby colic.' },
  { nannyId: 'n4', parentName: 'Pooja K.', rating: 5, comment: "Dr. Meera's postpartum guidance helped me recover faster." },
  { nannyId: 'n6', parentName: 'Divya R.', rating: 5, comment: "Neha helped us understand our toddler's behavior perfectly." },
]

// Seed users (sample accounts with plain text passwords that will be hashed)
const seedUsers = [
  { id: 'u1', name: 'Ritu Mehra', email: 'ritu.mehra@gmail.com', phone: '+91 98765 43210', role: 'parent', password: 'Ritu@2025', trialStartDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), subscriptionStatus: 'trial' },
  { id: 'u2', name: 'Priya Sharma', email: 'priya.sharma.childcare@gmail.com', phone: '+91 98765 43211', role: 'nanny', password: 'Priya@2025' },
  { id: 'u3', name: 'MUMAA Admin', email: 'admin.mumaa@gmail.com', phone: '+91 98765 43212', role: 'admin', password: 'Admin@2025' },
]

export async function POST() {
  try {
    // 1. Seed Admin Settings
    await db.adminSettings.upsert({
      where: { id: 'admin-settings-1' },
      update: {},
      create: {
        id: 'admin-settings-1',
        notificationEmail: 'admin.mumaa@gmail.com',
        password: 'admin123',
      },
    })

    // 2. Seed sample users with bcrypt-hashed passwords
    for (const user of seedUsers) {
      const hashedPassword = await hashPassword(user.password)
      await db.user.upsert({
        where: { id: user.id },
        update: {
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          password: hashedPassword,
          trialStartDate: (user as Record<string, unknown>).trialStartDate as string | undefined,
          subscriptionStatus: (user as Record<string, unknown>).subscriptionStatus as string | undefined,
        },
        create: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          password: hashedPassword,
          trialStartDate: (user as Record<string, unknown>).trialStartDate as string | undefined,
          subscriptionStatus: (user as Record<string, unknown>).subscriptionStatus as string | undefined,
        },
      })
    }

    // 3. Seed nannies
    for (const nanny of sampleNannies) {
      await db.nanny.upsert({
        where: { id: nanny.id },
        update: {
          name: nanny.name,
          specialty: nanny.specialty,
          experience: nanny.experience,
          rating: nanny.rating,
          reviewCount: nanny.reviewCount,
          bio: nanny.bio,
          avatar: nanny.avatar,
          availability: nanny.availability,
          pricePerMin: nanny.pricePerMin,
          languages: nanny.languages,
          isOnline: nanny.isOnline,
          isActive: nanny.isActive,
          userId: nanny.userId || undefined,
        },
        create: nanny,
      })
    }

    // 4. Seed reviews
    for (let i = 0; i < sampleReviews.length; i++) {
      const review = sampleReviews[i]
      const reviewId = `seed-r${i + 1}`
      await db.review.upsert({
        where: { id: reviewId },
        update: {
          nannyId: review.nannyId,
          parentName: review.parentName,
          rating: review.rating,
          comment: review.comment,
        },
        create: {
          id: reviewId,
          nannyId: review.nannyId,
          parentName: review.parentName,
          rating: review.rating,
          comment: review.comment,
        },
      })
    }

    // 5. Seed sample registration users and registrations
    const pendingUserId = 'u_nanny_pending'
    const approvedUserId = 'u_nanny_approved'
    const regUserPassword = await hashPassword('seed_pass')

    await db.user.upsert({
      where: { id: pendingUserId },
      update: { name: 'Kavitha Nair', email: 'kavitha.nair@example.com', phone: '+91 98765 43210', role: 'nanny', password: regUserPassword },
      create: { id: pendingUserId, name: 'Kavitha Nair', email: 'kavitha.nair@example.com', phone: '+91 98765 43210', role: 'nanny', password: regUserPassword },
    })

    await db.user.upsert({
      where: { id: approvedUserId },
      update: { name: 'Deepika Joshi', email: 'deepika.joshi@example.com', phone: '+91 87654 32109', role: 'nanny', password: regUserPassword },
      create: { id: approvedUserId, name: 'Deepika Joshi', email: 'deepika.joshi@example.com', phone: '+91 87654 32109', role: 'nanny', password: regUserPassword },
    })

    // 6. Seed nanny registrations with new fields (qualifications, resumeUrl, workExperience)
    await db.nannyRegistration.upsert({
      where: { id: 'reg-pending-1' },
      update: {},
      create: {
        id: 'reg-pending-1',
        userId: pendingUserId,
        fullName: 'Kavitha Nair',
        email: 'kavitha.nair@example.com',
        phone: '+91 98765 43210',
        age: 32,
        city: 'Kochi',
        experience: 5,
        specialty: 'Postpartum Care',
        languages: 'Hindi, English, Malayalam',
        qualifications: 'B.Sc Nursing, Certified Postpartum Doula',
        resumeUrl: '/resumes/kavitha-nair.pdf',
        workExperience: '5 years at Fortis Hospital Kochi as a maternity nurse. Specialized in Ayurvedic postpartum recovery.',
        about: 'Experienced postpartum caregiver specializing in Ayurvedic recovery practices.',
        status: 'pending',
      },
    })

    await db.nannyRegistration.upsert({
      where: { id: 'reg-approved-1' },
      update: {},
      create: {
        id: 'reg-approved-1',
        userId: approvedUserId,
        fullName: 'Deepika Joshi',
        email: 'deepika.joshi@example.com',
        phone: '+91 87654 32109',
        age: 28,
        city: 'Pune',
        experience: 4,
        specialty: 'Lactation Consultant',
        languages: 'Hindi, English, Marathi',
        qualifications: 'IBCLC Certified, B.Sc in Child Development',
        resumeUrl: '/resumes/deepika-joshi.pdf',
        workExperience: '4 years as a lactation consultant at various hospitals in Pune. Conducted over 500 consultations.',
        about: 'Certified lactation consultant helping new mothers with breastfeeding challenges.',
        status: 'approved',
        approvedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        adminNotes: 'Excellent credentials. Approved immediately.',
      },
    })

    // 7. Seed sample bookings for multiple nannies
    const now = Date.now()
    const day = 24 * 60 * 60 * 1000

    const sampleBookings = [
      // n1 (Priya Sharma) - 4 bookings
      {
        id: 'seed-b1', nannyId: 'n1', parentId: 'u1', parentName: 'Ritu Mehra', parentEmail: 'ritu.mehra@gmail.com',
        type: 'instant', status: 'completed',
        startedAt: new Date(now - 2 * day), endedAt: new Date(now - 2 * day + 25 * 60 * 1000),
        duration: 25, totalPrice: null, notes: 'Breastfeeding help',
      },
      {
        id: 'seed-b2', nannyId: 'n1', parentId: 'u1', parentName: 'Anita Desai', parentEmail: 'anita@example.com',
        type: 'scheduled', status: 'completed',
        scheduledAt: new Date(now - 1 * day), startedAt: new Date(now - 1 * day), endedAt: new Date(now - 1 * day + 30 * 60 * 1000),
        duration: 30, totalPrice: null, notes: 'Sleep training query',
      },
      {
        id: 'seed-b3', nannyId: 'n1', parentId: 'u1', parentName: 'Kavita Singh', parentEmail: 'kavita@example.com',
        type: 'instant', status: 'confirmed',
        scheduledAt: new Date(now + 2 * day), notes: 'Newborn care consultation',
      },
      {
        id: 'seed-b4', nannyId: 'n1', parentId: 'u1', parentName: 'Megha Sharma', parentEmail: 'megha@example.com',
        type: 'scheduled', status: 'pending',
        scheduledAt: new Date(now + 5 * day), notes: 'Baby massage techniques',
      },

      // n2 (Anjali Gupta) - 2 bookings
      {
        id: 'seed-b5', nannyId: 'n2', parentId: 'u1', parentName: 'Sakshi Tandon', parentEmail: 'sakshi@example.com',
        type: 'instant', status: 'completed',
        startedAt: new Date(now - 3 * day), endedAt: new Date(now - 3 * day + 35 * 60 * 1000),
        duration: 35, totalPrice: null, notes: 'Baby not sleeping through the night',
      },
      {
        id: 'seed-b6', nannyId: 'n2', parentId: 'u1', parentName: 'Nisha Agarwal', parentEmail: 'nisha@example.com',
        type: 'scheduled', status: 'confirmed',
        scheduledAt: new Date(now + 1 * day), notes: 'Nap transition consultation',
      },

      // n3 (Sneha Patel) - 2 bookings
      {
        id: 'seed-b7', nannyId: 'n3', parentId: 'u1', parentName: 'Priti Joshi', parentEmail: 'priti@example.com',
        type: 'scheduled', status: 'completed',
        scheduledAt: new Date(now - 4 * day), startedAt: new Date(now - 4 * day), endedAt: new Date(now - 4 * day + 20 * 60 * 1000),
        duration: 20, totalPrice: null, notes: 'Latching difficulties',
      },
      {
        id: 'seed-b8', nannyId: 'n3', parentId: 'u1', parentName: 'Swati Deshmukh', parentEmail: 'swati@example.com',
        type: 'instant', status: 'pending',
        notes: 'Milk supply concerns',
      },

      // n4 (Dr. Meera Iyer) - 2 bookings
      {
        id: 'seed-b9', nannyId: 'n4', parentId: 'u1', parentName: 'Pooja Krishnan', parentEmail: 'pooja@example.com',
        type: 'scheduled', status: 'completed',
        scheduledAt: new Date(now - 5 * day), startedAt: new Date(now - 5 * day), endedAt: new Date(now - 5 * day + 45 * 60 * 1000),
        duration: 45, totalPrice: null, notes: 'Postpartum recovery plan',
      },
      {
        id: 'seed-b10', nannyId: 'n4', parentId: 'u1', parentName: 'Aparna Menon', parentEmail: 'aparna@example.com',
        type: 'scheduled', status: 'confirmed',
        scheduledAt: new Date(now + 3 * day), notes: 'Ayurvedic postpartum diet',
      },
    ]

    for (const booking of sampleBookings) {
      await db.booking.upsert({
        where: { id: booking.id },
        update: {},
        create: booking,
      })
    }

    // 8. Seed CallSessions for all bookings (completed + upcoming)
    const callSessions = [
      // Completed calls (seed-b1, seed-b2) - with AI summaries
      {
        id: 'call-s1', bookingId: 'seed-b1', roomId: 'room-b1', status: 'completed',
        duration: 25,
        aiSummary: `## Session Overview\nA 25-minute instant consultation with Ritu Mehra regarding newborn breastfeeding challenges.\n\n## Key Discussion Points\n- Baby (3 weeks old) having difficulty latching during night feeds\n- Mother experiencing nipple soreness and fatigue\n- Baby weight gain was slightly below expected curve\n\n## Expert Recommendations\n- Try the \"laid-back breastfeeding\" position for better latch\n- Apply lanolin cream between feeds for soreness\n- Feed every 2-3 hours during the day to build supply\n- Consider using a breast pump for 5 minutes before latching to stimulate letdown\n\n## Follow-up Actions\n- Monitor baby wet diapers (minimum 6 per day)\n- Schedule follow-up in 1 week if latching doesn't improve\n- Track feeding times using a baby app\n\n## Next Steps\n- Follow-up call scheduled if needed\n- Referred to lactation specialist if issues persist beyond 2 weeks`,
      },
      {
        id: 'call-s2', bookingId: 'seed-b2', roomId: 'room-b2', status: 'completed',
        duration: 30,
        aiSummary: `## Session Overview\nA 30-minute scheduled consultation with Anita Desai about establishing a sleep routine for her 4-month-old baby.\n\n## Key Discussion Points\n- Baby waking up 4-5 times per night\n- No consistent bedtime routine in place\n- Baby takes short naps (20-30 minutes) during the day\n- Parents are exhausted and seeking guidance\n\n## Expert Recommendations\n- Implement the \"Bath-Book-Bed\" routine starting at 7:30 PM\n- Use white noise machine in baby's room\n- Practice \"drowsy but awake\" placement method\n- Extend wake windows gradually: 1.5h → 2h → 2.25h\n- Avoid nursing to sleep; use pacifier instead\n\n## Follow-up Actions\n- Track sleep patterns for 1 week using a sleep log\n- Gradually reduce night feedings (one per week)\n- Room temperature should be 22-24°C with dim lighting\n\n## Next Steps\n- Follow-up call in 10 days to assess progress\n- Recommended book: \"The No-Cry Sleep Solution\"`,
      },

      // Upcoming confirmed calls (seed-b3, seed-b6, seed-b10) - waiting status
      { id: 'call-s3', bookingId: 'seed-b3', roomId: 'room-b3', status: 'waiting' },
      { id: 'call-s6', bookingId: 'seed-b6', roomId: 'room-b6', status: 'waiting' },
      { id: 'call-s10', bookingId: 'seed-b10', roomId: 'room-b10', status: 'waiting' },

      // Other completed calls (seed-b5, seed-b7, seed-b9)
      {
        id: 'call-s5', bookingId: 'seed-b5', roomId: 'room-b5', status: 'completed',
        duration: 35,
        aiSummary: `## Session Overview\nA 35-minute instant call with Sakshi Tandon about her 8-month-old baby's sleep regression.\n\n## Key Discussion Points\n- Baby stopped sleeping through the night after learning to crawl\n- Frequent night wakings (every 1-2 hours)\n- Separation anxiety evident during bedtime\n- Daytime naps reduced to one 45-minute nap\n\n## Expert Recommendations\n- Maintain consistent bedtime routine despite regression\n- Use a lovey/comfort object for security\n- Practice brief \"check and console\" method (wait 5 min before checking)\n- Ensure baby gets plenty of floor time during the day\n\n## Next Steps\n- Sleep regression typically lasts 2-6 weeks\n- Follow-up if issues persist beyond 6 weeks`,
      },
      {
        id: 'call-s7', bookingId: 'seed-b7', roomId: 'room-b7', status: 'completed',
        duration: 20,
        aiSummary: `## Session Overview\nA 20-minute scheduled call with Priti Joshi regarding latching difficulties with her newborn.\n\n## Key Discussion Points\n- Shallow latch causing pain during breastfeeding\n- Baby (2 weeks old) seems frustrated at the breast\n- Mother considering switching to formula\n\n## Expert Recommendations\n- Try the \"cross-cradle\" hold for better control\n- Express a few drops of milk before latching to encourage baby\n- Check for tongue-tie signs (consult pediatrician)\n- Skin-to-skin contact before feeds can help\n\n## Next Steps\n- Pediatrician visit for tongue-tie assessment\n- Follow-up in 3 days`,
      },
      {
        id: 'call-s9', bookingId: 'seed-b9', roomId: 'room-b9', status: 'completed',
        duration: 45,
        aiSummary: `## Session Overview\nA 45-minute comprehensive postpartum recovery consultation with Pooja Krishnan (6 weeks postpartum).\n\n## Key Discussion Points\n- Persistent back pain and fatigue\n- Difficulty with emotional well-being\n- Questions about diet and nutrition\n- Interested in Ayurvedic recovery practices\n\n## Expert Recommendations\n- Warm oil massage (Abhyanga) with sesame oil daily\n- Include iron-rich foods: dates, beetroot, spinach\n- Practice gentle pelvic floor exercises\n- Rest when baby sleeps — prioritize maternal recovery\n- Drink warm turmeric milk before bedtime\n\n## Next Steps\n- 2-week follow-up to monitor progress\n- Referred to physiotherapist for persistent back pain`,
      },
    ]

    for (const session of callSessions) {
      await db.callSession.upsert({
        where: { id: session.id },
        update: {},
        create: session,
      })
    }

    // 9. Seed ChatMessages for completed calls (seed-b1, seed-b2) — 4 messages each
    const chatMessages: Array<{ id: string; sessionId: string; senderName: string; senderType: string; content: string }> = [
      // Call seed-b1 (Breastfeeding help)
      {
        id: 'msg-b1-1', sessionId: 'call-s1', senderName: 'Ritu Mehra', senderType: 'parent',
        content: 'Hi Priya, my baby is 3 weeks old and having trouble latching especially at night. Any advice?',
      },
      {
        id: 'msg-b1-2', sessionId: 'call-s1', senderName: 'Priya Sharma', senderType: 'nanny',
        content: 'Hello Ritu! Night-time latching issues are very common. Can you tell me if the baby opens their mouth wide enough?',
      },
      {
        id: 'msg-b1-3', sessionId: 'call-s1', senderName: 'Ritu Mehra', senderType: 'parent',
        content: 'Not really, she tends to just nibble at the nipple. It\'s quite painful for me.',
      },
      {
        id: 'msg-b1-4', sessionId: 'call-s1', senderName: 'Priya Sharma', senderType: 'nanny',
        content: 'That sounds like a shallow latch. Try the "laid-back" position — lean back with baby on your chest tummy-down. This uses gravity to help. Also apply lanolin cream between feeds. Let\'s try it on camera.',
      },

      // Call seed-b2 (Sleep training query)
      {
        id: 'msg-b2-1', sessionId: 'call-s2', senderName: 'Anita Desai', senderType: 'parent',
        content: 'Hi Priya, my 4-month-old wakes up 4-5 times every night. We\'re all exhausted. Help!',
      },
      {
        id: 'msg-b2-2', sessionId: 'call-s2', senderName: 'Priya Sharma', senderType: 'nanny',
        content: 'Hi Anita! At 4 months, sleep regression is very common. Do you have a consistent bedtime routine?',
      },
      {
        id: 'msg-b2-3', sessionId: 'call-s2', senderName: 'Anita Desai', senderType: 'parent',
        content: 'Not really. We just feed her and put her down when she seems sleepy. Sometimes she fights it.',
      },
      {
        id: 'msg-b2-4', sessionId: 'call-s2', senderName: 'Priya Sharma', senderType: 'nanny',
        content: 'Let\'s establish a "Bath-Book-Bed" routine at 7:30 PM. Also try the "drowsy but awake" method — put baby in the crib when sleepy but not fully asleep. Use white noise too. Let me walk you through the steps.',
      },
    ]

    for (const msg of chatMessages) {
      await db.chatMessage.upsert({
        where: { id: msg.id },
        update: {},
        create: msg,
      })
    }

    // 10. Seed sample payments (including for seed-b3 and seed-b4)
    const samplePayments = [
      {
        id: 'pay-seed-1', userId: 'u1', amount: 375, currency: 'inr', status: 'completed',
        paymentMethod: 'razorpay', description: 'Instant call with Priya Sharma (25 min)',
        createdAt: new Date(now - 2 * day),
      },
      {
        id: 'pay-seed-2', userId: 'u1', amount: 450, currency: 'inr', status: 'completed',
        paymentMethod: 'razorpay', description: 'Scheduled call with Priya Sharma (30 min)',
        createdAt: new Date(now - 1 * day),
      },
      {
        id: 'pay-seed-3', userId: 'u1', amount: 700, currency: 'inr', status: 'completed',
        paymentMethod: 'razorpay', description: 'Instant call with Anjali Gupta (35 min)',
        createdAt: new Date(now - 3 * day),
      },
      {
        id: 'pay-seed-4', userId: 'u1', amount: 500, currency: 'inr', status: 'completed',
        paymentMethod: 'razorpay', description: 'Scheduled call with Sneha Patel (20 min)',
        createdAt: new Date(now - 4 * day),
      },
      {
        id: 'pay-seed-5', userId: 'u1', amount: 1350, currency: 'inr', status: 'completed',
        paymentMethod: 'razorpay', description: 'Scheduled call with Dr. Meera Iyer (45 min)',
        createdAt: new Date(now - 5 * day),
      },
      {
        id: 'pay-seed-6', userId: 'u1', amount: 375, currency: 'inr', status: 'completed',
        paymentMethod: 'razorpay', description: 'Upcoming instant call with Priya Sharma',
        createdAt: new Date(now),
      },
      {
        id: 'pay-seed-7', userId: 'u1', amount: 450, currency: 'inr', status: 'completed',
        paymentMethod: 'razorpay', description: 'Scheduled call with Priya Sharma (baby massage)',
        createdAt: new Date(now),
      },
    ]

    for (const payment of samplePayments) {
      await db.payment.upsert({
        where: { id: payment.id },
        update: {},
        create: payment,
      })
    }

    // 11. Seed sample notifications for nanny user u2
    const sampleNotifications = [
      { id: 'seed-not1', userId: 'u2', title: 'New Booking Request', message: 'Kavita Singh wants to schedule a call for tomorrow', type: 'info', read: false },
      { id: 'seed-not2', userId: 'u2', title: 'Payment Received', message: '₹450 received for call with Anita Desai', type: 'success', read: false },
      { id: 'seed-not3', userId: 'u2', title: 'Rating Update', message: 'You received a 5-star rating from Ritu Mehra', type: 'info', read: true },
      { id: 'seed-not4', userId: 'u2', title: 'Welcome to MUMAA!', message: 'Your expert profile is now live. Start accepting calls!', type: 'success', read: true },
    ]

    for (const notif of sampleNotifications) {
      await db.notification.upsert({
        where: { id: notif.id },
        update: {},
        create: notif,
      })
    }

    // Count totals
    const usersCount = await db.user.count()
    const nanniesCount = await db.nanny.count()
    const reviewsCount = await db.review.count()
    const registrationsCount = await db.nannyRegistration.count()
    const adminSettingsCount = await db.adminSettings.count()
    const bookingsCount = await db.booking.count()
    const notificationsCount = await db.notification.count()
    const callSessionsCount = await db.callSession.count()
    const chatMessagesCount = await db.chatMessage.count()
    const paymentsCount = await db.payment.count()

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        users: usersCount,
        nannies: nanniesCount,
        reviews: reviewsCount,
        registrations: registrationsCount,
        adminSettings: adminSettingsCount,
        bookings: bookingsCount,
        notifications: notificationsCount,
        callSessions: callSessionsCount,
        chatMessages: chatMessagesCount,
        payments: paymentsCount,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to seed database'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
