import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { LanguageToggle } from '@/components/ui/LanguageToggle'

export function Navbar() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const prefix = `/${locale}`

  return (
    <nav className="border-b border-surface-border bg-surface/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href={`${prefix}/`} className="flex items-center gap-2">
          <span className="text-2xl">⚽</span>
          <span className="font-bold text-white text-lg">
            WC26 <span className="text-fifa-gold">Predictor</span>
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href={`${prefix}/groups`}
            className="text-slate-300 hover:text-white text-sm transition-colors"
          >
            {t('groups')}
          </Link>
          <LanguageToggle />
        </div>
      </div>
    </nav>
  )
}
