'use client'

import { motion } from 'framer-motion'
import { Phone, Search, Gift, Users, Star, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'

export default function HeroSection() {
  const startFreeTrialCall = useAppStore((s) => s.startFreeTrialCall)

  const scrollToExperts = () => {
    document.getElementById('experts')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      id="home"
      className="relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #FFFBEB 0%, #FFF7ED 40%, #FFF1F2 100%)',
      }}
    >
      {/* Soft decorative blobs */}
      <div className="absolute top-20 -left-20 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-10 -right-20 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 lg:pt-28 lg:pb-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: text content */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 border border-amber-200">
              <Gift className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-700">1 Month Free Trial</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.1] text-stone-800">
              Expert Video Consultations for{' '}
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                New Parents
              </span>
            </h1>

            <p className="text-lg text-stone-500 max-w-lg leading-relaxed">
              Get unlimited expert video consultations free for 30 days. Connect with certified childcare specialists for personalized guidance.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => startFreeTrialCall()}
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-orange-600 hover:shadow-xl transition-all px-6 py-5"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Start Free Trial
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={scrollToExperts}
                  variant="outline"
                  size="lg"
                  className="border-stone-300 text-stone-700 font-semibold rounded-xl hover:bg-stone-50 transition-all px-6 py-5"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Browse Experts
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Right: illustration card */}
          <motion.div
            className="flex justify-center lg:justify-end"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative w-full max-w-md">
              <div className="rounded-2xl bg-white shadow-lg border border-stone-100 p-8 overflow-hidden">
                {/* Simple baby/parent SVG illustration */}
                <svg viewBox="0 0 320 280" fill="none" className="w-full" aria-label="Parent holding baby illustration">
                  <circle cx="160" cy="140" r="120" fill="#FFF7ED" />
                  <circle cx="160" cy="140" r="80" fill="#FEF3C7" opacity="0.5" />

                  <circle cx="130" cy="100" r="32" fill="#FBBF24" opacity="0.8" />
                  <ellipse cx="130" cy="175" rx="40" ry="55" fill="#F59E0B" opacity="0.7" />

                  <circle cx="210" cy="130" r="22" fill="#FCD34D" opacity="0.9" />
                  <circle cx="204" cy="125" r="2.5" fill="#92400E" />
                  <circle cx="216" cy="125" r="2.5" fill="#92400E" />
                  <path d="M205 134 Q210 139 215 134" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                  <ellipse cx="210" cy="162" rx="20" ry="28" fill="#FDE68A" opacity="0.8" />

                  <path d="M160 155 Q185 140 195 155" stroke="#F59E0B" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.7" />
                  <path d="M100 155 Q80 135 90 120" stroke="#F59E0B" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.7" />

                  <path d="M255 60 Q255 52 262 52 Q269 52 269 60 Q269 52 276 52 Q283 52 283 60 Q283 72 269 82 Q255 72 255 60Z" fill="#FB923C" opacity="0.4" />
                  <path d="M55 80 Q55 74 60 74 Q65 74 65 80 Q65 74 70 74 Q75 74 75 80 Q75 88 65 96 Q55 88 55 80Z" fill="#FB923C" opacity="0.3" />

                  <circle cx="270" cy="180" r="3" fill="#FBBF24" opacity="0.5" />
                  <circle cx="45" cy="150" r="2" fill="#FBBF24" opacity="0.4" />
                  <circle cx="100" cy="60" r="2.5" fill="#FBBF24" opacity="0.3" />
                </svg>

                {/* Mini stat cards inside illustration card */}
                <div className="flex justify-center gap-3 mt-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-100">
                    <Users className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-700">Trusted by parents</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-100">
                    <Star className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-xs font-semibold text-orange-600">Top rated experts</span>
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -top-3 -right-3 bg-white rounded-xl px-3 py-2 shadow-md border border-stone-100 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-800">Live Now</p>
                  <p className="text-[10px] text-stone-400">Experts available</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Trust bar */}
        <motion.div
          className="mt-16 pt-10 border-t border-stone-200/60"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex flex-wrap justify-center gap-8 sm:gap-16">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-stone-800">5000+</p>
              <p className="text-sm text-stone-500 mt-0.5">Parents Helped</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-stone-800">200+</p>
              <p className="text-sm text-stone-500 mt-0.5">Experts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-stone-800">4.9★</p>
              <p className="text-sm text-stone-500 mt-0.5">Rating</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
