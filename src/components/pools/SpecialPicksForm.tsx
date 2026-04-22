'use client'
// src/components/pools/SpecialPicksForm.tsx
import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { submitSpecialPick } from '@/app/actions/pools'

const SPECIAL_PICKS_DEADLINE = new Date('2026-06-11T18:00:00Z')

interface SpecialPicksFormProps {
  poolId: string
  existing: {
    top_scorer_tournament: string | null
    top_scorer_group_phase: string | null
  } | null
}

export function SpecialPicksForm({ poolId, existing }: SpecialPicksFormProps) {
  const t = useTranslations('pools')
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
          <p className="text-xs text-red-400 font-medium">{t('special_locked')}</p>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-white mb-1">{t('group_scorer_title')}</h3>
        <p className="text-xs text-slate-500 mb-3">{t('group_scorer_desc')}</p>
        <input
          type="text"
          value={groupPhase}
          onChange={e => { setGroupPhase(e.target.value); setSaved(false) }}
          placeholder="Kylian Mbappé"
          maxLength={100}
          disabled={isLocked}
          className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-fifa-gold focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-1">{t('tournament_scorer_title')}</h3>
        <p className="text-xs text-slate-500 mb-3">{t('tournament_scorer_desc')}</p>
        <input
          type="text"
          value={tournament}
          onChange={e => { setTournament(e.target.value); setSaved(false) }}
          placeholder="Lionel Messi"
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
        {isPending ? t('saving') : saved ? t('saved') : t('save_special')}
      </button>

      <p className="text-xs text-slate-600 text-center">
        {isLocked ? t('deadline_locked') : t('deadline_open', { date: deadlineLabel })}
      </p>
    </div>
  )
}
