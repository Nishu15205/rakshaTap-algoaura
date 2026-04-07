'use client'

import { motion } from 'framer-motion'
import { Phone, CalendarCheck, Video, Clock, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'

export default function CallTypeSection() {
  const openBooking = useAppStore((s) => s.openBooking)

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 mb-4 font-semibold">
            <Video className="w-3.5 h-3.5 mr-1" />
            Video Consultation
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-stone-800 mb-4">
            Choose Your Consultation{' '}
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              Type
            </span>
          </h2>
          <p className="text-stone-500 max-w-lg mx-auto">
            Get expert parenting help the way that works best for you.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Instant Call */}
          <motion.div
            className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm hover:shadow-md transition-shadow"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                <Phone className="w-6 h-6 text-orange-500" />
              </div>
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                Popular
              </Badge>
            </div>
            <h3 className="text-lg font-bold text-stone-800 mb-1">Instant Call</h3>
            <p className="text-sm text-stone-500 mb-4 leading-relaxed">
              Get Immediate Help
            </p>
            <p className="text-sm text-stone-400 mb-6 leading-relaxed">
              Connect with an available expert within minutes.
            </p>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1.5 text-xs text-stone-500">
                <Clock className="w-3.5 h-3.5" />
                <span>Connect in seconds</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-stone-500">
                <Phone className="w-3.5 h-3.5" />
                <span>24/7 Available</span>
              </div>
            </div>
            <div className="text-sm font-semibold text-green-600 mb-4">
              Free during trial
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => openBooking(undefined, 'instant')}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all"
              >
                Start Now
              </Button>
            </motion.div>
          </motion.div>

          {/* Scheduled Call */}
          <motion.div
            className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm hover:shadow-md transition-shadow"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                <CalendarCheck className="w-6 h-6 text-orange-500" />
              </div>
              <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">
                Flexible
              </Badge>
            </div>
            <h3 className="text-lg font-bold text-stone-800 mb-1">Scheduled Call</h3>
            <p className="text-sm text-stone-500 mb-4 leading-relaxed">
              Plan Your Session
            </p>
            <p className="text-sm text-stone-400 mb-6 leading-relaxed">
              Book a future session at your convenience.
            </p>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1.5 text-xs text-stone-500">
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>Plan ahead</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-stone-500">
                <Clock className="w-3.5 h-3.5" />
                <span>Reminders sent</span>
              </div>
            </div>
            <div className="text-sm font-semibold text-green-600 mb-4">
              Free during trial
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => openBooking(undefined, 'scheduled')}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all"
              >
                Schedule
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom note */}
        <div className="max-w-2xl mx-auto mt-8">
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shrink-0">
              <Gift className="w-4 h-4 text-white" />
            </div>
            <p className="text-sm text-stone-600">
              <span className="font-semibold text-stone-800">Start your free 30-day trial</span> — no credit card required
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
