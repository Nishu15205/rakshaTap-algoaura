'use client'

import React, { Component, ReactNode } from 'react'
import { useSyncExternalStore } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import Navbar from '@/components/video-consultant/Navbar'
import HeroSection from '@/components/video-consultant/HeroSection'
import HowItWorks from '@/components/video-consultant/HowItWorks'
import NannyGrid from '@/components/video-consultant/NannyGrid'
import CallTypeSection from '@/components/video-consultant/CallTypeSection'
import MyBookingsSection from '@/components/video-consultant/MyBookingsSection'
import BookingDialog from '@/components/video-consultant/BookingDialog'
import VideoCallInterface from '@/components/video-consultant/VideoCallInterface'
import Testimonials from '@/components/video-consultant/Testimonials'
import AuthDialog from '@/components/video-consultant/AuthDialog'
import ProfileDialog from '@/components/video-consultant/ProfileDialog'
import PaymentDialog from '@/components/video-consultant/PaymentDialog'
import AdminDashboard from '@/components/video-consultant/AdminDashboard'
import NannyPortal from '@/components/video-consultant/NannyPortal'
import NannyRegistration from '@/components/video-consultant/NannyRegistration'
import CookieConsent from '@/components/video-consultant/CookieConsent'

const emptySubscribe = () => () => {}

function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

interface EBState { hasError: boolean; error: Error | null }

class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  constructor(p: { children: ReactNode }) { super(p); this.state = { hasError: false, error: null } }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error } }
  componentDidCatch(error: Error, info: React.ErrorInfo) { console.error('[MUMAA]', error, info.componentStack) }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#FFF8F3' }}>
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-stone-800 mb-2">Something went wrong</h2>
            <p className="text-stone-500 text-sm mb-1">{this.state.error?.message}</p>
            <button onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm shadow-lg">
              Refresh Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function AppContent() {
  const mounted = useMounted()
  const callSessionId = useAppStore((s) => s.callSession?.id)

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FFF8F3' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center animate-pulse">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <p className="text-stone-400 text-sm font-semibold">Loading MUMAA...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <AnimatePresence>
        <VideoCallInterface key={callSessionId || 'no-call'} />
      </AnimatePresence>
      <div className="min-h-screen flex flex-col" style={{ background: '#FFF8F3' }}>
        <Navbar />
        <main className="flex-1">
          <HeroSection />
          <HowItWorks />
          <NannyGrid />
          <CallTypeSection />
          <MyBookingsSection />
          <Testimonials />
        </main>
        <BookingDialog />
        <AuthDialog />
        <ProfileDialog />
        <PaymentDialog />
        <AdminDashboard />
        <NannyPortal />
        <NannyRegistration />
        <CookieConsent />
      </div>
    </>
  )
}

export default function Home() {
  return <ErrorBoundary><AppContent /></ErrorBoundary>
}
