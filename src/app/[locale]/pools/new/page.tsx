'use client'
// src/app/[locale]/pools/new/page.tsx
import { useParams } from 'next/navigation'
import { useFormState, useFormStatus } from 'react-dom'
import { createPool } from '@/app/actions/pools'
import Link from 'next/link'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-fifa-gold text-black font-bold py-3 rounded-xl hover:bg-yellow-400 transition-colors disabled:opacity-60"
    >
      {pending ? 'Creando…' : 'Crear grupo'}
    </button>
  )
}

export default function NewPoolPage() {
  const params = useParams()
  const locale = params.locale as string
  const [state, action] = useFormState(createPool, undefined)

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <Link href={`/${locale}/pools`} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
        ← Mis grupos
      </Link>

      <h1 className="text-3xl font-black text-white mt-6 mb-2">Nuevo grupo</h1>
      <p className="text-slate-400 text-sm mb-8">
        Crea tu quinela e invita a tus amigos con un código único.
      </p>

      <form action={action} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <div>
          <label className="block text-xs text-slate-500 uppercase tracking-widest mb-2">
            Nombre del grupo
          </label>
          <input
            name="name"
            type="text"
            required
            minLength={3}
            maxLength={60}
            placeholder="Ej: Los Cracks del Trabajo"
            className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-fifa-gold focus:outline-none text-sm"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-red-400">{state.error}</p>
        )}

        <SubmitButton />
      </form>

      <div className="mt-8 p-4 border border-surface-border rounded-xl">
        <h3 className="text-sm font-semibold text-white mb-3">¿Cómo funciona?</h3>
        <ul className="space-y-2 text-sm text-slate-400">
          <li className="flex gap-2"><span className="text-fifa-gold">1.</span> Crea el grupo y obtén un código de invitación</li>
          <li className="flex gap-2"><span className="text-fifa-gold">2.</span> Comparte el código con tus amigos</li>
          <li className="flex gap-2"><span className="text-fifa-gold">3.</span> Cada uno predice el marcador de los partidos</li>
          <li className="flex gap-2"><span className="text-fifa-gold">4.</span> Marcador exacto = 3 pts · Ganador = 1 pt · Fallo = 0 pts</li>
          <li className="flex gap-2"><span className="text-fifa-gold">5.</span> Sigue la tabla de posiciones en tiempo real</li>
        </ul>
      </div>
    </div>
  )
}
