'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  X,
  Star,
  Phone,
  Video,
  Clock,
  Globe,
  Loader2,
  User,
  CheckCircle2,
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppStore, type Nanny } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

export default function NannySelectionDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const {
    nannies,
    currentUser,
    selectedNanny,
    setSelectedNanny,
    startCall,
  } = useAppStore()

  // Expose open/close for parent components
  useEffect(() => {
    const handler = () => setIsOpen(true)
    window.addEventListener('open-nanny-select', handler)
    return () => window.removeEventListener('open-nanny-select', handler)
  }, [])

  const { toast } = useToast()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [calling, setCalling] = useState(false)

  const availableNannies = nannies.filter(
    (n) => n.availability === 'available'
  )
  const busyNannies = nannies.filter(
    (n) => n.availability === 'busy'
  )

  const handleSelectNanny = (nanny: Nanny) => {
    setSelectedId(nanny.id)
    setSelectedNanny(nanny)
  }

  const handleStartCall = async () => {
    const nanny = nannies.find((n) => n.id === selectedId)
    if (!nanny || !currentUser) return

    setCalling(true)
    try {
      // Create booking
      const bookingRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nannyId: nanny.id,
          parentId: currentUser.id,
          parentName: currentUser.name || '',
          parentEmail: currentUser.email || '',
          type: 'instant',
          notes: '',
        }),
      })
      const bookingJson = await bookingRes.json()
      if (bookingJson.success && bookingJson.data) {
        const savedBooking = bookingJson.data
        // Add to bookings list
        const currentBookings = useAppStore.getState().bookings
        useAppStore.setState({ bookings: [savedBooking, ...currentBookings] })
        // Close dialog
        setIsOpen(false)
        setSelectedId(null)
        // Start the call with 'waiting' status (5-min timer for nanny to accept)
        const apiRoomId = savedBooking.callSession?.roomId
        startCall(savedBooking, apiRoomId)
        toast({
          title: 'Calling ' + nanny.name,
          description: 'Waiting for expert to accept your call...',
        })
      } else {
        toast({
          title: 'Booking Failed',
          description: bookingJson.error || 'Could not create booking.',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Network error. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setCalling(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 p-5 rounded-t-3xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Video className="w-5 h-5" />
                Choose an Expert
              </DialogTitle>
              <DialogDescription className="text-white/80 text-xs mt-1">
                Select an expert to start your free video consultation
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-white/20 text-white border-0 text-xs font-semibold">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Free Trial
              </Badge>
            </div>
          </div>
        </div>

        {/* Nanny List */}
        <ScrollArea className="h-[55vh]">
          <div className="p-4 space-y-3">
            {/* Available nannies */}
            {availableNannies.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">
                    Available Now ({availableNannies.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {availableNannies.map((nanny) => (
                    <NannySelectCard
                      key={nanny.id}
                      nanny={nanny}
                      isSelected={selectedId === nanny.id}
                      onSelect={() => handleSelectNanny(nanny)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Busy nannies */}
            {busyNannies.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 mt-4 px-1">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">
                    Busy ({busyNannies.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {busyNannies.map((nanny) => (
                    <NannySelectCard
                      key={nanny.id}
                      nanny={nanny}
                      isSelected={selectedId === nanny.id}
                      onSelect={() => handleSelectNanny(nanny)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* No nannies */}
            {nannies.length === 0 && (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
                <p className="text-stone-500 text-sm mt-3">Loading experts...</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer with Call button */}
        <div className="border-t border-stone-100 p-4 bg-stone-50/50 rounded-b-3xl">
          <div className="flex items-center justify-between">
            <p className="text-xs text-stone-400">
              {selectedId
                ? `${nannies.find((n) => n.id === selectedId)?.name || 'Expert'} selected`
                : 'Select an expert to call'}
            </p>
            <Button
              onClick={handleStartCall}
              disabled={!selectedId || calling}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 px-6"
            >
              {calling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Video className="w-4 h-4 mr-2" />
                  Start Video Call
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Nanny Card for Selection ───────────────────────────────────────────────

function NannySelectCard({
  nanny,
  isSelected,
  onSelect,
}: {
  nanny: Nanny
  isSelected: boolean
  onSelect: () => void
}) {
  const isAvailable = nanny.availability === 'available'

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
        isSelected
          ? 'border-emerald-400 bg-emerald-50/50 shadow-md'
          : 'border-stone-100 bg-white hover:border-stone-200 hover:shadow-sm'
      }`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-stone-100">
          {nanny.avatar ? (
            <img
              src={nanny.avatar}
              alt={nanny.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
              <User className="w-6 h-6 text-amber-400" />
            </div>
          )}
        </div>
        {/* Availability indicator */}
        <div
          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
            isAvailable ? 'bg-emerald-500' : 'bg-amber-500'
          }`}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-stone-800 text-sm truncate">
            {nanny.name}
          </h3>
          {isSelected && (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          )}
        </div>
        <p className="text-xs text-stone-500 mt-0.5">{nanny.specialty}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-[11px] font-semibold text-stone-600">
              {nanny.rating.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-stone-400" />
            <span className="text-[11px] text-stone-400">
              {nanny.experience} yrs
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Globe className="w-3 h-3 text-stone-400" />
            <span className="text-[11px] text-stone-400 truncate">
              {nanny.languages}
            </span>
          </div>
        </div>
      </div>

      {/* Call icon */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          isSelected
            ? 'bg-emerald-500 text-white'
            : 'bg-stone-100 text-stone-400'
        }`}
      >
        <Phone className="w-4 h-4" />
      </div>
    </motion.button>
  )
}
