import { create } from 'zustand'

// ─── Existing Interfaces ─────────────────────────────────────────────────────

export interface Nanny {
  id: string
  name: string
  specialty: string
  experience: number
  rating: number
  reviewCount: number
  bio: string
  avatar: string
  availability: 'available' | 'busy' | 'offline'
  languages: string
}

export interface Booking {
  id: string
  nannyId: string
  nanny?: Nanny
  callSession?: { id: string; roomId: string; status: string }
  parentName: string
  parentEmail: string
  type: 'instant' | 'scheduled'
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled'
  scheduledAt?: Date
  startedAt?: Date
  endedAt?: Date
  duration?: number
  totalPrice?: number
  notes?: string
  createdAt: Date
}

export interface CallSession {
  id: string
  bookingId: string
  roomId: string
  status: 'waiting' | 'connecting' | 'active' | 'ended'
  createdAt: Date
}

export interface ChatMessage {
  id: string
  sessionId: string
  senderName: string
  senderType: 'parent' | 'nanny'
  content: string
  createdAt: Date
}

export interface Testimonial {
  name: string
  babyAge: string
  text: string
  rating: number
}

// ─── NEW Interfaces ──────────────────────────────────────────────────────────

export type UserRole = 'parent' | 'nanny' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  avatar: string
  address: string
  babyAge: string
  emergencyContact: string
  bio: string
  experience: number
  specialty: string
  certifications: string
  languages: string
  availability: 'available' | 'busy' | 'offline'
  subscriptionPlan: string | null
  subscriptionStatus: 'none' | 'active' | 'cancelled' | 'past_due' | 'trial'
  trialStartDate: string | null
  createdAt: Date
}

export interface Payment {
  id: string
  userId: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  paymentMethod: string
  description: string
  createdAt: Date
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: Date
}

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  interval: 'monthly' | 'yearly'
  features: string[]
  callsPerMonth: number | null
  popular: boolean
  freeTrialDays: number
}

export interface NannyRegistration {
  id: string
  userId: string
  fullName: string
  email: string
  phone: string
  age?: number
  city?: string
  experience?: number
  specialty?: string
  languages?: string
  about?: string
  qualifications?: string
  resumeUrl?: string
  workExperience?: string
  status: 'pending' | 'meeting_scheduled' | 'approved' | 'rejected'
  adminNotes?: string
  meetingDate?: string
  meetingTime?: string
  meetingLink?: string
  approvedAt?: string
  rejectedAt?: string
  createdAt: string
}

// ─── Subscription Plans ──────────────────────────────────────────────────

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'standard',
    name: 'Standard',
    price: 299,
    interval: 'monthly' as const,
    features: [
      'Unlimited video calls',
      '30 min per session',
      'All expert consultants',
      'In-call chat support',
      'Call history access',
    ],
    callsPerMonth: null,
    popular: false,
    freeTrialDays: 0,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 599,
    interval: 'monthly' as const,
    features: [
      'Unlimited video calls',
      '60 min per session',
      'Priority expert access',
      'Call recording & download',
      'AI session summaries',
      'Family sharing (up to 3)',
      '24/7 priority support',
    ],
    callsPerMonth: null,
    popular: true,
    freeTrialDays: 0,
  },
]

// ─── State Interfaces ────────────────────────────────────────────────────────

interface AppState {
  nannies: Nanny[]
  selectedNanny: Nanny | null
  isBookingOpen: boolean
  bookingStep: number
  bookingType: 'instant' | 'scheduled'
  bookingDate?: Date
  bookingTime?: string
  bookingName: string
  bookingEmail: string
  bookingNotes: string
  isInCall: boolean
  callSession: CallSession | null
  isChatOpen: boolean
  messages: ChatMessage[]
  bookings: Booking[]
  activeFilter: string
  testimonials: Testimonial[]
  trialStartDate: string | null
  isTrialActive: boolean

  currentUser: User | null
  isAuthenticated: boolean
  isAuthOpen: boolean
  authMode: 'login' | 'signup' | 'forgot-password' | 'verify-otp' | 'reset-password'
  forgotPasswordEmail: string
  forgotPasswordOtp: string
  forgotPasswordNewPassword: string
  forgotPasswordConfirmPassword: string
  authRole: UserRole
  isProfileOpen: boolean
  isPaymentOpen: boolean
  isAdminDashboardOpen: boolean
  isNannyPortalOpen: boolean
  isAdminView: boolean
  selectedPlan: SubscriptionPlan | null
  payments: Payment[]
  notifications: Notification[]
  adminTab: string
  nannyPortalTab: string
  incomingCallRequest: Booking | null
  nannyRegistrations: NannyRegistration[]
  isNannyRegOpen: boolean
  isProcessingPayment: boolean
  language: string
}

interface AppActions {
  activateTrial: () => void
  getTrialDaysRemaining: () => number
  canMakeCalls: () => boolean
  setSelectedNanny: (nanny: Nanny | null) => void
  openBooking: (nanny?: Nanny, type?: 'instant' | 'scheduled') => void
  closeBooking: () => void
  setBookingStep: (step: number) => void
  setBookingType: (type: 'instant' | 'scheduled') => void
  setBookingDate: (date: Date | undefined) => void
  setBookingTime: (time: string) => void
  setBookingName: (name: string) => void
  setBookingEmail: (email: string) => void
  setBookingNotes: (notes: string) => void
  startCall: (booking: Booking, overrideRoomId?: string) => void
  endCall: () => void
  toggleChat: () => void
  sendMessage: (content: string) => void
  setActiveFilter: (filter: string) => void
  confirmBooking: () => void

  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (name: string, email: string, password: string, role: UserRole, phone?: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  sendOtp: (email: string) => Promise<boolean>
  verifyOtp: (email: string, otp: string) => Promise<boolean>
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<boolean>
  setForgotPasswordEmail: (email: string) => void
  setForgotPasswordOtp: (otp: string) => void
  setForgotPasswordNewPassword: (pw: string) => void
  setForgotPasswordConfirmPassword: (pw: string) => void
  updateProfile: (updates: Partial<User>) => Promise<boolean>
  startFreeTrialCall: () => Promise<void>
  openAuth: (mode: 'login' | 'signup', role?: UserRole) => void
  closeAuth: () => void
  openProfile: () => void
  closeProfile: () => void
  openPayment: () => void
  closePayment: () => void
  openAdminDashboard: () => void
  closeAdminDashboard: () => void
  openNannyPortal: () => void
  closeNannyPortal: () => void
  selectPlan: (plan: SubscriptionPlan) => void
  processPayment: (cardNumber: string, expiry: string, cvv: string, cardName: string) => Promise<boolean>
  setIsProcessingPayment: (val: boolean) => void
  markNotificationRead: (id: string) => void
  addNotification: (title: string, message: string, type: string) => void
  setAdminTab: (tab: string) => void
  setNannyPortalTab: (tab: string) => void
  toggleAvailability: () => Promise<void>
  acceptCall: () => void
  rejectCall: () => void
  openNannyReg: () => void
  closeNannyReg: () => void
  setNannyRegistrations: (regs: NannyRegistration[]) => void
  setLanguage: (lang: string) => void

  fetchNannies: () => Promise<void>
  fetchTestimonials: () => Promise<void>
  fetchBookings: () => Promise<void>
  fetchNotifications: () => Promise<void>
  fetchPayments: () => Promise<void>
}

// ─── Zustand Store ───────────────────────────────────────────────────────────

export const useAppStore = create<AppState & AppActions>((set, get) => ({
  nannies: [],
  selectedNanny: null,
  isBookingOpen: false,
  bookingStep: 1,
  bookingType: 'instant',
  bookingDate: undefined,
  bookingTime: undefined,
  bookingName: '',
  bookingEmail: '',
  bookingNotes: '',
  isInCall: false,
  callSession: null,
  isChatOpen: false,
  messages: [],
  bookings: [],
  activeFilter: 'All',
  testimonials: [],
  trialStartDate: null,
  isTrialActive: false,

  currentUser: null,
  isAuthenticated: false,
  isAuthOpen: false,
  authMode: 'login',
  authRole: 'parent',
  isProfileOpen: false,
  isPaymentOpen: false,
  isAdminDashboardOpen: false,
  isNannyPortalOpen: false,
  isAdminView: false,
  selectedPlan: null,
  payments: [],
  notifications: [],
  adminTab: 'overview',
  nannyPortalTab: 'overview',
  incomingCallRequest: null,
  nannyRegistrations: [],
  isNannyRegOpen: false,
  isProcessingPayment: false,
  forgotPasswordEmail: '',
  forgotPasswordOtp: '',
  forgotPasswordNewPassword: '',
  forgotPasswordConfirmPassword: '',
  language: 'en',

  setSelectedNanny: (nanny) => set({ selectedNanny: nanny }),

  openBooking: (nanny, type) =>
    set({
      isBookingOpen: true,
      selectedNanny: nanny || null,
      bookingType: type || 'instant',
      bookingStep: nanny ? 2 : 1,
    }),

  closeBooking: () =>
    set({
      isBookingOpen: false,
      bookingStep: 1,
      bookingDate: undefined,
      bookingTime: undefined,
      bookingName: '',
      bookingEmail: '',
      bookingNotes: '',
    }),

  setBookingStep: (step) => set({ bookingStep: step }),
  setBookingType: (type) => set({ bookingType: type }),
  setBookingDate: (date) => set({ bookingDate: date }),
  setBookingTime: (time) => set({ bookingTime: time }),
  setBookingName: (name) => set({ bookingName: name }),
  setBookingEmail: (email) => set({ bookingEmail: email }),
  setBookingNotes: (notes) => set({ bookingNotes: notes }),

  startCall: (booking, overrideRoomId) => {
    const roomId = overrideRoomId || `room-${Date.now()}`
    const session: CallSession = {
      id: booking.callSession?.id || `session-${Date.now()}`,
      bookingId: booking.id,
      roomId,
      status: 'connecting',
      createdAt: new Date(),
    }
    set({
      isInCall: true,
      callSession: session,
      isChatOpen: false,
      messages: [],
    })
    setTimeout(() => {
      set({
        callSession: { ...session, status: 'active' },
      })
    }, 2000)
  },

  endCall: () =>
    set({
      isInCall: false,
      callSession: null,
      isChatOpen: false,
    }),

  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),

  sendMessage: (content) => {
    const state = get()
    if (!state.callSession) return
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sessionId: state.callSession.id,
      senderName: 'You',
      senderType: 'parent',
      content,
      createdAt: new Date(),
    }
    set({ messages: [...state.messages, msg] })
    setTimeout(() => {
      const reply: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sessionId: state.callSession!.id,
        senderName: state.selectedNanny?.name || 'Expert',
        senderType: 'nanny',
        content: "Thank you for your question! Let me help you with that. Can you tell me more details?",
        createdAt: new Date(),
      }
      set((s) => ({ messages: [...s.messages, reply] }))
    }, 1500)
  },

  setActiveFilter: (filter) => set({ activeFilter: filter }),

  confirmBooking: () => {
    const state = get()

    // Triple-redundant trial check (same logic as UI components)
    const isOnTrial = state.isTrialActive
      || state.currentUser?.subscriptionStatus === 'trial'
      || (state.currentUser?.trialStartDate ? (Math.floor((Date.now() - new Date(state.currentUser.trialStartDate).getTime()) / (1000 * 60 * 60 * 24)) < 30) : false)
    const hasSubscription = state.currentUser?.subscriptionStatus === 'active'
    const canCall = isOnTrial || hasSubscription

    // Helper to create booking API call
    const makeBooking = (s: typeof state) => {
      return fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nannyId: s.selectedNanny?.id,
          parentId: s.currentUser?.id,
          parentName: s.bookingName || s.currentUser?.name || '',
          parentEmail: s.bookingEmail || s.currentUser?.email || '',
          type: s.bookingType,
          notes: s.bookingNotes,
        }),
      }).then(r => r.json()).then(json => {
        if (json.success) {
          const savedBooking = json.data
          set({
            bookings: [savedBooking, ...get().bookings],
            isBookingOpen: false,
            bookingStep: 1,
            bookingDate: undefined,
            bookingTime: undefined,
            bookingName: '',
            bookingEmail: '',
            bookingNotes: '',
          })
          if (s.bookingType === 'instant') {
            get().startCall(savedBooking, savedBooking.callSession?.roomId)
          }
        }
      }).catch(() => {})
    }

    if (canCall) {
      makeBooking(state)
    } else if (state.currentUser?.role === 'parent') {
      // Parent without active trial/subscription — auto-activate 30-day free trial
      const startDate = new Date().toISOString()
      set({ trialStartDate: startDate, isTrialActive: true })
      fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trialStartDate: startDate, subscriptionStatus: 'trial' }),
      }).catch(() => {})
      makeBooking(get())
    } else {
      // Non-parent — show payment dialog
      set({ isBookingOpen: false, bookingStep: 1, isPaymentOpen: true })
    }
  },

  login: async (email, password) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        const user = json.data as User
        const notifRes = await fetch(`/api/notifications?userId=${user.id}`)
        const notifJson = await notifRes.json()
        const userNotifications = notifJson.success ? notifJson.data : []
        set({
          currentUser: user,
          isAuthenticated: true,
          isAuthOpen: false,
          notifications: userNotifications,
          isAdminView: user.role === 'admin',
        })
        // Check trial status (only for parents, not admin/nanny)
        if (user.role !== 'admin') {
          if (user.trialStartDate) {
            const start = new Date(user.trialStartDate)
            const daysPassed = Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24))
            set({
              trialStartDate: user.trialStartDate,
              isTrialActive: daysPassed < 30,
            })
          } else if (!user.subscriptionStatus || user.subscriptionStatus === 'none') {
            // New user or never had trial — activate trial
            const startDate = new Date().toISOString()
            set({ trialStartDate: startDate, isTrialActive: true })
            fetch('/api/auth/me', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ trialStartDate: startDate, subscriptionStatus: 'trial' }),
            }).catch(() => {})
          }
        }
        get().fetchBookings()
        get().fetchPayments()
        return { success: true }
      }
      return { success: false, error: json.error || 'Invalid email or password' }
    } catch {
      return { success: false, error: 'Network error. Please try again.' }
    }
  },

  signup: async (name, email, password, role, phone) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signup', name, email, password, role, phone }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        set({
          currentUser: json.data as User,
          isAuthenticated: true,
          isAuthOpen: false,
          isAdminView: role === 'admin',
        })
        // Activate trial for new user
        const startDate = new Date().toISOString()
        set({ trialStartDate: startDate, isTrialActive: true })
        fetch('/api/auth/me', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trialStartDate: startDate, subscriptionStatus: 'trial' }),
        }).catch(() => {})
        return { success: true }
      }
      return { success: false, error: json.error || 'Could not create account.' }
    } catch {
      return { success: false, error: 'Network error. Please try again.' }
    }
  },

  logout: () =>
    set({
      currentUser: null,
      isAuthenticated: false,
      isAdminView: false,
      isAdminDashboardOpen: false,
      isNannyPortalOpen: false,
      isProfileOpen: false,
      isPaymentOpen: false,
      isNannyRegOpen: false,
      selectedPlan: null,
      forgotPasswordEmail: '',
      forgotPasswordOtp: '',
      forgotPasswordNewPassword: '',
      forgotPasswordConfirmPassword: '',
      trialStartDate: null,
      isTrialActive: false,
    }),

  updateProfile: async (updates) => {
    const { currentUser } = get()
    if (!currentUser) return false
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const json = await res.json()
      if (json.success && json.data) {
        set({ currentUser: json.data as User })
        return true
      }
      return false
    } catch {
      return false
    }
  },

  startFreeTrialCall: async () => {
    const state = get()
    // If not authenticated, open signup
    if (!state.isAuthenticated || !state.currentUser) {
      set({ isAuthOpen: true, authMode: 'signup', authRole: 'parent' })
      return
    }
    // Only parents can start trial calls
    if (state.currentUser.role !== 'parent') return

    try {
      // Fetch nannies if empty
      let nannies = state.nannies
      if (nannies.length === 0) {
        const res = await fetch('/api/nannies')
        if (res.ok) {
          const json = await res.json()
          nannies = json.data || json.nannies || json || []
          set({ nannies })
        }
      }
      // Activate trial if not already active
      if (!state.isTrialActive) {
        const startDate = new Date().toISOString()
        set({ trialStartDate: startDate, isTrialActive: true })
        fetch('/api/auth/me', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trialStartDate: startDate, subscriptionStatus: 'trial' }),
        }).catch(() => {})
      }
      // Find first available nanny
      const availableNanny = nannies.find((n: Nanny) => n.availability === 'available')
      if (!availableNanny) {
        document.getElementById('experts')?.scrollIntoView({ behavior: 'smooth' })
        return
      }
      // Create booking
      const bookingRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nannyId: availableNanny.id,
          parentId: state.currentUser.id,
          parentName: state.currentUser.name || '',
          parentEmail: state.currentUser.email || '',
          type: 'instant',
          notes: '',
        }),
      })
      const bookingJson = await bookingRes.json()
      if (bookingJson.success && bookingJson.data) {
        const savedBooking = bookingJson.data
        set({ bookings: [savedBooking, ...get().bookings] })
        set({ selectedNanny: availableNanny })
        // Use roomId from API callSession if available
        const apiRoomId = savedBooking.callSession?.roomId
        get().startCall(savedBooking, apiRoomId)
      } else {
        console.error('[MUMAA] Booking failed:', bookingJson.error)
      }
    } catch (err) {
      console.error('[MUMAA] startFreeTrialCall error:', err)
    }
  },

  openAuth: (mode, role) =>
    set({
      isAuthOpen: true,
      authMode: mode,
      authRole: role || 'parent',
    }),

  closeAuth: () => set({ isAuthOpen: false }),
  openProfile: () => set({ isProfileOpen: true }),
  closeProfile: () => set({ isProfileOpen: false }),
  openPayment: () => set({ isPaymentOpen: true }),
  closePayment: () => set({ isPaymentOpen: false, selectedPlan: null }),
  openAdminDashboard: () => set({ isAdminDashboardOpen: true, isAdminView: true }),
  closeAdminDashboard: () => set({ isAdminDashboardOpen: false, isAdminView: false }),
  openNannyPortal: () => set({ isNannyPortalOpen: true }),
  closeNannyPortal: () => set({ isNannyPortalOpen: false }),

  selectPlan: (plan) => set({ selectedPlan: plan }),

  processPayment: async (_cardNumber, _expiry, _cvv, _cardName): Promise<boolean> => {
    const { currentUser, selectedPlan } = get()
    if (!currentUser || !selectedPlan) return false

    set({ isProcessingPayment: true })

    try {
      const res = await fetch('/api/payments/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          amount: selectedPlan.price,
        }),
      })
      const json = await res.json()

      if (json.success && json.data) {
        set({
          currentUser: {
            ...get().currentUser!,
            subscriptionPlan: json.data.subscriptionPlan,
            subscriptionStatus: json.data.subscriptionStatus,
          },
          selectedPlan: null,
          isPaymentOpen: false,
          isProcessingPayment: false,
        })
        get().addNotification('Subscription Activated!', `Your ${selectedPlan.name} plan is now active.`, 'success')
        return true
      } else {
        set({ isProcessingPayment: false })
        get().addNotification('Payment Failed', json.error || 'Could not process payment. Please try again.', 'error')
        return false
      }
    } catch {
      set({ isProcessingPayment: false })
      get().addNotification('Payment Error', 'Network error. Please try again.', 'error')
      return false
    }
  },

  setIsProcessingPayment: (val) => set({ isProcessingPayment: val }),

  markNotificationRead: async (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    }))
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
    } catch {
      // Silent fail — already optimistic
    }
  },

  addNotification: (title, message, type) =>
    set((state) => ({
      notifications: [
        {
          id: `not-${Date.now()}`,
          userId: state.currentUser?.id || '',
          title,
          message,
          type: type as Notification['type'],
          read: false,
          createdAt: new Date(),
        },
        ...state.notifications,
      ],
    })),

  setAdminTab: (tab) => set({ adminTab: tab }),
  setNannyPortalTab: (tab) => set({ nannyPortalTab: tab }),

  toggleAvailability: async () => {
    const { currentUser } = get()
    if (!currentUser) return
    const current = currentUser.availability
    const next = current === 'available' ? 'busy' : current === 'busy' ? 'offline' : 'available'
    set({ currentUser: { ...currentUser, availability: next } })
    try {
      await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability: next }),
      })
    } catch {
      // Silent fail
    }
  },

  acceptCall: () => {
    const { incomingCallRequest } = get()
    if (!incomingCallRequest) return
    set({ incomingCallRequest: null })
    get().startCall(incomingCallRequest)
  },

  rejectCall: () => set({ incomingCallRequest: null }),

  sendOtp: async (email) => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await res.json()
      return json.success === true
    } catch {
      return false
    }
  },

  verifyOtp: async (email, otp) => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', email, otp }),
      })
      const json = await res.json()
      return json.success === true
    } catch {
      return false
    }
  },

  resetPassword: async (email, otp, newPassword) => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset', email, otp, newPassword }),
      })
      const json = await res.json()
      return json.success === true
    } catch {
      return false
    }
  },

  setForgotPasswordEmail: (email) => set({ forgotPasswordEmail: email }),
  setForgotPasswordOtp: (otp) => set({ forgotPasswordOtp: otp }),
  setForgotPasswordNewPassword: (pw) => set({ forgotPasswordNewPassword: pw }),
  setForgotPasswordConfirmPassword: (pw) => set({ forgotPasswordConfirmPassword: pw }),

  openNannyReg: () => set({ isNannyRegOpen: true }),
  closeNannyReg: () => set({ isNannyRegOpen: false }),
  setLanguage: (lang) => set({ language: lang }),
  setNannyRegistrations: (regs) => set({ nannyRegistrations: regs }),

  activateTrial: () => {
    const { currentUser, trialStartDate } = get()
    if (!currentUser || trialStartDate) return
    const startDate = new Date().toISOString()
    set({ trialStartDate: startDate, isTrialActive: true })
    fetch('/api/auth/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trialStartDate: startDate, subscriptionStatus: 'trial' }),
    }).catch(() => {})
  },

  getTrialDaysRemaining: () => {
    const { trialStartDate } = get()
    if (!trialStartDate) return 0
    const start = new Date(trialStartDate)
    const now = new Date()
    const diff = 30 - Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  },

  canMakeCalls: () => {
    const { isTrialActive, currentUser } = get()
    if (isTrialActive) return true
    if (currentUser?.subscriptionStatus === 'active') return true
    return false
  },

  fetchNannies: async () => {
    try {
      const res = await fetch('/api/nannies')
      const json = await res.json()
      if (json.success && json.data) {
        const mapped: Nanny[] = json.data.map((n: Record<string, unknown>) => ({
          id: n.id as string,
          name: n.name as string,
          specialty: n.specialty as string,
          experience: n.experience as number,
          rating: n.rating as number,
          reviewCount: n.reviewCount as number,
          bio: n.bio as string,
          avatar: n.avatar as string,
          availability: (n.availability as Nanny['availability']) || 'offline',
          languages: n.languages as string,
        }))
        set({ nannies: mapped })
      }
    } catch {
      // Silently fail — keep existing data
    }
  },

  fetchTestimonials: async () => {
    try {
      const nannies = get().nannies
      if (nannies.length === 0) return
      const allReviews: Testimonial[] = []
      for (const nanny of nannies.slice(0, 3)) {
        const res = await fetch(`/api/reviews?nannyId=${nanny.id}`)
        const json = await res.json()
        if (json.success && json.data) {
          for (const r of json.data) {
            if (r.comment) {
              allReviews.push({
                name: r.parentName || 'Anonymous',
                babyAge: '',
                text: r.comment,
                rating: r.rating || 5,
              })
            }
          }
        }
      }
      if (allReviews.length > 0) {
        set({ testimonials: allReviews.slice(0, 5) })
      }
    } catch {
      // Silently fail
    }
  },

  fetchBookings: async () => {
    try {
      const res = await fetch('/api/bookings')
      const json = await res.json()
      if (json.success && json.data) {
        const mapped: Booking[] = json.data.map((b: Record<string, unknown>) => ({
          id: b.id as string,
          nannyId: b.nannyId as string,
          nanny: b.nanny ? {
            id: (b.nanny as Record<string, unknown>).id as string,
            name: (b.nanny as Record<string, unknown>).name as string,
            specialty: (b.nanny as Record<string, unknown>).specialty as string,
            experience: (b.nanny as Record<string, unknown>).experience as number,
            rating: (b.nanny as Record<string, unknown>).rating as number,
            reviewCount: (b.nanny as Record<string, unknown>).reviewCount as number,
            bio: (b.nanny as Record<string, unknown>).bio as string,
            avatar: (b.nanny as Record<string, unknown>).avatar as string,
            availability: ((b.nanny as Record<string, unknown>).availability as Nanny['availability']) || 'offline',
            languages: (b.nanny as Record<string, unknown>).languages as string,
          } : undefined,
          parentName: b.parentName as string,
          parentEmail: b.parentEmail as string,
          type: b.type as Booking['type'],
          status: b.status as Booking['status'],
          scheduledAt: b.scheduledAt ? new Date(b.scheduledAt as string) : undefined,
          startedAt: b.startedAt ? new Date(b.startedAt as string) : undefined,
          endedAt: b.endedAt ? new Date(b.endedAt as string) : undefined,
          duration: b.duration as number | undefined,
          totalPrice: b.totalPrice as number | undefined,
          notes: b.notes as string | undefined,
          createdAt: new Date(b.createdAt as string),
        }))
        set({ bookings: mapped })
      }
    } catch {
      // Silently fail
    }
  },

  fetchNotifications: async () => {
    try {
      const user = get().currentUser
      if (!user) return
      const res = await fetch(`/api/notifications?userId=${user.id}`)
      const json = await res.json()
      if (json.success && json.data) {
        const mapped: Notification[] = json.data.map((n: Record<string, unknown>) => ({
          id: n.id as string,
          userId: n.userId as string,
          title: n.title as string,
          message: n.message as string,
          type: n.type as Notification['type'],
          read: n.read as boolean,
          createdAt: new Date(n.createdAt as string),
        }))
        set({ notifications: mapped })
      }
    } catch {
      // Silently fail
    }
  },

  fetchPayments: async () => {
    try {
      const user = get().currentUser
      if (!user) return
      const res = await fetch('/api/payments/revenue')
      const json = await res.json()
      if (json.success) {
        // Revenue is just a number, but we keep local payments for now
      }
    } catch {
      // Silently fail
    }
  },
}))
