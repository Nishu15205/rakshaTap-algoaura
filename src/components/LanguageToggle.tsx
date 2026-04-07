'use client'

import { useAppStore } from '@/lib/store'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getAvailableLanguages } from '@/lib/i18n'

export default function LanguageToggle() {
  const { language, setLanguage } = useAppStore()
  const languages = getAvailableLanguages()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => {
        const currentIndex = languages.findIndex(l => l.code === language)
        const nextIndex = (currentIndex + 1) % languages.length
        setLanguage(languages[nextIndex].code)
      }}
      className="text-stone-500 hover:text-stone-800 rounded-xl hover:bg-stone-50"
      title={`Language: ${language.toUpperCase()}`}
    >
      <Globe className="w-4 h-4" />
    </Button>
  )
}
