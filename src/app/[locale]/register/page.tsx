'use client'
// src/app/[locale]/register/page.tsx
import { useParams, useSearchParams } from 'next/navigation'
import { useState, useTransition, Suspense } from 'react'
import { signUp } from '@/app/actions/auth'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { LogoMark } from '@/components/layout/LogoMark'
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons'

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterShell />}>
      <RegisterInner />
    </Suspense>
  )
}

function RegisterShell() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-pulse">
        <div className="bg-surface-card border border-surface-border rounded-xl p-6 h-96" />
      </div>
    </div>
  )
}

function RegisterInner() {
  const params = useParams()
  const searchParams = useSearchParams()
  const t = useTranslations('register')
  const locale = (params.locale as string) || 'en'
  const prefix = `/${locale}`
  const [error, setError] = useState<string | null>(null)
  const oauthError = searchParams.get('oauth_error')
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const confirm = formData.get('confirm') as string

    if (password !== confirm) {
      setError(t('passwords_no_match'))
      return
    }
    if (password.length < 6) {
      setError(t('password_too_short'))
      return
    }

    formData.set('locale', locale)
    startTransition(async () => {
      const result = await signUp(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
      }
    })
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-fifa-green/15 border-2 border-fifa-green mb-4">
            <span className="text-3xl">✉️</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{t('check_email_title')}</h2>
          <p className="text-slate-400 text-sm mb-6">{t('check_email_desc')}</p>
          <Link href={`${prefix}/login`} className="text-fifa-gold hover:underline text-sm">
            {t('back_to_login')}
          </Link>
        </div>
      </div>
    )
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
        </div>

        <form onSubmit={handleSubmit} className="bg-surface-card border border-surface-border rounded-xl p-6 space-y-4 mt-3">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">{t('email_label')}</label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-fifa-gold transition-colors"
              placeholder={t('email_placeholder')}
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">{t('password_label')}</label>
            <input
              name="password"
              type="password"
              required
              autoComplete="new-password"
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-fifa-gold transition-colors"
              placeholder={t('password_placeholder')}
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">{t('confirm_label')}</label>
            <input
              name="confirm"
              type="password"
              required
              autoComplete="new-password"
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-fifa-gold transition-colors"
              placeholder={t('confirm_placeholder')}
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-fifa-green text-white font-bold py-2.5 rounded-lg hover:bg-green-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? t('creating') : t('create_button')}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-4">
          {t('have_account')}{' '}
          <Link href={`${prefix}/login`} className="text-fifa-gold hover:underline">
            {t('signin_link')}
          </Link>
        </p>
      </div>
    </div>
  )
}
