'use client'

import { useState } from 'react'
import { Star, X, Send, Loader2, MessageSquare } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

// ─── Props ────────────────────────────────────────────────────────────────────

interface ReviewDialogProps {
  isOpen: boolean
  onClose: () => void
  expertName?: string
  expertSpecialty?: string
  expertAvatar?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReviewDialog({
  isOpen,
  onClose,
  expertName = 'the expert',
  expertSpecialty = '',
  expertAvatar,
}: ReviewDialogProps) {
  const { toast } = useToast()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ title: 'Please rate', description: 'Select a star rating to submit your review.', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    // Simulate API call
    setTimeout(() => {
      toast({ title: 'Review Submitted!', description: `Thank you for rating ${expertName}!` })
      setSubmitted(true)
      setSubmitting(false)
    }, 1000)
  }

  const resetAndClose = () => {
    setRating(0)
    setHoverRating(0)
    setComment('')
    setSubmitting(false)
    setSubmitted(false)
    onClose()
  }

  const ratingLabels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent']

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !submitting && resetAndClose()}>
      <DialogContent className="sm:max-w-md rounded-3xl p-0" showCloseButton={false}>
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 p-6 rounded-t-3xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          </div>
          {!submitting && !submitted && (
            <button onClick={resetAndClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors z-20">
              <X className="w-4 h-4 text-white" />
            </button>
          )}
          <div className="relative z-10 text-center">
            <DialogTitle className="text-xl font-bold text-white">Rate Your Experience</DialogTitle>
            <DialogDescription className="text-white/80 text-sm mt-1">
              How was your call with {expertName}?
            </DialogDescription>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {submitted ? (
            /* ─── SUCCESS STATE ─── */
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Star className="w-8 h-8 text-white fill-white" />
              </div>
              <h3 className="text-lg font-bold text-stone-800 mb-1">Thank You!</h3>
              <p className="text-sm text-stone-500 mb-5">Your review helps other parents find the right expert.</p>
              <Button onClick={resetAndClose} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-colors">
                Close
              </Button>
            </div>
          ) : (
            <>
              {/* Expert Info */}
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-2xl border border-orange-100">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-orange-200 shrink-0">
                  {expertAvatar ? (
                    <img src={expertAvatar} alt={expertName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-orange-100 flex items-center justify-center text-orange-500 font-bold text-sm">
                      {expertName.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-stone-800 text-sm">{expertName}</p>
                  {expertSpecialty && <p className="text-xs text-stone-500">{expertSpecialty}</p>}
                </div>
              </div>

              {/* Star Rating */}
              <div className="text-center">
                <p className="text-sm font-semibold text-stone-700 mb-3">Your Rating</p>
                <div className="flex items-center justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        className={`w-10 h-10 transition-colors ${
                          star <= (hoverRating || rating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-stone-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-sm text-stone-500 mt-2">{ratingLabels[rating - 1]}</p>
                )}
              </div>

              {/* Comment */}
              <div>
                <Label className="text-sm font-semibold text-stone-700">
                  <MessageSquare className="w-4 h-4 inline mr-1" />
                  Your Review (Optional)
                </Label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience..."
                  rows={3}
                  maxLength={500}
                  className="mt-2 w-full rounded-xl border-stone-200 bg-stone-50 focus:border-orange-400 focus:ring-1 focus:ring-orange-400/20 resize-none text-sm"
                />
                <p className="text-[10px] text-stone-400 mt-1 text-right">{comment.length}/500</p>
              </div>

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={rating === 0 || submitting}
                className={`w-full font-bold rounded-xl shadow-lg text-white transition-colors py-5 text-sm ${
                  rating === 0 || submitting
                    ? 'bg-stone-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                }`}
              >
                {submitting ? (
                  <span className="flex items-center gap-2 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2 justify-center">
                    <Send className="w-4 h-4" />
                    Submit Review
                  </span>
                )}
              </Button>

              <p className="text-center text-[10px] text-stone-400">
                Your review helps other parents find the right expert
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
