'use client'

import { useEffect, useMemo } from 'react'
import {
  Phone,
  CalendarCheck,
  Star,
  Check,
  ArrowLeft,
  ArrowRight,
  X,
  Lock,
  Gift,
  CreditCard,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'

const timeSlots = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM',
  '08:00 PM', '08:30 PM', '09:00 PM',
]

export default function BookingDialog() {
  const {
    isBookingOpen,
    closeBooking,
    bookingStep,
    setBookingStep,
    bookingType,
    setBookingType,
    selectedNanny,
    setSelectedNanny,
    nannies,
    bookingDate,
    setBookingDate,
    bookingTime,
    setBookingTime,
    bookingName,
    setBookingName,
    bookingEmail,
    setBookingEmail,
    bookingNotes,
    setBookingNotes,
    confirmBooking,
    isAuthenticated,
    currentUser,
    openAuth,
    openPayment,
    isTrialActive,
  } = useAppStore()

  const hasSubscription = currentUser?.subscriptionStatus === 'active'
  // Triple-redundant trial check: store flag, server status, or trialStartDate within 30 days
  const isOnTrial = useMemo(() => {
    if (isTrialActive) return true
    if (currentUser?.subscriptionStatus === 'trial') return true
    if (currentUser?.trialStartDate) {
      const start = new Date(currentUser.trialStartDate)
      const daysPassed = Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24))
      if (daysPassed < 30) return true
    }
    return false
  }, [isTrialActive, currentUser?.subscriptionStatus, currentUser?.trialStartDate])

  const defaultName = currentUser?.name || ''
  const defaultEmail = currentUser?.email || ''

  // Pre-fill from currentUser when dialog opens
  useEffect(() => {
    if (isBookingOpen && currentUser) {
      if (!bookingName) setBookingName(currentUser.name)
      if (!bookingEmail) setBookingEmail(currentUser.email)
    }
  }, [isBookingOpen, currentUser])

  // Auto-activate 30-day free trial for authenticated parent users who have no trial/subscription
  useEffect(() => {
    if (isBookingOpen && isAuthenticated && !isTrialActive && !hasSubscription && currentUser?.role === 'parent' && currentUser.subscriptionStatus !== 'trial') {
      const startDate = new Date().toISOString()
      useAppStore.setState({ trialStartDate: startDate, isTrialActive: true })
      fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trialStartDate: startDate, subscriptionStatus: 'trial' }),
      }).catch(() => {})
    }
  }, [isBookingOpen, isAuthenticated, isTrialActive, hasSubscription, currentUser])

  const stepLabels = ['Call Type', 'Your Details', 'Review', 'Confirming']
  const selectedNannyData = nannies.find((n) => n.id === selectedNanny?.id)
  const availableNannies = nannies.filter((n) => n.availability !== 'offline')

  const canProceed = () => {
    if (bookingStep === 1) return bookingType === 'instant' || (bookingType === 'scheduled' && !!bookingDate && !!bookingTime)
    if (bookingStep === 2) return isAuthenticated && bookingName.trim() !== '' && bookingEmail.trim() !== ''
    return true
  }

  const nextStep = () => {
    if (bookingStep < 4 && canProceed()) {
      if (bookingStep === 1 && !isAuthenticated) {
        openAuth('login')
        return
      }
      setBookingStep(bookingStep + 1)
    }
  }

  const prevStep = () => {
    if (bookingStep > 1) setBookingStep(bookingStep - 1)
  }

  const handleConfirm = () => {
    confirmBooking()
  }

  return (
    <Dialog open={isBookingOpen} onOpenChange={(open) => !open && closeBooking()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden rounded-2xl p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-bold text-white">
                {stepLabels[bookingStep - 1] || 'Book a Call'}
              </DialogTitle>
              <DialogDescription className="text-white/80 text-sm mt-0.5">
                Step {bookingStep} of 4
              </DialogDescription>
            </div>
            <button
              onClick={closeBooking}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
          {/* Step dots */}
          <div className="flex items-center gap-1.5 mt-3">
            {stepLabels.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i < bookingStep ? 'w-6 bg-white' : 'w-3 bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[65vh]">
          {/* Login prompt */}
          {!isAuthenticated && (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 mb-4 text-center">
              <Gift className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-stone-800 mb-1">Sign up to start your free trial</p>
              <p className="text-xs text-stone-500 mb-3">Get 30 days of unlimited video consultations.</p>
              <Button
                onClick={() => { closeBooking(); openAuth('signup') }}
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl text-sm"
              >
                Sign Up Free
              </Button>
            </div>
          )}

          {/* Trial / subscription badge — NO subscribe prompts during active trial */}
          {isAuthenticated && isOnTrial && (
            <div className="bg-green-50 rounded-xl p-3 border border-green-100 mb-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                <Gift className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-xs font-semibold text-stone-800">
                Free — Included in your trial
              </p>
            </div>
          )}
          {isAuthenticated && !isOnTrial && hasSubscription && (
            <div className="bg-green-50 rounded-xl p-3 border border-green-100 mb-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-xs font-semibold text-stone-800">
                Included in your {currentUser?.subscriptionPlan} plan
              </p>
            </div>
          )}
          {/* Only show subscribe when trial has EXPIRED (had a trialStartDate but isOnTrial is false) */}
          {isAuthenticated && !isOnTrial && !hasSubscription && currentUser?.trialStartDate && (
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 mb-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-800">
                  Your free trial has ended
                </p>
                <button
                  onClick={() => { closeBooking(); openPayment() }}
                  className="text-xs text-orange-600 font-semibold hover:underline"
                >
                  Subscribe to continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Call type + date/time for scheduled */}
          {bookingStep === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-stone-500">How would you like to connect?</p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setBookingType('instant')}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    bookingType === 'instant'
                      ? 'border-orange-400 bg-orange-50'
                      : 'border-stone-100 hover:border-orange-200'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                    bookingType === 'instant'
                      ? 'bg-gradient-to-br from-amber-400 to-orange-400'
                      : 'bg-stone-100'
                  }`}>
                    <Phone className={`w-5 h-5 ${bookingType === 'instant' ? 'text-white' : 'text-stone-400'}`} />
                  </div>
                  <h4 className="text-sm font-bold text-stone-800 mb-0.5">Instant Call</h4>
                  <p className="text-[11px] text-stone-400">Connect right away</p>
                </button>
                <button
                  onClick={() => setBookingType('scheduled')}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    bookingType === 'scheduled'
                      ? 'border-orange-400 bg-orange-50'
                      : 'border-stone-100 hover:border-orange-200'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                    bookingType === 'scheduled'
                      ? 'bg-gradient-to-br from-amber-400 to-orange-400'
                      : 'bg-stone-100'
                  }`}>
                    <CalendarCheck className={`w-5 h-5 ${bookingType === 'scheduled' ? 'text-white' : 'text-stone-400'}`} />
                  </div>
                  <h4 className="text-sm font-bold text-stone-800 mb-0.5">Scheduled Call</h4>
                  <p className="text-[11px] text-stone-400">Pick a date & time</p>
                </button>
              </div>

              {/* Select nanny */}
              <div>
                <Label className="text-sm font-semibold text-stone-700 mb-2 block">
                  Select an Expert
                </Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableNannies.length > 0 ? availableNannies.map((nanny) => (
                    <button
                      key={nanny.id}
                      onClick={() => setSelectedNanny(nanny)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                        selectedNanny?.id === nanny.id
                          ? 'border-orange-400 bg-orange-50'
                          : 'border-stone-100 hover:border-orange-200'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {nanny.avatar ? (
                          <img src={nanny.avatar} alt={nanny.name} className="w-full h-full object-cover" />
                        ) : (
                          <Star className="w-4 h-4 text-orange-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-stone-800">{nanny.name}</span>
                          <span className="text-xs text-stone-500">{nanny.rating}★</span>
                        </div>
                        <p className="text-[11px] text-stone-400">{nanny.specialty}</p>
                      </div>
                      {selectedNanny?.id === nanny.id && (
                        <Check className="w-4 h-4 text-orange-500 shrink-0" />
                      )}
                    </button>
                  )) : (
                    <p className="text-sm text-stone-400 py-3 text-center">No experts available right now.</p>
                  )}
                </div>
              </div>

              {/* Date picker + time slots for scheduled */}
              {bookingType === 'scheduled' && (
                <>
                  <div>
                    <Label className="text-sm font-semibold text-stone-700 mb-2 block">
                      Select Date
                    </Label>
                    <div className="flex justify-center rounded-xl border border-stone-200 p-2 bg-white">
                      <Calendar
                        mode="single"
                        selected={bookingDate}
                        onSelect={(date) => setBookingDate(date)}
                        disabled={{ before: new Date() }}
                        className="rounded-lg"
                      />
                    </div>
                  </div>

                  {bookingDate && (
                    <div>
                      <Label className="text-sm font-semibold text-stone-700 mb-2 block">
                        Select Time
                      </Label>
                      <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                        {timeSlots.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => setBookingTime(slot)}
                            className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                              bookingTime === slot
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                                : 'bg-stone-50 text-stone-600 border border-stone-200 hover:border-orange-300'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 2: Details */}
          {bookingStep === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-stone-500 mb-2">Tell us about yourself:</p>
              <div>
                <Label htmlFor="booking-name" className="text-sm font-semibold text-stone-700">
                  Your Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="booking-name"
                  placeholder={defaultName || 'Enter your full name'}
                  value={bookingName}
                  onChange={(e) => setBookingName(e.target.value)}
                  className="mt-1.5 rounded-xl border-stone-200"
                />
              </div>
              <div>
                <Label htmlFor="booking-email" className="text-sm font-semibold text-stone-700">
                  Email Address <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="booking-email"
                  type="email"
                  placeholder={defaultEmail || 'your@email.com'}
                  value={bookingEmail}
                  onChange={(e) => setBookingEmail(e.target.value)}
                  className="mt-1.5 rounded-xl border-stone-200"
                />
              </div>
              <div>
                <Label htmlFor="booking-notes" className="text-sm font-semibold text-stone-700">
                  Notes <span className="text-stone-400 font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="booking-notes"
                  placeholder="Briefly describe what you need help with..."
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  className="mt-1.5 rounded-xl border-stone-200 resize-none"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {bookingStep === 3 && (
            <div className="space-y-4">
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                <h4 className="font-bold text-stone-800 text-sm mb-3">Booking Summary</h4>

                {selectedNannyData && (
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-stone-200">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center overflow-hidden shrink-0">
                      {selectedNannyData.avatar ? (
                        <img src={selectedNannyData.avatar} alt={selectedNannyData.name} className="w-full h-full object-cover" />
                      ) : (
                        <Star className="w-4 h-4 text-orange-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-800">{selectedNannyData.name}</p>
                      <p className="text-xs text-stone-400">{selectedNannyData.specialty}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Type</span>
                    <Badge className={bookingType === 'instant' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}>
                      {bookingType === 'instant' ? 'Instant' : 'Scheduled'}
                    </Badge>
                  </div>
                  {bookingType === 'scheduled' && bookingDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-500">Date & Time</span>
                      <span className="font-semibold text-stone-800">
                        {bookingDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        {bookingTime ? ` at ${bookingTime}` : ''}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Name</span>
                    <span className="font-semibold text-stone-800">{bookingName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Email</span>
                    <span className="font-semibold text-stone-800">{bookingEmail}</span>
                  </div>
                  {bookingNotes && (
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-500">Notes</span>
                      <span className="font-medium text-stone-600 text-right max-w-[200px] truncate">
                        {bookingNotes}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm pt-2 border-t border-stone-200">
                    <span className="text-stone-500">Cost</span>
                    <span className="font-semibold text-green-600">
                      {isOnTrial ? 'Free — Trial' : hasSubscription ? 'Included in plan' : 'Free — Trial'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {bookingStep === 4 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-stone-800 mb-2">Call Starting!</h3>
              <p className="text-sm text-stone-500">
                {bookingType === 'instant'
                  ? 'Connecting you with your expert now...'
                  : 'Your consultation has been booked!'}
              </p>
              {selectedNannyData && (
                <div className="flex items-center justify-center gap-3 mt-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center overflow-hidden">
                    {selectedNannyData.avatar ? (
                      <img src={selectedNannyData.avatar} alt={selectedNannyData.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-sm font-bold">
                        {selectedNannyData.name[0]}
                      </span>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-stone-800">{selectedNannyData.name}</p>
                    <p className="text-xs text-stone-400">{selectedNannyData.specialty}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-center gap-1.5 mt-4">
                <div className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          {bookingStep < 4 && (
            <div className="flex justify-between mt-6 pt-4 border-t border-stone-100">
              <Button
                variant="ghost"
                onClick={bookingStep === 1 ? closeBooking : prevStep}
                className="rounded-xl text-stone-500 hover:text-stone-700 font-semibold"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                {bookingStep === 1 ? 'Cancel' : 'Back'}
              </Button>
              <Button
                onClick={bookingStep === 3 ? handleConfirm : nextStep}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {bookingStep === 3 ? 'Confirm Booking' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
