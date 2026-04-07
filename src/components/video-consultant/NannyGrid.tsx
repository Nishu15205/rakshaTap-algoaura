'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Users, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import NannyCard from './NannyCard'
import { useAppStore } from '@/lib/store'

const filters = [
  'All',
  'Newborn Care',
  'Sleep Training',
  'Lactation',
  'Nutrition',
  'Development',
]

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-stone-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-stone-200 rounded w-24" />
          <div className="h-3 bg-stone-100 rounded w-32" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-stone-100 rounded w-full" />
        <div className="h-3 bg-stone-100 rounded w-3/4" />
      </div>
      <div className="flex gap-2 mb-4">
        <div className="h-6 bg-stone-100 rounded-full w-16" />
        <div className="h-6 bg-stone-100 rounded-full w-20" />
      </div>
      <div className="h-9 bg-stone-200 rounded-xl w-full" />
    </div>
  )
}

export default function NannyGrid() {
  const nannies = useAppStore((s) => s.nannies)
  const activeFilter = useAppStore((s) => s.activeFilter)
  const setActiveFilter = useAppStore((s) => s.setActiveFilter)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    let list = nannies

    if (activeFilter !== 'All') {
      list = list.filter((n) => {
        const s = n.specialty.toLowerCase()
        const f = activeFilter.toLowerCase()
        if (f === 'nutrition') return s.includes('nutrition') || s.includes('toddler')
        if (f === 'development') return s.includes('development')
        if (f === 'lactation') return s.includes('lactation')
        return s.includes(f)
      })
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (n) =>
          n.name.toLowerCase().includes(q) ||
          n.specialty.toLowerCase().includes(q) ||
          n.languages.toLowerCase().includes(q) ||
          n.bio.toLowerCase().includes(q)
      )
    }

    return list
  }, [nannies, activeFilter, search])

  const isLoading = nannies.length === 0

  return (
    <section id="experts" className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: '#FFF8F3' }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-800 mb-3">
            Our Experts
          </h2>
          <p className="text-stone-500 max-w-md mx-auto mb-2">
            Certified childcare specialists ready to help you.
          </p>
          <p className="text-sm text-stone-400">
            <span className="inline-flex items-center gap-1.5 font-medium text-amber-600">
              <Users className="w-4 h-4" />
              {!isLoading && `${filtered.length} expert${filtered.length !== 1 ? 's' : ''} available`}
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            </span>
          </p>
        </div>

        {/* Search input */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              placeholder="Search by name, specialty, language..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl border-stone-200 bg-white focus:border-amber-400 focus:ring-amber-400/20 h-11"
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeFilter === filter
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                  : 'bg-white text-stone-600 border border-stone-200 hover:border-amber-300 hover:text-amber-600'
              }`}
            >
              {activeFilter === filter && (
                <motion.div
                  layoutId="activeFilterTab"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  style={{ zIndex: -1 }}
                />
              )}
              <span className="relative z-10">{filter}</span>
            </button>
          ))}
        </div>

        {/* Loading skeletons */}
        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Grid */}
        {!isLoading && filtered.length > 0 ? (
          <motion.div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" layout>
            <AnimatePresence mode="popLayout">
              {filtered.map((nanny) => (
                <motion.div
                  key={nanny.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <NannyCard nanny={nanny} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : !isLoading && (
          <div className="text-center py-16">
            <p className="text-stone-400 font-medium mb-2">No experts found</p>
            <button
              onClick={() => { setActiveFilter('All'); setSearch('') }}
              className="text-amber-600 text-sm font-semibold hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
