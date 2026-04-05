'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'

export function LanguageToggle() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  function toggleLanguage() {
    const newLocale = locale === 'en' ? 'es' : 'en'
    const pathWithoutLocale = pathname.replace(/^\/(en|es)/, '') || '/'
    router.push(newLocale === 'en' ? pathWithoutLocale : `/es${pathWithoutLocale}`)
  }

  return (
    <button
      onClick={toggleLanguage}
      className="text-sm font-medium text-slate-400 hover:text-fifa-gold transition-colors px-2 py-1 rounded border border-surface-border hover:border-fifa-gold"
      aria-label="Toggle language"
    >
      {locale === 'en' ? 'ES' : 'EN'}
    </button>
  )
}
