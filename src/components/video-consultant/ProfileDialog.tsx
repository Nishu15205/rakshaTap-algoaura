'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Baby,
  AlertCircle,
  CreditCard,
  LogOut,
  Save,
  Pencil,
  X,
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

const roleColors: Record<string, string> = {
  parent: 'bg-rose-100 text-rose-700',
  nanny: 'bg-green-100 text-green-700',
  admin: 'bg-amber-100 text-amber-700',
}

export default function ProfileDialog() {
  const {
    isProfileOpen,
    closeProfile,
    currentUser,
    updateProfile,
    logout,
    openPayment,
    isTrialActive,
    getTrialDaysRemaining,
  } = useAppStore()
  const { toast } = useToast()

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const form = useMemo(() => ({
    phone: currentUser?.phone || '',
    address: currentUser?.address || '',
    babyAge: currentUser?.babyAge || '',
    emergencyContact: currentUser?.emergencyContact || '',
  }), [currentUser])
  const [draft, setDraft] = useState(form)

  useEffect(() => {
    if (!currentUser) return
    let cancelled = false
    Promise.resolve().then(() => {
      if (!cancelled) {
        setDraft({
          phone: currentUser.phone || '',
          address: currentUser.address || '',
          babyAge: currentUser.babyAge || '',
          emergencyContact: currentUser.emergencyContact || '',
        })
      }
    })
    return () => { cancelled = true }
  }, [currentUser])

  const startEditing = () => {
    setDraft(form)
    setEditing(true)
  }

  if (!currentUser) return null

  const trialDaysLeft = getTrialDaysRemaining()
  // Triple-redundant trial check matching BookingDialog
  const isOnTrial = isTrialActive
    || currentUser?.subscriptionStatus === 'trial'
    || (currentUser?.trialStartDate ? (Math.floor((Date.now() - new Date(currentUser.trialStartDate).getTime()) / (1000 * 60 * 60 * 24)) < 30) : false)
  const initials = currentUser.name.split(' ').map((n) => n[0]).join('').toUpperCase()

  const handleSave = async () => {
    setSaving(true)
    const success = await updateProfile(draft)
    setSaving(false)
    if (success) {
      setEditing(false)
      toast({ title: 'Profile Updated', description: 'Changes saved successfully.' })
    } else {
      toast({ title: 'Error', description: 'Failed to save profile. Please try again.', variant: 'destructive' })
    }
  }

  const handleLogout = () => {
    logout()
    closeProfile()
    toast({ title: 'Logged Out' })
  }

  return (
    <Dialog open={isProfileOpen} onOpenChange={(open) => !open && closeProfile()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden rounded-2xl p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 rounded-t-2xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center overflow-hidden shrink-0">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-lg font-bold">{initials}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-lg font-bold text-white truncate">{currentUser.name}</DialogTitle>
                <Badge className={`${roleColors[currentUser.role] || 'bg-stone-200 text-stone-600'} text-[10px] px-1.5 py-0`}>
                  {currentUser.role}
                </Badge>
              </div>
              <DialogDescription className="text-white/80 text-sm mt-0.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                {currentUser.email}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="max-h-[55vh]">
          <div className="p-5 space-y-5">
            {/* Personal Info */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-stone-800">Personal Information</h4>
                <button
                  onClick={() => editing ? setEditing(false) : startEditing()}
                  className={`p-1.5 rounded-lg transition-colors ${editing ? 'bg-stone-100 text-stone-500' : 'bg-orange-50 text-orange-500 hover:bg-orange-100'}`}
                >
                  {editing ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Phone</Label>
                  {editing ? (
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input
                        value={draft.phone}
                        onChange={(e) => setDraft(p => ({ ...p, phone: e.target.value }))}
                        placeholder="+91 XXXXX XXXXX"
                        className="pl-10 rounded-xl border-stone-200"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-stone-700 mt-0.5">{currentUser.phone || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Address</Label>
                  {editing ? (
                    <div className="relative mt-1">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input
                        value={draft.address}
                        onChange={(e) => setDraft(p => ({ ...p, address: e.target.value }))}
                        placeholder="City, State"
                        className="pl-10 rounded-xl border-stone-200"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-stone-700 mt-0.5">{currentUser.address || 'Not set'}</p>
                  )}
                </div>

                {currentUser.role === 'parent' && (
                  <>
                    <div>
                      <Label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Baby&apos;s Age</Label>
                      {editing ? (
                        <div className="relative mt-1">
                          <Baby className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                          <Input
                            value={draft.babyAge}
                            onChange={(e) => setDraft(p => ({ ...p, babyAge: e.target.value }))}
                            placeholder="e.g. 6 months"
                            className="pl-10 rounded-xl border-stone-200"
                          />
                        </div>
                      ) : (
                        <p className="text-sm text-stone-700 mt-0.5">{currentUser.babyAge || 'Not set'}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Emergency Contact</Label>
                      {editing ? (
                        <div className="relative mt-1">
                          <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                          <Input
                            value={draft.emergencyContact}
                            onChange={(e) => setDraft(p => ({ ...p, emergencyContact: e.target.value }))}
                            placeholder="+91 XXXXX XXXXX"
                            className="pl-10 rounded-xl border-stone-200"
                          />
                        </div>
                      ) : (
                        <p className="text-sm text-stone-700 mt-0.5">{currentUser.emergencyContact || 'Not set'}</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Subscription Info */}
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
              <h4 className="text-sm font-bold text-stone-800 mb-3">Subscription</h4>
              <div className="space-y-2">
                {isOnTrial && (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Status</span>
                    <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0">
                      Free Trial — {trialDaysLeft} day{trialDaysLeft === 1 ? '' : 's'} remaining
                    </Badge>
                  </div>
                )}
                {!isOnTrial && currentUser.subscriptionStatus === 'active' && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-500">Current Plan</span>
                      <Badge className={`${
                        currentUser.subscriptionPlan === 'premium'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-green-100 text-green-700'
                      } text-[10px] px-1.5 py-0`}>
                        {currentUser.subscriptionPlan === 'premium' ? 'Premium Plan — ₹599/month' : 'Standard Plan — ₹299/month'}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-500">Status</span>
                      <Badge className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0">
                        Active
                      </Badge>
                    </div>
                  </>
                )}
                {!isOnTrial && currentUser.subscriptionStatus !== 'active' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Status</span>
                    <Badge className="bg-stone-200 text-stone-500 text-[10px] px-1.5 py-0">
                      No active plan
                    </Badge>
                  </div>
                )}
              </div>
              {/* Only show Subscribe when trial has EXPIRED (had trial but it's over) */}
              {!isOnTrial && currentUser.subscriptionStatus !== 'active' && currentUser.trialStartDate && (
                <Button
                  onClick={() => { closeProfile(); openPayment() }}
                  className="w-full mt-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all text-sm"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Subscribe Now
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-stone-100 bg-stone-50/50 rounded-b-2xl">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="text-red-500 hover:text-red-600 hover:bg-red-50 font-semibold rounded-xl"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
          {editing ? (
            <div className="flex gap-2">
              <Button
                onClick={() => setEditing(false)}
                variant="ghost"
                className="rounded-xl text-stone-500 font-semibold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
