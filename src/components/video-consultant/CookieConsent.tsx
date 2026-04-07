'use client'

import { useState, useEffect } from 'react'
import { Cookie, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

const CONSENT_KEY = 'mumaa-cookie-consent'

function loadConsent(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(CONSENT_KEY) === 'accepted'
  } catch {
    return false
  }
}

function saveConsent(accepted: boolean) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CONSENT_KEY, accepted ? 'accepted' : 'declined')
  } catch {
    // ignore
  }
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = loadConsent()
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    saveConsent(true)
    setVisible(false)
  }

  const handleDecline = () => {
    saveConsent(false)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6 transition-all duration-500 ease-out"
      style={{
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        opacity: visible ? 1 : 0,
      }}
    >
      <div className="max-w-2xl mx-auto rounded-2xl border border-stone-200 bg-white shadow-2xl shadow-stone-300/30 overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shrink-0 mt-0.5">
              <Cookie className="w-5 h-5 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-stone-800 mb-1">We use cookies</h3>
              <p className="text-sm text-stone-500 leading-relaxed">
                We use cookies to improve your experience on our platform. By continuing, you agree to our cookie policy.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <Button
                  onClick={handleAccept}
                  className="bg-gradient-to-r from-orange-500 to-rose-500 text-white font-bold shadow-md rounded-xl text-sm px-5 py-2.5 hover:from-orange-600 hover:to-rose-600 transition-colors"
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  Accept
                </Button>
                <Button
                  onClick={handleDecline}
                  variant="outline"
                  className="rounded-xl text-sm px-5 py-2.5 border-stone-200 text-stone-600 hover:bg-stone-50 font-medium transition-colors"
                >
                  Decline
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
