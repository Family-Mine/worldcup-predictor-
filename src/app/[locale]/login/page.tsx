'use client'
// src/app/[locale]/login/page.tsx
import { useParams, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { LogoMark } from '@/components/layout/LogoMark'
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons'

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginShell />}>
      <LoginInner />
    </Suspense>
  )
}

function LoginShell() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-pulse">
        <div className="bg-surface-card border border-surface-border rounded-xl p-6 h-96" />
      </div>
    </div>
  )
}

function LoginInner() {
  const params = useParams()
  const searchParams = useSearchParams()
  const t = useTranslations('login')
  const locale = (params?.locale as string) || 'en'
  const prefix = `/${locale}`
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const oauthError = searchParams.get('oauth_error')

  async function handleSignIn() {
    if (!email || !password) return
    setError(null)
    setLoading(true)

    try {
      const { createBrowserClient } = await import('@supabase/ssr')
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        window.location.replace(`/${locale}`)
      }
    } catch (err) {
      setError('Error: ' + String(err))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href={prefix} className="inline-flex mb-6">
            <LogoMark />
          </Link>
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <p className="text-slate-400 text-sm mt-1">{t('subtitle')}</p>
        </div>

        {oauthError && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-amber-400 text-sm mb-4">
            {t('oauth_error')}
          </div>
        )}

        <div className="bg-surface-card border border-surface-border rounded-xl p-6 space-y-4">
          <SocialAuthButtons locale={locale} />

          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-surface-border" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">{t('or')}</span>
            <div className="flex-1 h-px bg-surface-border" />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">{t('email_label')}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-fifa-gold transition-colors"
              placeholder={t('email_placeholder')}
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">{t('password_label')}</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSignIn()}
              autoComplete="current-password"
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-fifa-gold transition-colors"
              placeholder={t('password_placeholder')}
            />
          </div>

          <button
            type="button"
            onClick={handleSignIn}
            disabled={loading || !email || !password}
            className="w-full bg-fifa-green text-white font-bold py-2.5 rounded-lg hover:bg-green-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? t('signing_in') : t('signin_button')}
          </button>
        </div>

        <p className="text-center text-sm text-slate-400 mt-4">
          {t('no_account')}{' '}
          <Link href={`${prefix}/register`} className="text-fifa-gold hover:underline">
            {t('register_link')}
          </Link>
        </p>
        <p className="text-center text-sm text-slate-500 mt-2">
          <Link href={`${prefix}/forgot-password`} className="text-slate-500 hover:text-slate-300 hover:underline">
            {t('forgot_password')}
          </Link>
        </p>
      </div>
    </div>
  )
}
