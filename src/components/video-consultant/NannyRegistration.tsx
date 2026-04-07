'use client'

import { useState } from 'react'
import {
  X,
  Check,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Star,
  Globe,
  FileText,
  Sparkles,
  Upload,
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

// ─── Constants ────────────────────────────────────────────────────────────────

const specialties = [
  'Newborn Care',
  'Sleep Training',
  'Lactation Consultant',
  'Postpartum Care',
  'Toddler Nutrition',
  'Child Development',
  'Other',
]

// ─── Form State ───────────────────────────────────────────────────────────────

interface FormState {
  fullName: string
  email: string
  phone: string
  age: string
  city: string
  experience: string
  specialty: string
  languages: string
  about: string
  qualifications: string
  workExperience: string
}

const initialForm: FormState = {
  fullName: '',
  email: '',
  phone: '',
  age: '',
  city: '',
  experience: '',
  specialty: '',
  languages: '',
  about: '',
  qualifications: '',
  workExperience: '',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NannyRegistration() {
  const { isNannyRegOpen, closeNannyReg, setNannyRegistrations } = useAppStore()
  const { toast } = useToast()

  const [form, setForm] = useState<FormState>(initialForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [resumeName, setResumeName] = useState('')

  const updateField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!form.fullName.trim()) errs.fullName = 'Full name is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email'
    if (!form.phone.trim()) errs.phone = 'Phone is required'
    if (!form.experience.trim()) errs.experience = 'Experience is required'
    if (!form.specialty) errs.specialty = 'Specialty is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) {
      toast({ title: 'Error', description: 'Please fix highlighted fields.', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    // Simulate API call
    setTimeout(() => {
      setNannyRegistrations([
        {
          id: `reg-${Date.now()}`,
          userId: '',
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          age: form.age ? parseInt(form.age, 10) : undefined,
          city: form.city || undefined,
          experience: form.experience ? parseInt(form.experience, 10) : undefined,
          specialty: form.specialty,
          languages: form.languages || undefined,
          about: form.about || undefined,
          qualifications: form.qualifications || undefined,
          workExperience: form.workExperience || undefined,
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      ])
      setSubmitted(true)
      setSubmitting(false)
      toast({ title: 'Application Submitted!', description: 'We will review within 48 hours.' })
    }, 1200)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setResumeName(file.name)
    }
  }

  const resetAndClose = () => {
    setForm(initialForm)
    setErrors({})
    setSubmitting(false)
    setSubmitted(false)
    setResumeName('')
    closeNannyReg()
  }

  return (
    <Dialog open={isNannyRegOpen} onOpenChange={(open) => !open && !submitting && resetAndClose()}>
      <DialogContent className="sm:max-w-lg max-h-[92vh] rounded-3xl p-0 flex flex-col overflow-hidden" showCloseButton={false}>
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-400 via-pink-400 to-orange-400 p-5 rounded-t-3xl relative overflow-hidden shrink-0">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          </div>
          {!submitting && !submitted && (
            <button onClick={resetAndClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors z-20">
              <X className="w-4 h-4 text-white" />
            </button>
          )}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              {submitting ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : submitted ? (
                <Check className="w-5 h-5 text-white" />
              ) : (
                <Sparkles className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">
                {submitted ? 'Application Submitted!' : 'Join as Expert Consultant'}
              </DialogTitle>
              <DialogDescription className="text-white/80 text-xs">
                {submitted ? 'Thank you for your interest' : 'Share your details for review'}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-5 flex flex-col overflow-y-auto flex-1 min-h-0" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d6d3d1 transparent' }}>
          {/* ─── SUCCESS ─── */}
          {submitted ? (
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Check className="w-10 h-10 text-white" strokeWidth={3} />
              </div>
              <h3 className="text-xl font-bold text-stone-800 mb-2">Application Submitted!</h3>
              <p className="text-sm text-stone-500 max-w-xs mx-auto mb-6">
                Our team will review your application and get back to you within <span className="font-bold text-stone-700">48 hours</span>.
              </p>
              <Button onClick={resetAndClose} className="bg-gradient-to-r from-rose-400 to-orange-400 text-white font-bold rounded-xl">
                Done
              </Button>
            </div>
          ) : (
            /* ─── FORM ─── */
            <div className="space-y-4">
              {/* Section 1: Personal Info */}
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <h3 className="text-sm font-bold text-stone-700">Personal Information</h3>
              </div>
              <Separator />

              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-semibold text-stone-700">Full Name <span className="text-rose-400">*</span></Label>
                  <div className="relative mt-1.5">
                    <Input value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} placeholder="Enter your full name" className={`rounded-xl pl-10 ${errors.fullName ? 'border-red-300' : 'border-stone-200'}`} />
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  </div>
                  {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-semibold text-stone-700">Email <span className="text-rose-400">*</span></Label>
                    <div className="relative mt-1.5">
                      <Input value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="you@example.com" type="email" className={`rounded-xl pl-10 ${errors.email ? 'border-red-300' : 'border-stone-200'}`} />
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    </div>
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-stone-700">Phone <span className="text-rose-400">*</span></Label>
                    <div className="relative mt-1.5">
                      <Input value={form.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="+91 98765 43210" className={`rounded-xl pl-10 ${errors.phone ? 'border-red-300' : 'border-stone-200'}`} />
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    </div>
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-semibold text-stone-700">Age</Label>
                    <div className="relative mt-1.5">
                      <Input value={form.age} onChange={(e) => updateField('age', e.target.value)} placeholder="e.g. 32" type="number" className="rounded-xl pl-10 border-stone-200" />
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-stone-700">City</Label>
                    <div className="relative mt-1.5">
                      <Input value={form.city} onChange={(e) => updateField('city', e.target.value)} placeholder="e.g. Mumbai" className="rounded-xl pl-10 border-stone-200" />
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Professional */}
              <div className="flex items-center gap-2 pt-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <h3 className="text-sm font-bold text-stone-700">Professional Details</h3>
              </div>
              <Separator />

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-semibold text-stone-700">Years of Experience <span className="text-rose-400">*</span></Label>
                    <div className="relative mt-1.5">
                      <Input value={form.experience} onChange={(e) => updateField('experience', e.target.value)} placeholder="e.g. 5" type="number" className={`rounded-xl pl-10 ${errors.experience ? 'border-red-300' : 'border-stone-200'}`} />
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    </div>
                    {errors.experience && <p className="text-xs text-red-500 mt-1">{errors.experience}</p>}
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-stone-700">Specialty <span className="text-rose-400">*</span></Label>
                    <div className="relative mt-1.5">
                      <Select value={form.specialty} onValueChange={(val) => updateField('specialty', val)}>
                        <SelectTrigger className={`w-full rounded-xl pl-10 ${errors.specialty ? 'border-red-300' : 'border-stone-200'}`}>
                          <SelectValue placeholder="Select specialty" />
                        </SelectTrigger>
                        <SelectContent>
                          {specialties.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                    </div>
                    {errors.specialty && <p className="text-xs text-red-500 mt-1">{errors.specialty}</p>}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-stone-700">Languages</Label>
                  <div className="relative mt-1.5">
                    <Input value={form.languages} onChange={(e) => updateField('languages', e.target.value)} placeholder="e.g. Hindi, English, Marathi" className="rounded-xl pl-10 border-stone-200" />
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  </div>
                  <p className="text-[10px] text-stone-400 mt-1">Comma separated</p>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-stone-700">About Yourself</Label>
                  <Textarea value={form.about} onChange={(e) => updateField('about', e.target.value)} placeholder="Tell us about yourself..." rows={3} maxLength={500} className="mt-1.5 rounded-xl border-stone-200 resize-none" />
                  <p className="text-[10px] text-stone-400 mt-1 text-right">{form.about.length}/500</p>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-stone-700">Qualifications</Label>
                  <Textarea value={form.qualifications} onChange={(e) => updateField('qualifications', e.target.value)} placeholder="Your certifications and qualifications..." rows={3} maxLength={500} className="mt-1.5 rounded-xl border-stone-200 resize-none" />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-stone-700">Work Experience</Label>
                  <Textarea value={form.workExperience} onChange={(e) => updateField('workExperience', e.target.value)} placeholder="Describe your relevant work experience..." rows={3} maxLength={1000} className="mt-1.5 rounded-xl border-stone-200 resize-none" />
                </div>
              </div>

              {/* Section 3: Resume */}
              <div className="flex items-center gap-2 pt-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <h3 className="text-sm font-bold text-stone-700">Resume (Optional)</h3>
              </div>
              <Separator />

              <label htmlFor="resume-upload" className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-2xl cursor-pointer transition-colors hover:border-orange-300 hover:bg-orange-50/30" style={{ borderColor: resumeName ? '#22c55e' : '#e7e5e4' }}>
                {resumeName ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <Check className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-stone-700 max-w-[200px] truncate">{resumeName}</p>
                      <p className="text-xs text-stone-400">File selected</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-stone-300 mb-2" />
                    <p className="text-sm font-semibold text-stone-500">Click to upload resume</p>
                    <p className="text-xs text-stone-400 mt-0.5">PDF, DOC, DOCX (Max 5MB)</p>
                  </>
                )}
                <input id="resume-upload" type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="hidden" />
              </label>

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-gradient-to-r from-orange-500 to-rose-500 text-white font-bold rounded-xl shadow-lg py-5 text-sm hover:from-orange-600 hover:to-rose-600 transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <span className="flex items-center gap-2 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2 justify-center">
                    <FileText className="w-4 h-4" />
                    Submit Application
                  </span>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
