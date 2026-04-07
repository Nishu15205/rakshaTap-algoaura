'use client'

import { useState } from 'react'
import {
  Check,
  CreditCard,
  Crown,
  Star,
  X,
  Shield,
  IndianRupee,
  Loader2,
  Gift,
  Clock,
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
import { Badge } from '@/components/ui/badge'
import { useAppStore, subscriptionPlans, type SubscriptionPlan } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

const planIcons: Record<string, typeof Star> = {
  standard: Star,
  premium: Crown,
}

export default function PaymentDialog() {
  const {
    isPaymentOpen,
    closePayment,
    selectedPlan,
    selectPlan,
    processPayment,
    isProcessingPayment,
    currentUser,
  } = useAppStore()
  const { toast } = useToast()

  const [step, setStep] = useState<'plans' | 'payment' | 'success'>('plans')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [cardName, setCardName] = useState('')
  const [processing, setProcessing] = useState(false)

  const handleClose = () => {
    setStep('plans')
    setCardNumber('')
    setExpiry('')
    setCvv('')
    setCardName('')
    setProcessing(false)
    closePayment()
  }

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    selectPlan(plan)
    setStep('payment')
  }

  const handlePayNow = async () => {
    if (!currentUser || !selectedPlan) return

    if (!cardNumber || !expiry || !cvv || !cardName) {
      toast({
        title: 'Missing fields',
        description: 'Please fill all card details.',
        variant: 'destructive',
      })
      return
    }

    setProcessing(true)
    const result = await processPayment(cardNumber, expiry, cvv, cardName)
    setProcessing(false)
    if (result) {
      setStep('success')
      toast({ title: 'Payment Successful!', description: `${selectedPlan.name} plan is now active!` })
    } else {
      toast({ title: 'Payment Failed', description: 'Could not process payment. Try again.', variant: 'destructive' })
    }
  }

  const isActiveSubscriber = currentUser?.subscriptionStatus === 'active'
  const isTrialActive = useAppStore((s) => s.isTrialActive)
  const isOnTrial = isTrialActive || currentUser?.subscriptionStatus === 'trial'
  const getTrialDaysRemaining = useAppStore((s) => s.getTrialDaysRemaining)

  // During trial, show trial info instead of plan selection
  if (isOnTrial && step === 'plans') {
    const daysLeft = getTrialDaysRemaining()
    return (
      <Dialog open={isPaymentOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-0">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 rounded-t-2xl">
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-white">Free Trial Active</DialogTitle>
                  <DialogDescription className="text-white/80 text-sm">You have full access to all features</DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>
          <div className="p-6 text-center space-y-5">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mx-auto">
              <Gift className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-stone-800 mb-1">Enjoying your free trial!</h3>
              <p className="text-sm text-stone-500">
                You have <span className="font-bold text-orange-600">{daysLeft} day{daysLeft === 1 ? '' : 's'}</span> remaining in your free trial.
              </p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-100 space-y-2">
              <div className="flex items-center gap-2 justify-center">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-stone-700">Unlimited video consultations</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-stone-700">All expert consultants</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-stone-700">In-call chat support</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-stone-400">
              <Clock className="w-4 h-4" />
              <span className="text-xs">You can subscribe anytime after your trial ends</span>
            </div>
            <Button
              onClick={handleClose}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all"
            >
              Continue Using Free Trial
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isPaymentOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 rounded-t-2xl relative">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                {step === 'success' ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <CreditCard className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white">
                  {step === 'success'
                    ? 'Payment Successful!'
                    : 'Choose a Plan'}
                </DialogTitle>
                <DialogDescription className="text-white/80 text-sm">
                  {step === 'success'
                    ? 'Your payment has been processed'
                    : step === 'payment'
                      ? 'Review and complete your payment'
                      : 'Select the perfect plan for your needs'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-5">
          {/* Success screen */}

          {/* Active subscription */}
          {isActiveSubscriber && step === 'plans' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-800 mb-1">
                  {currentUser?.subscriptionPlan === 'premium' ? 'Premium' : 'Standard'} Plan Active
                </h3>
                <p className="text-sm text-stone-500">
                  Your subscription is active. Enjoy unlimited consultations!
                </p>
              </div>
              <Button
                onClick={handleClose}
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all"
              >
                Manage Subscription
              </Button>
            </div>
          )}

          {/* Plans step */}
          {!isActiveSubscriber && step === 'plans' && (
            <div className="space-y-3">
              {subscriptionPlans.map((plan) => {
                const Icon = planIcons[plan.id] || Star
                return (
                  <button
                    key={plan.id}
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      selectedPlan?.id === plan.id
                        ? 'border-orange-400 bg-orange-50 shadow-sm'
                        : 'border-stone-100 hover:border-orange-200 hover:bg-orange-50/30'
                    } ${plan.popular ? 'ring-2 ring-orange-200' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-stone-800">{plan.name}</h4>
                            {plan.popular && (
                              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[9px] px-1.5 py-0">
                                Most Popular
                              </Badge>
                            )}
                          </div>
                          <p className="text-lg font-bold text-orange-600">₹{plan.price}/mo</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-green-500 shrink-0" />
                          <span className="text-[11px] text-stone-500">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Payment step */}
          {step === 'payment' && selectedPlan && (
            <div className="space-y-4">
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-500 uppercase tracking-wide">Selected Plan</p>
                    <p className="text-sm font-bold text-stone-800">{selectedPlan.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-stone-500 uppercase tracking-wide">Amount</p>
                    <p className="text-xl font-bold text-orange-600">₹{selectedPlan.price}</p>
                  </div>
                </div>
                <p className="text-[11px] text-stone-400 mt-1">
                  Unlimited calls · Billed monthly
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-semibold text-stone-700">Card Number</Label>
                  <div className="relative mt-1">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <Input
                      placeholder="4242 4242 4242 4242"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="pl-10 rounded-xl border-stone-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-semibold text-stone-700">Expiry</Label>
                    <Input
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="mt-1 rounded-xl border-stone-200"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-stone-700">CVV</Label>
                    <Input
                      placeholder="123"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      className="mt-1 rounded-xl border-stone-200"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-stone-700">Cardholder Name</Label>
                  <Input
                    placeholder="Name on card"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="mt-1 rounded-xl border-stone-200"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-stone-400">
                <Shield className="w-4 h-4 text-green-500 shrink-0" />
                <span className="text-xs">Your payment is encrypted and secure.</span>
              </div>

              <Button
                onClick={handlePayNow}
                disabled={!currentUser || processing || isProcessingPayment}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all py-5 text-base disabled:opacity-50"
              >
                {processing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </span>
                ) : !currentUser ? (
                  <span className="flex items-center gap-2">Please login first</span>
                ) : (
                  <span className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4" />
                    Pay ₹{selectedPlan.price} Securely
                  </span>
                )}
              </Button>

              <button
                onClick={() => setStep('plans')}
                className="w-full text-center text-sm text-stone-500 hover:text-stone-700 font-semibold"
              >
                &larr; Back to plans
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
