'use client'

import { Heart, Mail, Phone, MapPin } from 'lucide-react'

const quickLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Experts', href: '#experts' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#call-types' },
]

const supportLinks = [
  { label: 'Help Center', href: '#' },
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
  { label: 'Contact Us', href: '#contact' },
]

export default function Footer() {
  return (
    <footer id="contact" className="mt-auto bg-stone-900 text-stone-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1: Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span className="text-xl font-extrabold text-white">MUMAA</span>
            </div>
            <p className="text-sm text-stone-400 leading-relaxed">
              Your trusted parenting companion. Connect with certified childcare specialists for instant video consultations.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-stone-400 hover:text-amber-400 transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Support */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Support</h4>
            <ul className="space-y-2.5">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-stone-400 hover:text-amber-400 transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Download */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Download</h4>
            <div className="space-y-3">
              {/* App Store button */}
              <a
                href="#"
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors w-fit"
              >
                <svg className="w-6 h-6 text-stone-300" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <div>
                  <p className="text-[10px] text-stone-400 leading-none">Download on the</p>
                  <p className="text-sm font-semibold text-stone-200 leading-tight">App Store</p>
                </div>
              </a>

              {/* Google Play button */}
              <a
                href="#"
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors w-fit"
              >
                <svg className="w-5 h-5 text-stone-300" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.24-.84-.76-.84-1.35m13.81-5.38L6.05 21.34l8.49-8.49 2.27 2.27m3.35-4.31c.34.27.56.69.56 1.19s-.22.92-.56 1.19l-1.97 1.13-2.5-2.5 2.5-2.5 1.97 1.19M6.05 2.66l10.76 6.22-2.27 2.27-8.49-8.49z" />
                </svg>
                <div>
                  <p className="text-[10px] text-stone-400 leading-none">Get it on</p>
                  <p className="text-sm font-semibold text-stone-200 leading-tight">Google Play</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-stone-500">
            &copy; 2024 MUMAA. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-stone-500">
            <a href="#" className="hover:text-stone-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-stone-300 transition-colors">Terms</a>
            <a href="#" className="hover:text-stone-300 transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
