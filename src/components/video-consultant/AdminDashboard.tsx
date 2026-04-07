'use client'

import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  X,
  Shield,
  UserPlus,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Activity,
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
  { id: 'users', label: 'Users', icon: Users },
  { id: 'nannies', label: 'Nannies', icon: UserPlus },
  { id: 'payments', label: 'Payments', icon: CreditCard },
]

const statusColor = (status: string) => {
  if (status === 'completed' || status === 'Active' || status === 'approved') return 'bg-emerald-100 text-emerald-700'
  if (status === 'pending') return 'bg-amber-100 text-amber-700'
  if (status === 'failed' || status === 'rejected' || status === 'Inactive') return 'bg-red-100 text-red-600'
  return 'bg-stone-100 text-stone-500'
}

export default function AdminDashboard() {
  const { isAdminDashboardOpen, closeAdminDashboard, adminTab, setAdminTab, currentUser, nannyRegistrations, setNannyRegistrations, nannies, bookings } = useAppStore()
  const { toast } = useToast()

  const [usersCount, setUsersCount] = useState<number>(0)
  const [revenue, setRevenue] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [registrationsLoading, setRegistrationsLoading] = useState(false)

  useEffect(() => {
    if (isAdminDashboardOpen) {
      fetchAdminData()
    }
  }, [isAdminDashboardOpen])

  const fetchAdminData = async () => {
    setLoading(true)
    try {
      const [usersRes, revenueRes, regsRes] = await Promise.all([
        fetch('/api/auth/users-count'),
        fetch('/api/payments/revenue'),
        fetch('/api/nanny-registrations'),
      ])

      const usersJson = await usersRes.json()
      if (usersJson.success) setUsersCount(usersJson.data || 0)

      const revenueJson = await revenueRes.json()
      if (revenueJson.success) setRevenue(revenueJson.data || 0)

      const regsJson = await regsRes.json()
      if (regsJson.success) setNannyRegistrations(regsJson.data || [])
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }

  if (!isAdminDashboardOpen || currentUser?.role !== 'admin') return null

  const handleApprove = async (id: string) => {
    setRegistrationsLoading(true)
    try {
      const res = await fetch(`/api/nanny-registrations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      const json = await res.json()
      if (json.success) {
        toast({ title: 'Approved', description: 'Application approved successfully.' })
        setNannyRegistrations(nannyRegistrations.map(r => r.id === id ? { ...r, status: 'approved' as const } : r))
        // Refresh nannies list
        useAppStore.getState().fetchNannies()
      } else {
        toast({ title: 'Error', description: json.error || 'Failed to approve', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setRegistrationsLoading(false)
    }
  }

  const handleReject = async (id: string) => {
    setRegistrationsLoading(true)
    try {
      const res = await fetch(`/api/nanny-registrations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      })
      const json = await res.json()
      if (json.success) {
        toast({ title: 'Rejected', description: 'Application has been rejected.' })
        setNannyRegistrations(nannyRegistrations.map(r => r.id === id ? { ...r, status: 'rejected' as const } : r))
      } else {
        toast({ title: 'Error', description: json.error || 'Failed to reject', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setRegistrationsLoading(false)
    }
  }

  const activeSubscriptions = 0 // No easy API for this
  const pendingRegistrations = nannyRegistrations.filter(r => r.status === 'pending').length

  const stats = [
    { label: 'Total Users', value: usersCount.toLocaleString(), icon: Users, color: 'from-amber-50 to-orange-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
    { label: 'Active Experts', value: nannies.length.toString(), icon: Activity, color: 'from-emerald-50 to-teal-50', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
    { label: 'Revenue (INR)', value: `₹${revenue.toLocaleString()}`, icon: IndianRupee, color: 'from-orange-50 to-rose-50', iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
    { label: 'Pending Apps', value: pendingRegistrations.toString(), icon: UserPlus, color: 'from-rose-50 to-pink-50', iconBg: 'bg-rose-100', iconColor: 'text-rose-600' },
  ]

  return (
    <Dialog open={isAdminDashboardOpen} onOpenChange={(open) => !open && closeAdminDashboard()}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 p-5 rounded-t-3xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white">Admin Dashboard</DialogTitle>
                <DialogDescription className="text-white/80 text-xs">Manage platform data and users</DialogDescription>
              </div>
            </div>
            <Button onClick={closeAdminDashboard} variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[70vh]">
          {/* Sidebar */}
          <div className="w-48 border-r border-stone-100 bg-stone-50/50 p-3 shrink-0 hidden md:block">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setAdminTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    adminTab === tab.id
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
              <div className="md:hidden mb-5 flex gap-2 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setAdminTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                      adminTab === tab.id
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
                  <span className="ml-3 text-stone-500">Loading data...</span>
                </div>
              ) : (
                <>
                  {/* OVERVIEW */}
                  {adminTab === 'overview' && (
                    <div className="space-y-6">
                      <h3 className="text-base font-bold text-stone-700 flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4 text-orange-500" />
                        Platform Overview
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {stats.map((stat) => (
                          <Card key={stat.label} className="border-0 shadow-sm">
                            <CardContent className={`p-4 bg-gradient-to-br ${stat.color} rounded-2xl`}>
                              <div className={`w-9 h-9 rounded-xl ${stat.iconBg} flex items-center justify-center mb-2`}>
                                <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                              </div>
                              <p className="text-2xl font-bold text-stone-800">{stat.value}</p>
                              <p className="text-xs text-stone-500 mt-0.5">{stat.label}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Recent bookings */}
                      <div>
                        <h3 className="text-sm font-bold text-stone-700 flex items-center gap-2 mb-3">
                          <Activity className="w-4 h-4 text-orange-500" />
                          Recent Bookings
                        </h3>
                        {bookings.length === 0 ? (
                          <div className="text-center py-8 text-stone-400">
                            <p className="text-sm">No bookings yet</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {bookings.slice(0, 10).map((booking) => (
                              <div key={booking.id} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-stone-100 shadow-sm">
                                <div className={`w-2 h-2 rounded-full shrink-0 ${
                                  booking.status === 'completed' ? 'bg-emerald-400' :
                                  booking.status === 'confirmed' ? 'bg-blue-400' :
                                  booking.status === 'cancelled' ? 'bg-red-400' : 'bg-amber-400'
                                }`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-stone-700">{booking.parentName} — {booking.nanny?.name || 'N/A'}</p>
                                  <p className="text-xs text-stone-400">
                                    {new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    {' · '}
                                    {booking.type}
                                  </p>
                                </div>
                                <Badge className={`${statusColor(booking.status)} border-0 text-[10px]`}>
                                  {booking.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* USERS */}
                  {adminTab === 'users' && (
                    <div className="space-y-4">
                      <h3 className="text-base font-bold text-stone-700 flex items-center gap-2">
                        <Users className="w-4 h-4 text-orange-500" />
                        Platform Stats
                      </h3>
                      <Card className="border-0 shadow-sm overflow-hidden">
                        <div className="p-6 text-center">
                          <p className="text-4xl font-bold text-stone-800">{usersCount}</p>
                          <p className="text-sm text-stone-500 mt-1">Total registered users</p>
                          <p className="text-xs text-stone-400 mt-1">{nannies.length} experts · {bookings.length} bookings</p>
                        </div>
                      </Card>
                    </div>
                  )}

                  {/* NANNIES */}
                  {adminTab === 'nannies' && (
                    <div className="space-y-4">
                      <h3 className="text-base font-bold text-stone-700 flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-orange-500" />
                        Nanny Applications
                      </h3>
                      <div className="space-y-2 max-h-[55vh] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d6d3d1 transparent' }}>
                        {nannyRegistrations.length === 0 ? (
                          <div className="text-center py-8 text-stone-400">
                            <p className="text-sm">No applications yet</p>
                          </div>
                        ) : (
                          nannyRegistrations.map((reg) => (
                            <Card key={reg.id} className="border-0 shadow-sm">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-stone-800">{reg.fullName}</p>
                                    <p className="text-xs text-stone-500">{reg.email}</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                      {reg.specialty && (
                                        <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md">{reg.specialty}</span>
                                      )}
                                      {reg.experience && (
                                        <span className="text-xs text-stone-400">{reg.experience} yrs exp</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 ml-3">
                                    <Badge className={`${statusColor(reg.status)} border-0 text-xs`}>{reg.status}</Badge>
                                    {reg.status === 'pending' && (
                                      <div className="flex gap-1">
                                        <Button
                                          size="sm"
                                          onClick={() => handleApprove(reg.id)}
                                          disabled={registrationsLoading}
                                          className="h-7 px-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs rounded-lg"
                                        >
                                          {registrationsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : (
                                            <>
                                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                              Approve
                                            </>
                                          )}
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={() => handleReject(reg.id)}
                                          disabled={registrationsLoading}
                                          variant="outline"
                                          className="h-7 px-2.5 border-red-200 text-red-600 hover:bg-red-50 text-xs rounded-lg"
                                        >
                                          <XCircle className="w-3.5 h-3.5 mr-1" />
                                          Reject
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* PAYMENTS */}
                  {adminTab === 'payments' && (
                    <div className="space-y-4">
                      <h3 className="text-base font-bold text-stone-700 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-orange-500" />
                        Revenue Overview
                      </h3>
                      <Card className="border-0 shadow-sm overflow-hidden">
                        <div className="p-6 text-center">
                          <p className="text-4xl font-bold text-orange-600">₹{revenue.toLocaleString()}</p>
                          <p className="text-sm text-stone-500 mt-1">Total revenue from completed payments</p>
                        </div>
                      </Card>
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
