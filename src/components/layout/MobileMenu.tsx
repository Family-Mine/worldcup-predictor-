'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { signOut } from '@/app/actions/auth'
import type { User } from '@supabase/supabase-js'

interface MobileMenuProps {
  user: User | null
}

export function MobileMenu({ user }: MobileMenuProps) {
  const [open, setOpen] = useState(false)
  const t = useTranslations('nav')
  const locale = useLocale()
  const prefix = `/${locale}`

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2.5 text-slate-300 hover:text-white transition-colors"
        aria-label="Toggle menu"
        aria-expanded={open}
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {open && (
        <>
          {/* Click-outside backdrop */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 top-[calc(env(safe-area-inset-top)+4rem)] z-40 bg-black/30"
          />
          <div className="fixed top-[calc(env(safe-area-inset-top)+4rem)] left-0 right-0 bg-surface border-b border-surface-border z-50 px-4 py-4 flex flex-col gap-1">
          <Link
            href={`${prefix}/groups`}
            className="text-slate-300 hover:text-white text-sm py-3 border-b border-surface-border/50 transition-colors"
            onClick={() => setOpen(false)}
          >
            {t('groups')}
          </Link>

          <Link
            href={`${prefix}/predictions/group-phase`}
            className="flex items-center gap-1.5 text-sm font-semibold text-fifa-green hover:text-green-400 py-3 border-b border-surface-border/50 transition-colors"
            onClick={() => setOpen(false)}
          >
            <span className="text-xs">★</span>
            {t('groupBundle')}
          </Link>

          <Link
            href={`${prefix}/pools`}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white py-3 border-b border-surface-border/50 transition-colors"
            onClick={() => setOpen(false)}
          >
            👥 {t('pools')}
          </Link>

          <div className="pt-3">
            {user ? (
              <div className="flex flex-col gap-3">
                <span className="text-xs text-slate-400 truncate">{user.email}</span>
                <form action={signOut.bind(null, locale)}>
                  <button
                    type="submit"
                    className="text-xs text-slate-400 hover:text-white border border-surface-border rounded-lg px-3 py-2 transition-colors w-full text-left"
                  >
                    {t('signOut')}
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href={`${prefix}/login`}
                  className="text-sm text-slate-300 hover:text-white py-2 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  {t('signIn')}
                </Link>
                <Link
                  href={`${prefix}/register`}
                  className="text-sm bg-fifa-green text-white font-semibold px-3 py-2 rounded-lg hover:bg-green-500 transition-colors text-center"
                  onClick={() => setOpen(false)}
                >
                  {t('register')}
                </Link>
              </div>
            )}
          </div>
        </div>
        </>
      )}
    </div>
  )
}
