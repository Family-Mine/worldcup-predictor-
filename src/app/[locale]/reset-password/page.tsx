'use client'
// src/app/[locale]/reset-password/page.tsx
import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { LogoMark } from '@/components/layout/LogoMark'

export default function ResetPasswordPage() {
  const params = useParams()
  const locale = (params?.locale as string) || 'es'
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!password || password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setError(null)
    setLoading(true)

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await supabase.auth.updateUser({ password })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setDone(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href={`/${locale}`} className="inline-flex mb-6">
            <LogoMark />
          </Link>
          <h1 className="text-2xl font-bold text-white">Nueva contraseña</h1>
          <p className="text-slate-400 text-sm mt-1">Elige una contraseña segura</p>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-xl p-6 space-y-4">
          {done ? (
            <div className="text-center py-4">
              <p className="text-2xl mb-3">✅</p>
              <p className="text-white font-semibold mb-3">Contraseña actualizada</p>
              <Link
                href={`/${locale}/login`}
                className="inline-block bg-fifa-green text-white font-bold px-6 py-2.5 rounded-lg hover:bg-green-500 transition-colors text-sm"
              >
                Ir al login
              </Link>
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
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-fifa-gold transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-fifa-gold transition-colors"
                />
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !password || !confirm}
                className="w-full bg-fifa-green text-white font-bold py-2.5 rounded-lg hover:bg-green-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Guardando…' : 'Guardar contraseña'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
