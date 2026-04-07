'use client'

import { useState } from 'react'
import { X, Shield, FileText } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'

// ─── Props ────────────────────────────────────────────────────────────────────

interface LegalPagesProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: string
}

const lastUpdated = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

// ─── Privacy Policy ───────────────────────────────────────────────────────────

function PrivacyPolicy() {
  return (
    <div className="space-y-6 text-stone-600 text-sm leading-relaxed">
      <section>
        <h3 className="text-lg font-bold text-stone-800 mb-3">1. Information We Collect</h3>
        <p className="mb-3">
          At MUMAA, we are committed to protecting your privacy. We collect personal information such as your name, email address, phone number, and baby&apos;s details to provide childcare video consultation services. We also collect usage data, device information, and payment details processed securely through our partners.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-stone-800 mb-3">2. How We Use Your Information</h3>
        <p className="mb-3">
          We use your information to provide and manage video consultations, process payments, send booking confirmations and reminders, improve our platform experience, and comply with legal obligations. We never sell your personal data to third parties.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-stone-800 mb-3">3. Data Storage &amp; Security</h3>
        <p className="mb-3">
          Your data is stored on secure, encrypted servers with industry-standard protection. We implement end-to-end encryption for video consultations and AES-256 encryption for stored data. Regular security audits are performed to ensure your information remains safe.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-stone-800 mb-3">4. Your Rights</h3>
        <p className="mb-3">
          Under applicable data protection laws, you have the right to access, delete, export, and correct your personal data. You may also object to processing of your data for marketing purposes. Contact us at support@mumaa.in to exercise these rights.
        </p>
      </section>

      <p className="text-xs text-stone-400 pt-2">Last updated: {lastUpdated}</p>
    </div>
  )
}

// ─── Terms of Service ────────────────────────────────────────────────────────

function TermsOfService() {
  return (
    <div className="space-y-6 text-stone-600 text-sm leading-relaxed">
      <section>
        <h3 className="text-lg font-bold text-stone-800 mb-3">1. Service Description</h3>
        <p>
          MUMAA provides an online platform connecting parents with certified childcare professionals for video consultations. Services include instant and scheduled video calls, newborn care guidance, sleep training support, lactation consulting, and related parenting services.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-stone-800 mb-3">2. User Eligibility</h3>
        <p className="mb-3">
          You must be at least 18 years of age and a parent, legal guardian, or authorized caregiver to use our platform. You agree to provide accurate registration information and maintain the confidentiality of your account credentials at all times.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-stone-800 mb-3">3. Payment Terms</h3>
        <p className="mb-3">
          All payments are processed in Indian Rupees (INR). Subscription fees are billed at the start of each billing cycle. Scheduled calls cancelled 24+ hours before receive a full refund; 2-24 hours receive 50%; within 2 hours, no refund. Subscriptions have a 7-day cooling period for full refunds.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-stone-800 mb-3">4. Disclaimer</h3>
        <p>
          The advice provided by childcare experts on our platform is for informational purposes only and does not constitute medical advice. Always consult with a qualified healthcare professional for medical concerns related to your child&apos;s health. MUMAA shall not be liable for any indirect or consequential damages.
        </p>
      </section>

      <p className="text-xs text-stone-400 pt-2">Last updated: {lastUpdated}</p>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function LegalPages({ open, onOpenChange, defaultTab = 'privacy' }: LegalPagesProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden p-0 rounded-3xl border-stone-200 bg-white">
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-amber-100 via-orange-100 to-rose-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/40 backdrop-blur-sm flex items-center justify-center">
                <Shield className="w-5 h-5 text-stone-800" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-stone-900">Legal Information</DialogTitle>
                <p className="text-xs text-stone-600">Policies governing your use of MUMAA</p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-lg bg-white/40 hover:bg-white/60 transition-colors flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-stone-800" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-2 bg-stone-100 rounded-xl p-1 h-auto">
              <TabsTrigger
                value="privacy"
                className="rounded-lg py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm transition-all"
              >
                <Shield className="w-3.5 h-3.5" />
                Privacy Policy
              </TabsTrigger>
              <TabsTrigger
                value="terms"
                className="rounded-lg py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm transition-all"
              >
                <FileText className="w-3.5 h-3.5" />
                Terms of Service
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="mt-4 pb-6 max-h-[calc(85vh-160px)]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d6d3d1 transparent' }}>
              <TabsContent value="privacy" className="mt-0 pr-2">
                <PrivacyPolicy />
              </TabsContent>
              <TabsContent value="terms" className="mt-0 pr-2">
                <TermsOfService />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
