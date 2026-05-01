// src/components/layout/Navbar.tsx
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { LogoMark } from '@/components/layout/LogoMark'
import { MobileMenu } from '@/components/layout/MobileMenu'
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
    <nav className="border-b border-surface-border bg-surface/90 backdrop-blur-sm sticky top-0 z-50 pt-[env(safe-area-inset-top)]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href={`${prefix}/`}>
          <LogoMark />
        </Link>

        <div className="flex items-center gap-4">
          {/* Desktop nav links */}
          <Link
            href={`${prefix}/groups`}
            className="hidden sm:block text-slate-300 hover:text-white text-sm transition-colors"
          >
            {t('groups')}
          </Link>

          <Link
            href={`${prefix}/predictions/group-phase`}
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-fifa-green hover:text-green-400 transition-colors"
          >
            <span className="text-xs">★</span>
            {t('groupBundle')}
          </Link>

          <Link
            href={`${prefix}/pools`}
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            👥 {t('pools')}
          </Link>

          <LanguageToggle />

          {/* Desktop auth */}
          {user ? (
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-xs text-slate-400 truncate max-w-[140px]">
                {user.email}
              </span>
              <form action={signOut.bind(null, locale)}>
                <button
                  type="submit"
                  className="text-xs text-slate-400 hover:text-white border border-surface-border rounded-lg px-3 py-1.5 transition-colors"
                >
                  {t('signOut')}
                </button>
              </form>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href={`${prefix}/login`}
                className="text-sm text-slate-300 hover:text-white transition-colors"
              >
                {t('signIn')}
              </Link>
              <Link
                href={`${prefix}/register`}
                className="text-sm bg-fifa-green text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-green-500 transition-colors"
              >
                {t('register')}
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <MobileMenu user={user} />
        </div>
      </div>
    </nav>
  )
}
