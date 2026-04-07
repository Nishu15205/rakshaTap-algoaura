'use client'

import { CalendarDays, Clock, Phone, User, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  'in-progress': { label: 'In Progress', color: 'bg-green-100 text-green-700 border-green-200' },
  completed: { label: 'Completed', color: 'bg-stone-100 text-stone-600 border-stone-200' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-600 border-red-200' },
}

export default function MyBookingsSection() {
  const { currentUser, bookings, nannies, openAuth, openBooking, fetchBookings } = useAppStore()

  if (!currentUser) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto" id="bookings">
        <div className="text-center mb-10">
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 mb-4 font-semibold">
            <CalendarDays className="w-3.5 h-3.5 mr-1" />
            My Bookings
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-stone-800 mb-2">
            Your Consultation{' '}
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              History
            </span>
          </h2>
          <p className="text-stone-500 max-w-md mx-auto">
            Track your past and upcoming video consultations.
          </p>
        </div>
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-2xl p-8 border border-stone-100 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8 text-stone-400" />
            </div>
            <h3 className="text-lg font-bold text-stone-800 mb-2">Login to View Bookings</h3>
            <p className="text-sm text-stone-500 mb-6">
              Sign in to see your consultation history and manage your bookings.
            </p>
            <Button
              onClick={() => openAuth('login')}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </Button>
          </div>
        </div>
      </section>
    )
  }

  const userBookings = bookings.filter((b) => b.parentEmail === currentUser.email)
  const status = (s: string) => statusConfig[s] || { label: s, color: 'bg-stone-100 text-stone-500 border-stone-200' }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto" id="bookings">
      <div className="text-center mb-10">
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 mb-4 font-semibold">
          <CalendarDays className="w-3.5 h-3.5 mr-1" />
          My Bookings
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-bold text-stone-800 mb-2">
          Your Consultation{' '}
          <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
            History
          </span>
        </h2>
        <p className="text-stone-500 max-w-md mx-auto">
          Track your past and upcoming video consultations.
        </p>
      </div>

      {userBookings.length === 0 ? (
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-2xl p-8 border border-stone-100 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="w-8 h-8 text-stone-400" />
            </div>
            <h3 className="text-lg font-bold text-stone-800 mb-2">No bookings yet</h3>
            <p className="text-sm text-stone-500 mb-6">
              You haven&apos;t made any video consultations yet.
            </p>
            <Button
              onClick={() => openBooking()}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all"
            >
              <Phone className="w-4 h-4 mr-2" />
              Book Your First Call
            </Button>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-3">
          {userBookings.map((booking) => {
            const nanny = nannies.find((n) => n.id === booking.nannyId)
            const st = status(booking.status)

            return (
              <div
                key={booking.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {nanny?.avatar ? (
                      <img src={nanny.avatar} alt={nanny.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-orange-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-stone-800 truncate">
                        {nanny?.name || booking.parentName}
                      </h4>
                      <Badge className={`text-[10px] px-1.5 py-0 border ${
                        booking.type === 'instant'
                          ? 'bg-orange-100 text-orange-700 border-orange-200'
                          : 'bg-blue-100 text-blue-700 border-blue-200'
                      }`}>
                        {booking.type === 'instant' ? 'Instant' : 'Scheduled'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-stone-400">
                      {booking.scheduledAt && (
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {new Date(booking.scheduledAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                      {booking.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {booking.duration} min call
                        </span>
                      )}
                    </div>
                  </div>

                  <Badge className={`${st.color} text-[10px] px-2 py-0 border font-semibold shrink-0`}>
                    {st.label}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
