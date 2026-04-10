'use client'
// src/app/[locale]/pools/join/page.tsx
import { useParams, useSearchParams } from 'next/navigation'
import { useFormState, useFormStatus } from 'react-dom'
import { joinPool } from '@/app/actions/pools'
import Link from 'next/link'
import { Suspense } from 'react'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-fifa-green text-white font-bold py-3 rounded-xl hover:bg-green-500 transition-colors disabled:opacity-60"
    >
      {pending ? 'Uniéndome…' : 'Unirme al grupo'}
    </button>
  )
}

function JoinForm({ locale }: { locale: string }) {
  const searchParams = useSearchParams()
  const code = searchParams.get('code') ?? ''
  const [state, action] = useFormState(joinPool, undefined)

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <div>
        <label className="block text-xs text-slate-500 uppercase tracking-widest mb-2">
          Código de invitación
        </label>
        <input
          name="code"
          type="text"
          required
          defaultValue={code}
          placeholder="Ej: ABCD1234"
          maxLength={8}
          className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-fifa-gold focus:outline-none text-sm font-mono uppercase tracking-widest text-center"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-400">{state.error}</p>
      )}

      <SubmitButton />
    </form>
  )
}

export default function JoinPoolPage() {
  const params = useParams()
  const locale = params.locale as string

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <Link href={`/${locale}/pools`} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
        ← Mis grupos
      </Link>

      <h1 className="text-3xl font-black text-white mt-6 mb-2">Unirme a un grupo</h1>
      <p className="text-slate-400 text-sm mb-8">
        Ingresa el código que te compartió tu amigo.
      </p>

      <Suspense fallback={<div className="h-32" />}>
        <JoinForm locale={locale} />
      </Suspense>

      <p className="text-center text-sm text-slate-500 mt-6">
        ¿No tienes código?{' '}
        <Link href={`/${locale}/pools/new`} className="text-fifa-gold hover:underline">
          Crea tu propio grupo
        </Link>
      </p>
    </div>
  )
}
