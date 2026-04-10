'use client'
// src/components/pools/SpecialPicksForm.tsx
import { useState, useTransition } from 'react'
import { submitSpecialPick } from '@/app/actions/pools'

interface SpecialPicksFormProps {
  poolId: string
  existing: {
    top_scorer_tournament: string | null
    top_scorer_group_phase: string | null
  } | null
}

export function SpecialPicksForm({ poolId, existing }: SpecialPicksFormProps) {
  const [tournament, setTournament] = useState(existing?.top_scorer_tournament ?? '')
  const [groupPhase, setGroupPhase] = useState(existing?.top_scorer_group_phase ?? '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      const result = await submitSpecialPick(poolId, tournament, groupPhase)
      if (result.error) {
        setError(result.error)
      } else {
        setSaved(true)
        setError(null)
        setTimeout(() => setSaved(false), 3000)
      }
    })
  }

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-6 space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-white mb-1">⚽ Goleador de la Fase de Grupos</h3>
        <p className="text-xs text-slate-500 mb-3">¿Quién anota más goles en la fase de grupos?</p>
        <input
          type="text"
          value={groupPhase}
          onChange={e => { setGroupPhase(e.target.value); setSaved(false) }}
          placeholder="Ej: Kylian Mbappé"
          maxLength={100}
          className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-fifa-gold focus:outline-none"
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-1">🏆 Goleador del Torneo</h3>
        <p className="text-xs text-slate-500 mb-3">¿Quién termina como el máximo goleador de todo el Mundial?</p>
        <input
          type="text"
          value={tournament}
          onChange={e => { setTournament(e.target.value); setSaved(false) }}
          placeholder="Ej: Lionel Messi"
          maxLength={100}
          className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-fifa-gold focus:outline-none"
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        onClick={handleSave}
        disabled={isPending}
        className="w-full bg-fifa-green text-white font-bold py-2.5 rounded-xl hover:bg-green-500 transition-colors disabled:opacity-60"
      >
        {isPending ? 'Guardando…' : saved ? '✓ Guardado' : 'Guardar predicciones especiales'}
      </button>

      <p className="text-xs text-slate-600 text-center">
        Se pueden cambiar hasta el inicio de cada fase
      </p>
    </div>
  )
}
