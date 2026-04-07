'use client'

import { Star, Clock, Globe, Lock, Check, Gift } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAppStore, type Nanny } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

interface NannyCardProps {
  nanny: Nanny
}

const statusMap: Record<string, { dot: string; label: string; badge: string }> = {
  available: { dot: 'bg-green-500', label: 'Available', badge: 'bg-green-100 text-green-700 border-green-200' },
  busy: { dot: 'bg-yellow-500', label: 'In Session', badge: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  offline: { dot: 'bg-stone-400', label: 'Offline', badge: 'bg-stone-100 text-stone-500 border-stone-200' },
}

export default function NannyCard({ nanny }: NannyCardProps) {
  const { openBooking, isAuthenticated, openAuth, isTrialActive } = useAppStore()
  const { toast } = useToast()
  const status = statusMap[nanny.availability] || statusMap.offline

  const handleBook = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Login Required',
        description: 'Please login to book a consultation with this expert.',
      })
      openAuth('login')
      return
    }
    openBooking(nanny, 'instant')
  }

  const initials = nanny.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md transition-shadow duration-200 group">
      {/* Image area */}
      <div className="relative h-44 bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden">
        {nanny.avatar ? (
          <img
            src={nanny.avatar}
            alt={nanny.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl font-bold text-amber-400/60">{initials}</span>
          </div>
        )}
        {/* Trial tag */}
        {isTrialActive && (
          <Badge className="absolute top-3 left-3 bg-green-100 text-green-700 border-green-200 text-[10px] font-semibold px-2 py-0.5 gap-1">
            <Gift className="w-3 h-3" />
            Free during trial
          </Badge>
        )}
        {/* Availability dot */}
        <div className="absolute top-3 right-3">
          <Badge className={`${status.badge} text-[11px] font-semibold px-2.5 py-0.5 gap-1.5`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot} ${nanny.availability === 'available' ? 'animate-pulse' : ''}`} />
            {status.label}
          </Badge>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-3">
        <div>
          <h3 className="text-base font-bold text-stone-800">{nanny.name}</h3>
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[11px] font-semibold mt-1">
            {nanny.specialty}
          </Badge>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${
                i < Math.floor(nanny.rating)
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-stone-200 fill-stone-200'
              }`}
            />
          ))}
          <span className="text-sm font-semibold text-stone-700 ml-1">{nanny.rating}</span>
          <span className="text-xs text-stone-400">({nanny.reviewCount})</span>
        </div>

        {/* Details */}
        <div className="flex items-center gap-4 text-xs text-stone-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {nanny.experience}yr exp
          </span>
          <span className="flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" />
            {nanny.languages.split(',')[0].trim()}
          </span>
        </div>

        {/* Book */}
        <div className="flex items-center justify-between pt-3 border-t border-stone-100">
          <span className="text-sm font-medium text-stone-500">Video Consult</span>

          {isAuthenticated ? (
            <Button
              onClick={handleBook}
              disabled={nanny.availability === 'offline'}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl text-sm px-4 py-2 shadow-sm hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {nanny.availability === 'offline' ? 'Unavailable' : (
                <>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Book Now
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleBook}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl text-sm px-4 py-2 shadow-sm hover:from-amber-600 hover:to-orange-600 transition-all"
            >
              <Lock className="w-3.5 h-3.5 mr-1" />
              Login to Book
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
