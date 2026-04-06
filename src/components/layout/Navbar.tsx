// src/components/layout/Navbar.tsx
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { signOut } from '@/app/actions/auth'
import type { User } from '@supabase/supabase-js'

interface NavbarProps {
  user: User | null
}

export function Navbar({ user }: NavbarProps) {
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

        <div className="flex items-center gap-4">
          <Link
            href={`${prefix}/groups`}
            className="text-slate-300 hover:text-white text-sm transition-colors"
          >
            {t('groups')}
          </Link>

          <LanguageToggle />

          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 hidden sm:block truncate max-w-[140px]">
                {user.email}
              </span>
              <form action={signOut.bind(null, locale)}>
                <button
                  type="submit"
                  className="text-xs text-slate-400 hover:text-white border border-surface-border rounded-lg px-3 py-1.5 transition-colors"
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href={`${prefix}/login`}
                className="text-sm text-slate-300 hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                href={`${prefix}/register`}
                className="text-sm bg-fifa-gold text-black font-semibold px-3 py-1.5 rounded-lg hover:bg-yellow-400 transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
