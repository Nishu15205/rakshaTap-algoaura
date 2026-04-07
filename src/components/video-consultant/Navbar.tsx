'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  Bell,
  Heart,
  LogIn,
  LogOut,
  User,
  Shield,
  LayoutDashboard,
  Stethoscope,
  ChevronDown,
  UserPlus,
  Phone,
  Gift,
  Zap,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const store = useAppStore()

  const {
    openBooking,
    isAuthenticated,
    currentUser,
    openAuth,
    openProfile,
    logout,
    openAdminDashboard,
    openNannyPortal,
    openPayment,
    openNannyReg,
    isTrialActive,
    getTrialDaysRemaining,
  } = store

  const hasSubscription = currentUser?.subscriptionStatus === 'active'
  // Triple-redundant trial check
  const isOnTrial = isTrialActive
    || currentUser?.subscriptionStatus === 'trial'
    || (currentUser?.trialStartDate ? (Math.floor((Date.now() - new Date(currentUser.trialStartDate).getTime()) / (1000 * 60 * 60 * 24)) < 30) : false)
  const trialDaysLeft = getTrialDaysRemaining()

  useEffect(() => {
    // Check existing session on mount
    fetch('/api/auth/me').then(res => res.json()).then(json => {
      if (json.success && json.data) {
        const user = json.data
        // Compute trial state BEFORE setState to avoid race condition
        let trialStartDate: string | null = null
        let trialActive = false

        if (user.trialStartDate) {
          const start = new Date(user.trialStartDate)
          const daysPassed = Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24))
          trialStartDate = user.trialStartDate
          trialActive = daysPassed < 30
        } else if (
          user.role === 'parent' &&
          (!user.subscriptionStatus || user.subscriptionStatus === 'none')
        ) {
          // No trial + no subscription → auto-activate 30-day free trial
          trialStartDate = new Date().toISOString()
          trialActive = true
          // Save to DB so it persists across refreshes
          fetch('/api/auth/me', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trialStartDate, subscriptionStatus: 'trial' }),
          }).catch(() => {})
        }

        // Single setState call — no intermediate render with isTrialActive=false
        useAppStore.setState({
          currentUser: { ...user, trialStartDate: user.trialStartDate || trialStartDate },
          isAuthenticated: true,
          isAdminView: user.role === 'admin',
          trialStartDate,
          isTrialActive: trialActive,
        })
        const s = useAppStore.getState()
        s.fetchBookings()
        s.fetchNotifications()
      }
    }).catch(() => {})

    // Fetch public data
    useAppStore.getState().fetchNannies()
    useAppStore.getState().fetchTestimonials()
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const getInitial = (name: string) => name.charAt(0).toUpperCase()

  const navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'Experts', href: '#experts' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'My Bookings', href: '#bookings' },
  ]

  return (
    <header
      className={`sticky top-0 z-50 transition-shadow duration-300 ${
        scrolled ? 'shadow-md' : ''
      }`}
      style={{
        background: scrolled ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.a href="#" className="flex items-center gap-2" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Heart className="w-6 h-6 text-amber-500 fill-amber-500" />
            <span className="text-xl font-extrabold text-amber-500 tracking-tight">
              MUMAA
            </span>
          </motion.a>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="relative text-sm font-medium text-stone-600 hover:text-stone-800 transition-colors"
              >
                {link.label}
                <motion.div
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-amber-500 rounded-full"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.2 }}
                  style={{ transformOrigin: 'center' }}
                />
              </a>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {/* Trial / Subscription badge */}
            {isAuthenticated && isOnTrial && !hasSubscription && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs font-bold px-2.5 py-1 rounded-lg hover:bg-amber-100">
                <Gift className="w-3 h-3 mr-1" />
                Trial: {trialDaysLeft}d left
              </Badge>
            )}
            {isAuthenticated && hasSubscription && currentUser?.subscriptionPlan && (
              <Badge className="bg-green-100 text-green-700 border-green-200 text-xs font-bold px-2.5 py-1 rounded-lg hover:bg-green-100">
                <Zap className="w-3 h-3 mr-1" />
                {currentUser.subscriptionPlan.charAt(0).toUpperCase() + currentUser.subscriptionPlan.slice(1)}
              </Badge>
            )}
            {isAuthenticated && !isOnTrial && !hasSubscription && currentUser?.trialStartDate && (
              <button
                onClick={openPayment}
                className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Upgrade
              </button>
            )}

            {/* Notification bell */}
            {isAuthenticated && <NotificationBell />}

            {/* Auth section */}
            {isAuthenticated && currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-stone-100 transition-colors">
                    <span className="text-sm font-medium text-stone-700">
                      {currentUser.name.split(' ')[0]}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {getInitial(currentUser.name)}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5" sideOffset={8}>
                  <div className="px-3 py-2 mb-1 rounded-lg bg-amber-50">
                    <p className="text-sm font-semibold text-stone-800">{currentUser.name}</p>
                    <p className="text-xs text-stone-400">{currentUser.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={openProfile} className="rounded-lg cursor-pointer py-2">
                    <User className="w-4 h-4 mr-2 text-stone-400" />
                    Profile
                  </DropdownMenuItem>
                  {currentUser.role === 'parent' && !isOnTrial && !hasSubscription && currentUser?.trialStartDate && (
                    <DropdownMenuItem onClick={openPayment} className="rounded-lg cursor-pointer py-2">
                      <LayoutDashboard className="w-4 h-4 mr-2 text-stone-400" />
                      Subscription
                    </DropdownMenuItem>
                  )}
                  {currentUser.role === 'admin' && (
                    <DropdownMenuItem onClick={openAdminDashboard} className="rounded-lg cursor-pointer py-2">
                      <Shield className="w-4 h-4 mr-2 text-stone-400" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  {currentUser.role === 'nanny' && (
                    <DropdownMenuItem onClick={openNannyPortal} className="rounded-lg cursor-pointer py-2">
                      <Stethoscope className="w-4 h-4 mr-2 text-stone-400" />
                      Expert Portal
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="rounded-lg cursor-pointer text-red-500 hover:bg-red-50 py-2"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => openNannyReg()}
                  className="text-stone-600 text-sm font-medium rounded-xl hover:bg-stone-100"
                >
                  <UserPlus className="w-4 h-4 mr-1.5" />
                  Join as Expert
                </Button>
                <Button
                  onClick={() => openAuth('login')}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 shadow-sm text-sm"
                >
                  <LogIn className="w-4 h-4 mr-1.5" />
                  Login
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu */}
          <div className="md:hidden flex items-center gap-2">
            {isAuthenticated && isOnTrial && !hasSubscription && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                Trial: {trialDaysLeft}d
              </Badge>
            )}
            {isAuthenticated && !isOnTrial && !hasSubscription && currentUser?.trialStartDate && (
              <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                Upgrade
              </span>
            )}
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
                  <Menu className="w-5 h-5 text-stone-600" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 rounded-l-2xl p-0">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col h-full">
                  <div className="p-5 border-b border-stone-100">
                    {isAuthenticated && currentUser ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            {getInitial(currentUser.name)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-stone-800">{currentUser.name}</p>
                          <p className="text-xs text-stone-400">{currentUser.email}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Heart className="w-5 h-5 text-amber-500 fill-amber-500" />
                        <span className="text-lg font-extrabold text-amber-500">MUMAA</span>
                      </div>
                    )}
                  </div>

                  <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <AnimatePresence>
                    {navLinks.map((link, i) => (
                      <motion.a
                        key={link.label}
                        href={link.href}
                        className="block px-4 py-2.5 text-sm font-medium text-stone-600 rounded-xl hover:bg-stone-50 hover:text-stone-800 transition-colors"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.06 }}
                      >
                        {link.label}
                      </motion.a>
                    ))}
                    </AnimatePresence>

                    <div className="border-t border-stone-100 pt-3 mt-3 space-y-1">
                      {isAuthenticated && currentUser ? (
                        <>
                          <button
                            onClick={() => { openProfile() }}
                            className="w-full text-left px-4 py-2.5 text-sm font-medium text-stone-600 rounded-xl hover:bg-stone-50 transition-colors flex items-center gap-2.5"
                          >
                            <User className="w-4 h-4 text-stone-400" />
                            My Profile
                          </button>
                          {currentUser.role === 'parent' && !isOnTrial && !hasSubscription && currentUser?.trialStartDate && (
                            <button
                              onClick={() => { openPayment() }}
                              className="w-full text-left px-4 py-2.5 text-sm font-medium text-stone-600 rounded-xl hover:bg-stone-50 transition-colors flex items-center gap-2.5"
                            >
                              <LayoutDashboard className="w-4 h-4 text-stone-400" />
                              Subscription
                            </button>
                          )}
                          {currentUser.role === 'admin' && (
                            <button
                              onClick={() => { openAdminDashboard() }}
                              className="w-full text-left px-4 py-2.5 text-sm font-medium text-stone-600 rounded-xl hover:bg-stone-50 transition-colors flex items-center gap-2.5"
                            >
                              <Shield className="w-4 h-4 text-stone-400" />
                              Admin Dashboard
                            </button>
                          )}
                          {currentUser.role === 'nanny' && (
                            <button
                              onClick={() => { openNannyPortal() }}
                              className="w-full text-left px-4 py-2.5 text-sm font-medium text-stone-600 rounded-xl hover:bg-stone-50 transition-colors flex items-center gap-2.5"
                            >
                              <Stethoscope className="w-4 h-4 text-stone-400" />
                              Expert Portal
                            </button>
                          )}
                          <button
                            onClick={() => { logout() }}
                            className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-500 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-2.5"
                          >
                            <LogOut className="w-4 h-4" />
                            Logout
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => { openNannyReg() }}
                            className="w-full text-left px-4 py-2.5 text-sm font-medium text-stone-600 rounded-xl hover:bg-stone-50 transition-colors flex items-center gap-2.5"
                          >
                            <UserPlus className="w-4 h-4 text-stone-400" />
                            Join as Expert
                          </button>
                          <button
                            onClick={() => { openAuth('login') }}
                            className="w-full text-left px-4 py-2.5 text-sm font-medium text-stone-600 rounded-xl hover:bg-stone-50 transition-colors flex items-center gap-2.5"
                          >
                            <LogIn className="w-4 h-4 text-stone-400" />
                            Login
                          </button>
                        </>
                      )}
                    </div>
                  </nav>

                  <div className="p-4 border-t border-stone-100">
                    <Button
                      onClick={() => openBooking()}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl shadow-sm"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Book a Call
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
