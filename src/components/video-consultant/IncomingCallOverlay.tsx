'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PhoneIncoming, PhoneOff, Video, Loader2, User } from 'lucide-react'
import { useAppStore, type Nanny } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

// ─── Ringtone generator using Web Audio API (classic phone ring pattern) ──────
function useRingtone() {
  const audioCtxRef = useRef<AudioContext | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const playRingPattern = useCallback(() => {
    const ctx = audioCtxRef.current
    if (!ctx) return
    // Resume AudioContext in case browser suspended it (autoplay policy)
    if (ctx.state === 'suspended') ctx.resume()

    const now = ctx.currentTime
    const gain = ctx.createGain()
    gain.connect(ctx.destination)

    // Classic two-tone ring pattern: Ring (2 tones) → Silence → Ring → Long silence
    // Tone 1: 440Hz (A4) for 0.4s
    const osc1 = ctx.createOscillator()
    osc1.type = 'sine'
    osc1.frequency.value = 440
    osc1.connect(gain)
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.25, now + 0.05)
    gain.gain.setValueAtTime(0.25, now + 0.35)
    gain.gain.linearRampToValueAtTime(0, now + 0.4)
    osc1.start(now)
    osc1.stop(now + 0.4)

    // Tone 2: 523Hz (C5) for 0.4s, starts at 0.5s
    const osc2 = ctx.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.value = 523.25
    osc2.connect(gain)
    gain.gain.setValueAtTime(0, now + 0.5)
    gain.gain.linearRampToValueAtTime(0.25, now + 0.55)
    gain.gain.setValueAtTime(0.25, now + 0.85)
    gain.gain.linearRampToValueAtTime(0, now + 0.9)
    osc2.start(now + 0.5)
    osc2.stop(now + 0.9)

    // Tone 3: 440Hz again for 0.4s, starts at 1.0s
    const osc3 = ctx.createOscillator()
    osc3.type = 'sine'
    osc3.frequency.value = 440
    osc3.connect(gain)
    gain.gain.setValueAtTime(0, now + 1.0)
    gain.gain.linearRampToValueAtTime(0.25, now + 1.05)
    gain.gain.setValueAtTime(0.25, now + 1.35)
    gain.gain.linearRampToValueAtTime(0, now + 1.4)
    osc3.start(now + 1.0)
    osc3.stop(now + 1.4)
  }, [])

  const startRingtone = useCallback(() => {
    if (audioCtxRef.current) return
    try {
      audioCtxRef.current = new AudioContext()
      // Play immediately
      playRingPattern()
      // Repeat every 3 seconds (ring pattern is ~1.4s + 1.6s silence)
      intervalRef.current = setInterval(playRingPattern, 3000)
    } catch {
      // AudioContext not available — silent fallback
    }
  }, [playRingPattern])

  const stopRingtone = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => { stopRingtone() }
  }, [stopRingtone])

  return { startRingtone, stopRingtone }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function IncomingCallOverlay() {
  const { currentUser, nannies, fetchNannies, acceptCall, isInCall } = useAppStore()
  const { toast } = useToast()
  const { startRingtone, stopRingtone } = useRingtone()

  const [incomingCall, setIncomingCall] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const ringtoneStartedRef = useRef(false)

  // Find the nanny profile for the current user
  const nannyProfile: Nanny | undefined = (() => {
    if (!currentUser || currentUser.role !== 'nanny') return undefined
    return nannies.find(
      (n) => n.name === currentUser.name || n.specialty === currentUser.specialty
    )
  })()

  // ─── Poll for incoming calls ─────────────────────────────────────────────
  useEffect(() => {
    // Only poll if user is a nanny and not already in a call
    if (!currentUser || currentUser.role !== 'nanny' || isInCall) {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
      stopRingtone()
      setIncomingCall(null)
      ringtoneStartedRef.current = false
      return
    }

    const pollPendingCalls = async () => {
      try {
        // Find nanny profile
        const profile = nannies.find(
          (n) => n.name === currentUser.name || n.specialty === currentUser.specialty
        )
        if (!profile) {
          // Try fetching nannies if empty
          const res = await fetch('/api/nannies')
          if (res.ok) {
            const json = await res.json()
            if (json.success && json.data) {
              useAppStore.setState({ nannies: json.data })
              // Retry after fetch
              const updatedProfile = json.data.find(
                (n: Nanny) => n.name === currentUser.name || n.specialty === currentUser.specialty
              )
              if (!updatedProfile) return
              const callRes = await fetch(`/api/calls/pending?nannyId=${updatedProfile.id}`)
              if (!callRes.ok) return
              const callJson = await callRes.json()
              if (callJson.success && callJson.data && callJson.data.length > 0) {
                const latest = callJson.data[0]
                if (!incomingCall || incomingCall.id !== latest.id) {
                  setIncomingCall(latest)
                }
              }
            }
          }
          return
        }

        const res = await fetch(`/api/calls/pending?nannyId=${profile.id}`)
        if (!res.ok) return
        const json = await res.json()
        if (json.success && json.data && json.data.length > 0) {
          const latest = json.data[0]
          setIncomingCall((prev: any) => {
            if (!prev || prev.id !== latest.id) {
              return latest
            }
            return prev
          })
        } else {
          setIncomingCall(null)
        }
      } catch {
        // Ignore polling errors
      }
    }

    // Initial check
    pollPendingCalls()
    // Poll every 2.5 seconds
    pollRef.current = setInterval(pollPendingCalls, 2500)

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [currentUser, isInCall, nannies])

  // ─── Start/stop ringtone based on incoming call ─────────────────────────
  useEffect(() => {
    if (incomingCall && !isInCall && !ringtoneStartedRef.current) {
      startRingtone()
      ringtoneStartedRef.current = true
    }
    if (!incomingCall || isInCall) {
      stopRingtone()
      ringtoneStartedRef.current = false
    }
  }, [incomingCall, isInCall, startRingtone, stopRingtone])

  // ─── Accept call handler ─────────────────────────────────────────────────
  const handleAccept = useCallback(async () => {
    if (!incomingCall?.callSession?.id) return
    setLoading(true)
    stopRingtone()
    ringtoneStartedRef.current = false

    try {
      // 1. Update call session to 'active' via API
      const res = await fetch(`/api/calls/${incomingCall.callSession.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' }),
      })
      const json = await res.json()

      if (json.success) {
        toast({ title: 'Call Accepted', description: 'Connecting to parent...' })
        // 2. Clear the incoming call state
        setIncomingCall(null)
        // 3. Start the call as nanny (join the video call)
        const bookingWithNanny = {
          ...incomingCall,
          nanny: nannyProfile,
          callSession: { ...incomingCall.callSession, status: 'active' },
        }
        acceptCall()
      } else {
        toast({ title: 'Error', description: json.error || 'Could not accept call.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error. Could not accept call.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [incomingCall, nannyProfile, acceptCall, stopRingtone, toast])

  // ─── Reject call handler ─────────────────────────────────────────────────
  const handleReject = useCallback(async () => {
    if (!incomingCall?.callSession?.id) return
    setLoading(true)
    stopRingtone()
    ringtoneStartedRef.current = false

    try {
      const res = await fetch(`/api/calls/${incomingCall.callSession.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      })
      const json = await res.json()
      if (json.success) {
        toast({ title: 'Call Declined', description: 'You declined the call.' })
      } else {
        toast({ title: 'Error', description: json.error || 'Could not decline call.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error.', variant: 'destructive' })
    } finally {
      setIncomingCall(null)
      setLoading(false)
    }
  }, [incomingCall, stopRingtone, toast])

  // Don't render if no incoming call, user is not nanny, or already in call
  if (!incomingCall || currentUser?.role !== 'nanny' || isInCall) return null

  const parentName = incomingCall.parentName || 'Parent'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-950 to-black" />

        {/* Animated rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute w-48 h-48 rounded-full border-2 border-emerald-400/30 animate-ping" style={{ animationDuration: '1.5s' }} />
          <div className="absolute w-64 h-64 rounded-full border border-emerald-400/15 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
          <div className="absolute w-80 h-80 rounded-full border border-emerald-400/8 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.6s' }} />
        </div>

        {/* Content */}
        <motion.div
          initial={{ scale: 0.8, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative z-10 flex flex-col items-center text-center px-6 max-w-md"
        >
          {/* Avatar */}
          <div className="relative mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-400/30 animate-ping" style={{ animationDuration: '1.2s' }} />
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30 relative z-10 overflow-hidden">
              {incomingCall.nanny?.avatar ? (
                <img src={incomingCall.nanny.avatar} alt={parentName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-14 h-14 text-white" />
              )}
            </div>
            {/* Video call badge */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-lg flex items-center gap-1.5">
              <Video className="w-3 h-3" />
              Video Call
            </div>
          </div>

          {/* Info */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white text-3xl font-bold mb-2"
          >
            Incoming Video Call
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-white/60 text-base mb-1"
          >
            from <span className="text-white font-semibold">{parentName}</span>
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-emerald-400/80 text-sm font-medium mb-1"
          >
            MUMAA Video Consultation
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-1.5 mb-10"
          >
            <PhoneIncoming className="w-4 h-4 text-emerald-400 animate-bounce" />
            <span className="text-white/40 text-xs">Ringing...</span>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-10"
          >
            {/* Reject */}
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={handleReject}
                disabled={loading}
                className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all shadow-xl shadow-red-500/40 hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <PhoneOff className="w-9 h-9 text-white" />
              </button>
              <span className="text-white/50 text-xs font-medium">Decline</span>
            </div>

            {/* Accept */}
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={handleAccept}
                disabled={loading}
                className="w-24 h-24 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center transition-all shadow-2xl shadow-emerald-500/50 hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-11 h-11 text-white animate-spin" />
                ) : (
                  <Video className="w-11 h-11 text-white" />
                )}
              </button>
              <span className="text-emerald-400 text-xs font-bold">Accept</span>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
