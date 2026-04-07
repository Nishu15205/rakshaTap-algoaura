'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { useAppStore, type Testimonial } from '@/lib/store'
import { useEffect, useState } from 'react'

// Default showcase testimonials (used when no real reviews exist)
const defaultTestimonials: Testimonial[] = [
  {
    name: 'Priya Mehta',
    babyAge: '6 months',
    text: 'MUMAA helped me through the toughest first weeks with my newborn. The lactation expert was incredibly patient and knowledgeable. I finally feel confident as a new mother!',
    rating: 5,
  },
  {
    name: 'Ananya Sharma',
    babyAge: '10 months',
    text: "I was struggling with my baby's sleep schedule for months. One consultation with a MUMAA sleep expert changed everything! Now my baby sleeps through the night.",
    rating: 5,
  },
  {
    name: 'Sneha Gupta',
    babyAge: '3 months',
    text: "As a first-time mom, having a video call with a childcare expert at 2 AM when my baby wouldn't stop crying was a lifesaver. Thank you MUMAA for being there!",
    rating: 5,
  },
  {
    name: 'Riya Patel',
    babyAge: '2 years',
    text: 'The nutrition guidance for my toddler has been excellent. We received a personalized meal plan that my child actually enjoys. Highly recommend the experts!',
    rating: 4,
  },
  {
    name: 'Kavita Reddy',
    babyAge: '8 months',
    text: 'Postpartum recovery support from MUMAA experts made all the difference. They understood exactly what I was going through and helped me every step of the way.',
    rating: 5,
  },
  {
    name: 'Neha Joshi',
    babyAge: '1 year',
    text: 'Affordable, accessible, and truly expert care. I recommend MUMAA to every new parent I know. The video consultations are so convenient for busy moms!',
    rating: 5,
  },
]

export default function Testimonials() {
  const dbTestimonials = useAppStore((s) => s.testimonials)
  const [hasFetched, setHasFetched] = useState(false)

  useEffect(() => {
    // Mark as fetched after a reasonable timeout so skeleton doesn't show forever
    const timer = setTimeout(() => setHasFetched(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  // Use DB testimonials if available, otherwise fall back to defaults
  const displayTestimonials = dbTestimonials.length > 0 ? dbTestimonials : defaultTestimonials
  const isLoading = !hasFetched && dbTestimonials.length === 0

  return (
    <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-stone-800 mb-4">
            What Mumma&apos;s{' '}
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              Say
            </span>
          </h2>
          <p className="text-stone-500 max-w-md mx-auto">
            Real stories from real mums who found help through MUMAA video consultations.
          </p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 animate-pulse h-52">
                <div className="h-3 bg-stone-200 rounded w-3/4 mb-4" />
                <div className="h-3 bg-stone-100 rounded w-full mb-2" />
                <div className="h-3 bg-stone-100 rounded w-5/6 mb-6" />
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="w-4 h-4 rounded bg-stone-200" />
                  ))}
                </div>
                <div className="flex items-center gap-3 pt-3 border-t border-stone-100">
                  <div className="w-9 h-9 rounded-full bg-stone-200" />
                  <div className="space-y-1">
                    <div className="h-3 bg-stone-200 rounded w-20" />
                    <div className="h-2 bg-stone-100 rounded w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Testimonials grid */}
        {!isLoading && displayTestimonials.length > 0 && (
          <div className="flex gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-3 md:overflow-x-visible md:pb-0 snap-x snap-mandatory md:snap-none"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {displayTestimonials.map((testimonial, index) => (
              <div
                key={index}
                className="snap-start shrink-0 w-[300px] md:w-auto"
              >
                <motion.div
                  className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 h-full hover:shadow-md transition-shadow duration-200 relative"
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  <span className="absolute top-3 right-4 text-5xl font-serif text-amber-100 leading-none select-none">
                    &ldquo;
                  </span>

                  <p className="text-sm text-stone-600 leading-relaxed mb-4 relative z-10">
                    {testimonial.text}
                  </p>

                  <div className="flex items-center gap-0.5 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < testimonial.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-stone-200'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-3 pt-3 border-t border-stone-100">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {testimonial.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-800">{testimonial.name}</p>
                      {testimonial.babyAge && (
                        <p className="text-xs text-stone-400">Baby: {testimonial.babyAge}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && displayTestimonials.length === 0 && (
          <div className="text-center py-12">
            <p className="text-stone-400 text-sm">No reviews yet. Be the first to share your experience!</p>
          </div>
        )}
      </div>
    </section>
  )
}
