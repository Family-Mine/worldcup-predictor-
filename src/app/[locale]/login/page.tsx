'use client'
// src/app/[locale]/login/page.tsx
import { useParams, useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { signIn } from '@/app/actions/auth'
import Link from 'next/link'

export default function LoginPage() {
  const params = useParams()
  const locale = (params.locale as string) || 'en'
  const prefix = `/${locale}`
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('locale', locale)

    startTransition(async () => {
      const result = await signIn(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        router.push(prefix)
        router.refresh()
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href={prefix} className="inline-flex items-center gap-2 mb-6">
            <span className="text-3xl">⚽</span>
            <span className="font-bold text-white text-xl">WC26 <span className="text-fifa-gold">Predictor</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Sign in</h1>
          <p className="text-slate-400 text-sm mt-1">Welcome back</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface-card border border-surface-border rounded-xl p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-fifa-gold transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-fifa-gold transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-fifa-gold text-black font-bold py-2.5 rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-4">
          Don&apos;t have an account?{' '}
          <Link href={`${prefix}/register`} className="text-fifa-gold hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}
