'use client'

import { useState } from 'react'
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  Baby,
  ArrowLeft,
  Phone,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore, type UserRole } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function AuthDialog() {
  const { isAuthOpen, closeAuth, login, signup, activateTrial, startFreeTrialCall } = useAppStore()
  const { toast } = useToast()

  const [tab, setTab] = useState<string>('login')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  // Login fields
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Signup fields
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPhone, setSignupPhone] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('')
  const [role, setRole] = useState<UserRole>('parent')

  // Forgot password — 3 steps: email → otp+password → success
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotOtp, setForgotOtp] = useState('')
  const [forgotNewPassword, setForgotNewPassword] = useState('')
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('')
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1) // 1=email, 2=otp+password, 3=success
  const [forgotLoading, setForgotLoading] = useState(false)
  const [serverOtp, setServerOtp] = useState('') // shown in demo mode

  const resetFields = () => {
    setLoginEmail('')
    setLoginPassword('')
    setSignupName('')
    setSignupEmail('')
    setSignupPhone('')
    setSignupPassword('')
    setSignupConfirmPassword('')
    setError('')
    setShowPassword(false)
    setLoading(false)
    setShowForgotPassword(false)
    setForgotEmail('')
    setForgotOtp('')
    setForgotNewPassword('')
    setForgotConfirmPassword('')
    setForgotStep(1)
    setForgotLoading(false)
    setServerOtp('')
    setTab('login')
  }

  const handleClose = () => {
    resetFields()
    closeAuth()
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!loginEmail.trim()) { setError('Please enter your email address.'); return }
    if (!emailRegex.test(loginEmail)) { setError('Please enter a valid email address.'); return }
    if (!loginPassword) { setError('Please enter your password.'); return }

    setLoading(true)
    const result = await login(loginEmail, loginPassword)
    setLoading(false)
    if (result.success) {
      const user = useAppStore.getState().currentUser
      toast({ title: `Welcome back${user ? `, ${user.name}` : ''}!` })
      resetFields()
    } else {
      setError(result.error || 'Invalid email or password.')
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!signupName.trim() || signupName.trim().length < 2) { setError('Name must be at least 2 characters.'); return }
    if (!emailRegex.test(signupEmail)) { setError('Please enter a valid email address.'); return }
    if (signupPhone.trim() && !/^[\d\s+()-]{7,15}$/.test(signupPhone.trim())) { setError('Please enter a valid phone number.'); return }
    if (signupPassword.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (!/[A-Z]/.test(signupPassword)) { setError('Password needs at least one uppercase letter.'); return }
    if (!/[0-9]/.test(signupPassword)) { setError('Password needs at least one number.'); return }
    if (signupPassword !== signupConfirmPassword) { setError('Passwords do not match.'); return }

    setLoading(true)
    const result = await signup(signupName, signupEmail, signupPassword, role, signupPhone.trim() || undefined)
    setLoading(false)
    if (result.success) {
      activateTrial()
      toast({ title: 'Welcome!', description: 'Account created. Your 30-day free trial has started!' })
      resetFields()
      // After signup, directly start free trial call — no dialogs
      setTimeout(() => startFreeTrialCall(), 300)
    } else {
      setError(result.error || 'Could not create account. Please try again.')
    }
  }

  // --- Forgot password handlers ---

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!forgotEmail.trim()) { setError('Please enter your email.'); return }
    if (!emailRegex.test(forgotEmail)) { setError('Please enter a valid email address.'); return }

    setForgotLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      })
      const json = await res.json()
      setForgotLoading(false)
      if (json.success) {
        // If email was sent successfully, don't show OTP on screen
        // If email failed, API returns hint with OTP for fallback
        if (json.data?.hint) {
          setServerOtp(json.data.hint.replace('Code is: ', ''))
        } else {
          setServerOtp('')
        }
        setForgotStep(2)
        toast({ title: 'Code Sent', description: 'A verification code has been sent to your email.' })
      } else {
        setError(json.error || 'Failed to send code. Try again.')
      }
    } catch {
      setForgotLoading(false)
      setError('Network error. Please try again.')
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!forgotOtp.trim()) { setError('Please enter the verification code.'); return }
    if (forgotNewPassword.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (forgotNewPassword !== forgotConfirmPassword) { setError('Passwords do not match.'); return }

    setForgotLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset',
          email: forgotEmail,
          otp: forgotOtp,
          newPassword: forgotNewPassword,
        }),
      })
      const json = await res.json()
      setForgotLoading(false)
      if (json.success) {
        setForgotStep(3)
        toast({ title: 'Password Reset!', description: 'Your password has been changed. You can now log in.' })
      } else {
        setError(json.error || 'Failed to reset password. Try again.')
      }
    } catch {
      setForgotLoading(false)
      setError('Network error. Please try again.')
    }
  }

  const handleBackToLogin = () => {
    setShowForgotPassword(false)
    setForgotStep(1)
    setError('')
  }

  const handleBackToEmail = () => {
    setForgotStep(1)
    setError('')
    setForgotOtp('')
    setForgotNewPassword('')
    setForgotConfirmPassword('')
  }

  return (
    <Dialog open={isAuthOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="sm:max-w-md max-h-[92vh] overflow-y-auto rounded-2xl p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 rounded-t-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                {showForgotPassword ? (
                  <KeyRound className="w-5 h-5 text-white" />
                ) : (
                  <Baby className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white">
                  {showForgotPassword
                    ? forgotStep === 1 ? 'Forgot Password'
                    : forgotStep === 2 ? 'Enter Verification Code'
                    : 'Password Reset!'
                    : 'Join MUMAA'}
                </DialogTitle>
                <DialogDescription className="text-white/80 text-sm">
                  {showForgotPassword
                    ? forgotStep === 1
                      ? "No worries, we'll get you back in"
                      : forgotStep === 2
                      ? 'Check your email for the code'
                      : 'All done!'
                    : 'Expert parenting support at your fingertips'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-5 pt-4 pb-5">
          {showForgotPassword ? (
            /* ========== FORGOT PASSWORD FLOW ========== */
            <div className="space-y-4">
              {/* Step 1: Enter email */}
              {forgotStep === 1 && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <p className="text-sm text-stone-500 leading-relaxed">
                    Enter the email address associated with your account and we&apos;ll send you a verification code.
                  </p>
                  <div>
                    <Label htmlFor="forgot-email" className="text-sm font-semibold text-stone-700">
                      Email Address
                    </Label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="your@email.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="pl-10 rounded-xl border-stone-200"
                        autoFocus
                      />
                    </div>
                  </div>
                  {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
                  <Button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-70"
                  >
                    {forgotLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    Send Verification Code
                  </Button>
                </form>
              )}

              {/* Step 2: Enter OTP + new password */}
              {forgotStep === 2 && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 flex items-start gap-2">
                    <Mail className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-stone-600">
                      Code sent to <span className="font-semibold text-stone-800">{forgotEmail}</span>
                    </p>
                  </div>

                  {/* Show OTP hint in demo */}
                  {serverOtp && (
                    <div className="bg-green-50 rounded-xl p-3 border border-green-100 text-center">
                      <p className="text-[10px] text-green-600 font-semibold uppercase tracking-wide mb-0.5">Dev Mode — Your Code</p>
                      <p className="text-2xl font-mono font-extrabold text-green-700 tracking-[0.3em]">{serverOtp}</p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="forgot-otp" className="text-sm font-semibold text-stone-700">
                      Verification Code
                    </Label>
                    <div className="relative mt-1.5">
                      <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input
                        id="forgot-otp"
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="pl-10 rounded-xl border-stone-200 text-center text-lg font-mono tracking-[0.3em]"
                        maxLength={6}
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="forgot-new-pw" className="text-sm font-semibold text-stone-700">
                      New Password
                    </Label>
                    <div className="relative mt-1.5">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input
                        id="forgot-new-pw"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 6 characters"
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        className="pl-10 pr-10 rounded-xl border-stone-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="forgot-confirm-pw" className="text-sm font-semibold text-stone-700">
                      Confirm New Password
                    </Label>
                    <div className="relative mt-1.5">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input
                        id="forgot-confirm-pw"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Re-enter your password"
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        className="pl-10 rounded-xl border-stone-200"
                      />
                    </div>
                  </div>

                  {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

                  <Button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-70"
                  >
                    {forgotLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <KeyRound className="w-4 h-4 mr-2" />
                    )}
                    Reset Password
                  </Button>

                  <div className="flex justify-center gap-4">
                    <button
                      type="button"
                      onClick={handleBackToEmail}
                      className="text-xs text-stone-500 hover:text-stone-700 font-medium"
                    >
                      Change email
                    </button>
                    <span className="text-stone-300">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotLoading(true)
                        fetch('/api/auth/forgot-password', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: forgotEmail }),
                        }).then(r => r.json()).then(json => {
                          setForgotLoading(false)
                          if (json.data?.hint) {
                            setServerOtp(json.data.hint.replace('Code is: ', ''))
                          } else {
                            setServerOtp('')
                          }
                          toast({ title: 'Code Resent!' })
                        }).catch(() => setForgotLoading(false))
                      }}
                      disabled={forgotLoading}
                      className="text-xs text-orange-600 hover:text-orange-700 font-semibold disabled:opacity-50"
                    >
                      {forgotLoading ? 'Sending...' : 'Resend code'}
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: Success */}
              {forgotStep === 3 && (
                <div className="text-center space-y-4 py-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-stone-800 mb-1">Password Changed!</h3>
                    <p className="text-sm text-stone-500">
                      You can now log in with your new password.
                    </p>
                  </div>
                  <Button
                    onClick={handleBackToLogin}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all"
                  >
                    Back to Login
                  </Button>
                </div>
              )}

              {/* Back to login (step 1 and 2 only) */}
              {forgotStep !== 3 && (
                <button
                  onClick={handleBackToLogin}
                  className="w-full flex items-center justify-center gap-2 text-sm text-stone-500 hover:text-stone-700 font-medium pt-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to login
                </button>
              )}
            </div>
          ) : (
            /* ========== LOGIN / SIGNUP TABS ========== */
            <Tabs value={tab} onValueChange={(v) => { setTab(v); setError('') }}>
              <TabsList className="w-full grid grid-cols-2 bg-stone-100 rounded-xl p-1">
                <TabsTrigger
                  value="login"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-orange-600 font-semibold text-sm"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-orange-600 font-semibold text-sm"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="login-email" className="text-sm font-semibold text-stone-700">
                      Email Address
                    </Label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10 rounded-xl border-stone-200"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="login-password" className="text-sm font-semibold text-stone-700">
                      Password
                    </Label>
                    <div className="relative mt-1.5">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10 pr-10 rounded-xl border-stone-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => { setShowForgotPassword(true); setError('') }}
                      className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-70"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Lock className="w-4 h-4 mr-2" />
                    )}
                    {loading ? 'Signing in...' : 'Login'}
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4 mt-4">
                  <div>
                    <Label className="text-sm font-semibold text-stone-700 block mb-2">
                      I am a...
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['parent', 'nanny'] as UserRole[]).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRole(r)}
                          className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                            role === r
                              ? 'border-orange-400 bg-orange-50 text-orange-700'
                              : 'border-stone-200 text-stone-500 hover:border-stone-300'
                          }`}
                        >
                          <Baby className={`w-4 h-4 mx-auto mb-1 ${role === r ? 'text-orange-500' : 'text-stone-400'}`} />
                          {r === 'parent' ? 'Parent' : 'Expert'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="signup-name" className="text-sm font-semibold text-stone-700">
                      Full Name
                    </Label>
                    <div className="relative mt-1.5">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input
                        id="signup-name"
                        placeholder="Your full name"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        className="pl-10 rounded-xl border-stone-200"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="signup-email" className="text-sm font-semibold text-stone-700">
                      Email Address
                    </Label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="pl-10 rounded-xl border-stone-200"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="signup-phone" className="text-sm font-semibold text-stone-700">
                      Phone Number <span className="text-stone-400 font-normal">(optional)</span>
                    </Label>
                    <div className="relative mt-1.5">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                        className="pl-10 rounded-xl border-stone-200"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="signup-password" className="text-sm font-semibold text-stone-700">
                      Password
                    </Label>
                    <div className="relative mt-1.5">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 8 chars, 1 uppercase, 1 number"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="pl-10 pr-10 rounded-xl border-stone-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="signup-confirm-password" className="text-sm font-semibold text-stone-700">
                      Confirm Password
                    </Label>
                    <div className="relative mt-1.5">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input
                        id="signup-confirm-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        className="pl-10 rounded-xl border-stone-200"
                      />
                    </div>
                  </div>

                  {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-70"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <User className="w-4 h-4 mr-2" />
                    )}
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>

                  <p className="text-center text-xs text-stone-400 mt-3">
                    Start your 30-day free trial. No credit card needed.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
