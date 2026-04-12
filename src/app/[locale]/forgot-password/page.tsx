'use client'
// src/app/[locale]/forgot-password/page.tsx
import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { LogoMark } from '@/components/layout/LogoMark'

export default function ForgotPasswordPage() {
  const params = useParams()
  const locale = (params?.locale as string) || 'es'
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!email) return
    setError(null)
    setLoading(true)

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/api/auth/callback?type=recovery&locale=${locale}`,
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href={`/${locale}`} className="inline-flex mb-6">
            <LogoMark />
          </Link>
          <h1 className="text-2xl font-bold text-white">Recuperar contraseña</h1>
          <p className="text-slate-400 text-sm mt-1">
            Te enviamos un link para restablecer tu contraseña
          </p>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-xl p-6 space-y-4">
          {sent ? (
            <div className="text-center py-4">
              <p className="text-2xl mb-3">📬</p>
              <p className="text-white font-semibold mb-1">Revisa tu correo</p>
              <p className="text-slate-400 text-sm">
                Si <span className="text-white">{email}</span> tiene una cuenta, recibirás el link en unos minutos.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  autoComplete="email"
                  placeholder="tu@email.com"
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-fifa-gold transition-colors"
                />
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !email}
                className="w-full bg-fifa-green text-white font-bold py-2.5 rounded-lg hover:bg-green-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando…' : 'Enviar link de recuperación'}
              </button>
            </>
          )}
        </div>

        <p className="text-center text-sm text-slate-400 mt-4">
          <Link href={`/${locale}/login`} className="text-fifa-gold hover:underline">
            ← Volver al login
          </Link>
        </p>
      </div>
    </div>
  )
}
