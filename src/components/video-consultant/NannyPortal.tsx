'use client'

import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Star,
  IndianRupee,
  CalendarDays,
  Phone,
  Clock,
  TrendingUp,
  UserCircle,
  Loader2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays },
  { id: 'earnings', label: 'Earnings', icon: IndianRupee },
]

export default function NannyPortal() {
  const {
    isNannyPortalOpen,
    closeNannyPortal,
    nannyPortalTab,
    setNannyPortalTab,
    currentUser,
    toggleAvailability,
    bookings,
    nannies,
  } = useAppStore()

  const { toast } = useToast()
  const [loading, setLoading] = useState(isNannyPortalOpen)

  useEffect(() => {
    if (!isNannyPortalOpen) return
    let cancelled = false
    const s = useAppStore.getState()
    Promise.all([
      s.fetchBookings(),
    ]).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [isNannyPortalOpen])

  if (!isNannyPortalOpen || currentUser?.role !== 'nanny') return null

  const currentAvailability = currentUser?.availability || 'available'

  // Find nanny profile for this user
  const nannyProfile = nannies.find((n) => n.name === currentUser.name || n.specialty === currentUser.specialty)
  const nannyId = nannyProfile?.id

  // Filter bookings for this nanny
  const myBookings = nannyId
    ? bookings.filter((b) => b.nannyId === nannyId)
    : bookings.filter((b) => b.nanny?.name === currentUser.name)

  const handleToggleAvailability = async () => {
    await toggleAvailability()
    const next = currentAvailability === 'available' ? 'busy' : 'available'
    toast({
      title: 'Availability Updated',
      description: `You are now ${next}.`,
    })
  }

  const totalCalls = myBookings.filter(b => b.status === 'completed').length
  const totalEarnings = myBookings
    .filter(b => b.status === 'completed' && b.totalPrice)
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0)
  const todaySessions = myBookings.filter(b => {
    if (!b.scheduledAt) return false
    const today = new Date()
    const scheduled = new Date(b.scheduledAt)
    return scheduled.toDateString() === today.toDateString()
  }).length

  const stats = [
    { label: 'Total Calls', value: totalCalls.toString(), icon: Phone, gradient: 'from-rose-400 to-pink-500' },
    { label: 'Rating', value: nannyProfile ? nannyProfile.rating.toFixed(1) : '—', icon: Star, gradient: 'from-amber-400 to-orange-500' },
    { label: 'Earnings', value: `₹${Math.round(totalEarnings).toLocaleString()}`, icon: IndianRupee, gradient: 'from-emerald-400 to-teal-500' },
    { label: 'Today', value: `${todaySessions} sessions`, icon: TrendingUp, gradient: 'from-sky-400 to-blue-500' },
  ]

  return (
    <Dialog open={isNannyPortalOpen} onOpenChange={(open) => !open && closeNannyPortal()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 p-5 rounded-t-3xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white">Expert Portal</DialogTitle>
                <DialogDescription className="text-white/80 text-xs">Manage your calls, schedule, and earnings</DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleToggleAvailability}
                variant="ghost"
                className={`text-white text-xs font-semibold rounded-xl px-3 py-1.5 ${
                  currentAvailability === 'available'
                    ? 'bg-emerald-500/80 hover:bg-emerald-500'
                    : 'bg-stone-500/80 hover:bg-stone-500'
                }`}
              >
                <div className={`w-2 h-2 rounded-full mr-1.5 ${currentAvailability === 'available' ? 'bg-emerald-200 animate-pulse' : 'bg-stone-300'}`} />
                {currentAvailability === 'available' ? 'Available' : currentAvailability === 'busy' ? 'Busy' : 'Offline'}
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[65vh]">
          {/* Sidebar */}
          <div className="w-44 border-r border-stone-100 bg-stone-50/50 p-3 shrink-0 hidden md:block">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setNannyPortalTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    nannyPortalTab === tab.id
                      ? 'bg-gradient-to-r from-orange-50 to-rose-50 text-orange-600 shadow-sm border border-orange-100'
                      : 'text-stone-500 hover:text-stone-700 hover:bg-white/60'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main */}
          <ScrollArea className="flex-1">
            <div className="p-5">
              {/* Mobile tabs */}
              <div className="md:hidden mb-4 flex gap-2 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setNannyPortalTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                      nannyPortalTab === tab.id
                        ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-sm'
                        : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                  <span className="ml-3 text-stone-500">Loading...</span>
                </div>
              ) : (
                <>
                  {/* OVERVIEW */}
                  {nannyPortalTab === 'overview' && (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-orange-50 to-rose-50 rounded-2xl p-5 border border-orange-100">
                        <h3 className="text-lg font-bold text-stone-800">Welcome back, {currentUser?.name?.split(' ')[0] || 'Expert'}!</h3>
                        <p className="text-sm text-stone-500 mt-1">You have {todaySessions} session{todaySessions === 1 ? '' : 's'} scheduled today.</p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {stats.map((stat) => (
                          <Card key={stat.label} className="border-0 shadow-sm">
                            <CardContent className="p-4 text-center">
                              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mx-auto mb-2`}>
                                <stat.icon className="w-5 h-5 text-white" />
                              </div>
                              <p className="text-xl font-bold text-stone-800">{stat.value}</p>
                              <p className="text-[10px] text-stone-400 font-medium mt-0.5">{stat.label}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <Card className="border-0 shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-stone-700">Availability Status</p>
                            <p className="text-xs text-stone-400 mt-0.5">Parents can only book when you&apos;re available</p>
                          </div>
                          <Button
                            onClick={handleToggleAvailability}
                            className={`rounded-xl font-semibold text-sm ${
                              currentAvailability === 'available'
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                : 'bg-amber-500 hover:bg-amber-600 text-white'
                            }`}
                          >
                            {currentAvailability === 'available' ? 'Go Offline' : 'Go Online'}
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* SCHEDULE */}
                  {nannyPortalTab === 'schedule' && (
                    <div className="space-y-4">
                      <h3 className="text-base font-bold text-stone-700 flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-orange-500" />
                        Your Sessions
                      </h3>
                      <div className="space-y-2 max-h-[50vh] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d6d3d1 transparent' }}>
                        {myBookings.length === 0 ? (
                          <div className="text-center py-8 text-stone-400">
                            <p className="text-sm">No sessions yet</p>
                          </div>
                        ) : (
                          myBookings.map((booking) => (
                            <Card key={booking.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                              <CardContent className="p-4 flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-50 to-rose-50 flex flex-col items-center justify-center shrink-0 border border-orange-100">
                                  <Clock className="w-4 h-4 text-orange-500" />
                                  <span className="text-[10px] font-bold text-stone-600">
                                    {booking.scheduledAt
                                      ? new Date(booking.scheduledAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
                                      : '—'}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-stone-800 text-sm">{booking.parentName}</p>
                                  <p className="text-xs text-stone-400">
                                    {booking.scheduledAt
                                      ? new Date(booking.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                                      : 'N/A'}
                                    {' · '}
                                    {booking.type === 'instant' ? 'Instant' : 'Scheduled'}
                                  </p>
                                </div>
                                <Badge className={`${
                                  booking.status === 'confirmed' || booking.status === 'in-progress'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : booking.status === 'completed'
                                      ? 'bg-stone-100 text-stone-600'
                                      : 'bg-amber-100 text-amber-700'
                                } border-0 text-xs`}>
                                  {booking.status}
                                </Badge>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* EARNINGS */}
                  {nannyPortalTab === 'earnings' && (
                    <div className="space-y-4">
                      <h3 className="text-base font-bold text-stone-700 flex items-center gap-2">
                        <IndianRupee className="w-4 h-4 text-orange-500" />
                        Earnings
                      </h3>

                      <div className="grid grid-cols-2 gap-3">
                        <Card className="border-0 shadow-sm">
                          <CardContent className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
                            <p className="text-xs text-stone-500 font-medium">Total Earnings</p>
                            <p className="text-2xl font-bold text-stone-800 mt-1">₹{Math.round(totalEarnings).toLocaleString()}</p>
                            <p className="text-[10px] text-stone-400 mt-1">{totalCalls} completed calls</p>
                          </CardContent>
                        </Card>
                        <Card className="border-0 shadow-sm">
                          <CardContent className="p-4 bg-gradient-to-br from-orange-50 to-rose-50 rounded-2xl border border-orange-100">
                            <p className="text-xs text-stone-500 font-medium">Average per Call</p>
                            <p className="text-2xl font-bold text-stone-800 mt-1">
                              ₹{totalCalls > 0 ? Math.round(totalEarnings / totalCalls) : 0}
                            </p>
                            <p className="text-[10px] text-stone-400 mt-1">Per completed session</p>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="space-y-2 max-h-[40vh] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d6d3d1 transparent' }}>
                        {myBookings.filter(b => b.status === 'completed' && b.totalPrice).length === 0 ? (
                          <div className="text-center py-8 text-stone-400">
                            <p className="text-sm">No completed sessions with earnings yet</p>
                          </div>
                        ) : (
                          myBookings
                            .filter(b => b.status === 'completed' && b.totalPrice)
                            .map((booking) => (
                              <Card key={booking.id} className="border-0 shadow-sm">
                                <CardContent className="p-4 flex items-center justify-between">
                                  <div>
                                    <p className="font-semibold text-stone-800 text-sm">{booking.parentName}</p>
                                    <p className="text-xs text-stone-400">
                                      {new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                      {booking.duration ? ` · ${booking.duration} min` : ''}
                                    </p>
                                  </div>
                                  <p className="font-bold text-emerald-600">+₹{Math.round(booking.totalPrice || 0)}</p>
                                </CardContent>
                              </Card>
                            ))
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
