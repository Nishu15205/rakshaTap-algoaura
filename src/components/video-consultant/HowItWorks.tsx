'use client'

import { motion } from 'framer-motion'
import { Search, CalendarCheck, Video } from 'lucide-react'

const steps = [
  {
    icon: Search,
    title: 'Choose Expert',
    description: 'Browse our verified childcare specialists and find the right match for your needs.',
    iconBg: 'bg-gradient-to-br from-amber-400 to-amber-500',
    iconRing: 'ring-amber-100',
  },
  {
    icon: CalendarCheck,
    title: 'Book a Call',
    description: 'Schedule instant or planned video sessions at a time that works for you.',
    iconBg: 'bg-gradient-to-br from-orange-400 to-orange-500',
    iconRing: 'ring-orange-100',
  },
  {
    icon: Video,
    title: 'Get Expert Help',
    description: 'Get personalized guidance for your baby through face-to-face video consultations.',
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500',
    iconRing: 'ring-amber-100',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-800 mb-3">
            How It Works
          </h2>
          <p className="text-stone-500 max-w-md mx-auto">
            Three simple steps to connect with a childcare expert.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 hover:shadow-md transition-all duration-200 text-center group"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              whileHover={{ y: -8 }}
            >
              <motion.div
                className={`w-14 h-14 rounded-2xl ${step.iconBg} flex items-center justify-center mx-auto mb-5 ring-4 ${step.iconRing} transition-transform duration-200`}
                whileHover={{ scale: 1.1 }}
              >
                <step.icon className="w-7 h-7 text-white" />
              </motion.div>

              <div className="text-xs font-bold text-amber-500 mb-2">Step {i + 1}</div>

              <h3 className="text-lg font-bold text-stone-800 mb-2">{step.title}</h3>
              <p className="text-sm text-stone-500 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
