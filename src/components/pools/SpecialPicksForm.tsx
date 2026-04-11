'use client'
// src/components/pools/SpecialPicksForm.tsx
import { useState, useTransition } from 'react'
import { submitSpecialPick } from '@/app/actions/pools'

// Locks at WC26 kickoff — June 11, 2026 18:00 UTC
const SPECIAL_PICKS_DEADLINE = new Date('2026-06-11T18:00:00Z')

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
  const isLocked = Date.now() >= SPECIAL_PICKS_DEADLINE.getTime()
  const deadlineLabel = SPECIAL_PICKS_DEADLINE.toLocaleDateString('es-CO', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota',
  })

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
      {isLocked && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
          <p className="text-xs text-red-400 font-medium">🔒 Predicciones cerradas — el torneo ya comenzó</p>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-white mb-1">⚽ Goleador de la Fase de Grupos</h3>
        <p className="text-xs text-slate-500 mb-3">¿Quién anota más goles en la fase de grupos?</p>
        <input
          type="text"
          value={groupPhase}
          onChange={e => { setGroupPhase(e.target.value); setSaved(false) }}
          placeholder="Ej: Kylian Mbappé"
          maxLength={100}
          disabled={isLocked}
          className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-fifa-gold focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
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
          disabled={isLocked}
          className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-fifa-gold focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        onClick={handleSave}
        disabled={isPending || isLocked}
        className="w-full bg-fifa-green text-white font-bold py-2.5 rounded-xl hover:bg-green-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? 'Guardando…' : saved ? '✓ Guardado' : 'Guardar predicciones especiales'}
      </button>

      <p className="text-xs text-slate-600 text-center">
        {isLocked ? 'Predicciones cerradas' : `Cierra el ${deadlineLabel} (hora Colombia)`}
      </p>
    </div>
  )
}
