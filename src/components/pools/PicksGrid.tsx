'use client'
// src/components/pools/PicksGrid.tsx
import { useState, useTransition } from 'react'
import { submitPick } from '@/app/actions/pools'
import { isMatchLocked } from '@/lib/pools'
import type { MatchWithTeams } from '@/types/database'
import type { PoolPick } from '@/types/pools'
import Image from 'next/image'

interface PicksGridProps {
  poolId: string
  matches: MatchWithTeams[]
  existingPicks: PoolPick[]
}

type ScoreMap = Record<string, { home: string; away: string; saved: boolean; error?: string }>

export function PicksGrid({ poolId, matches, existingPicks }: PicksGridProps) {
  const [isPending, startTransition] = useTransition()

  // Build initial state from existing picks
  const initial: ScoreMap = {}
  for (const p of existingPicks) {
    initial[p.match_id] = {
      home: String(p.home_score),
      away: String(p.away_score),
      saved: true,
    }
  }
  const [scores, setScores] = useState<ScoreMap>(initial)

  function update(matchId: string, side: 'home' | 'away', val: string) {
    setScores(prev => ({
      ...prev,
      [matchId]: { ...prev[matchId], [side]: val, saved: false, error: undefined },
    }))
  }

  function save(match: MatchWithTeams) {
    const s = scores[match.id]
    if (!s) return
    // Don't save or error if either field is still empty
    if (s.home === '' || s.away === '') return
    const home = parseInt(s.home, 10)
    const away = parseInt(s.away, 10)
    if (isNaN(home) || isNaN(away) || home < 0 || away < 0) {
      setScores(prev => ({ ...prev, [match.id]: { ...prev[match.id], error: 'Marcador inválido.' } }))
      return
    }

    startTransition(async () => {
      const result = await submitPick(poolId, match.id, home, away)
      setScores(prev => ({
        ...prev,
        [match.id]: {
          ...prev[match.id],
          saved: !result.error,
          error: result.error,
        },
      }))
    })
  }

  // Group by group_letter
  const groups: Record<string, MatchWithTeams[]> = {}
  for (const m of matches) {
    const g = m.group_letter ?? 'Knockout'
    if (!groups[g]) groups[g] = []
    groups[g].push(m)
  }

  return (
    <div className="space-y-6">
      {Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([letter, gMatches]) => (
        <div key={letter} className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
          {/* Group header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border bg-white/[0.02]">
            <span className="w-7 h-7 rounded-lg bg-fifa-gold/10 border border-fifa-gold/30 flex items-center justify-center text-xs font-black text-fifa-gold">
              {letter}
            </span>
            <span className="text-sm font-semibold text-slate-300">Grupo {letter}</span>
          </div>

          <div className="divide-y divide-surface-border/50">
            {gMatches.map(match => {
              const locked = isMatchLocked(match)
              const s = scores[match.id] ?? { home: '', away: '', saved: false }
              const hasPick = s.home !== '' && s.away !== ''
              const kickoff = new Date(match.scheduled_at).toLocaleDateString('es', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
              })

              return (
                <div key={match.id} className={`px-4 py-3 ${locked ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-3">
                    {/* Home team */}
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <span className="text-sm font-medium text-slate-300 hidden sm:block truncate max-w-[100px] text-right">
                        {match.home_team.name}
                      </span>
                      {match.home_team.flag_url && (
                        <Image
                          src={match.home_team.flag_url}
                          alt={match.home_team.name}
                          width={24} height={16}
                          className="rounded-sm object-cover"
                          unoptimized
                        />
                      )}
                    </div>

                    {/* Score inputs */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={2}
                        value={s.home}
                        onChange={e => update(match.id, 'home', e.target.value.replace(/\D/g, ''))}
                        onBlur={() => save(match)}
                        disabled={locked}
                        placeholder="–"
                        className="w-10 h-10 text-center text-lg font-black bg-surface border border-surface-border rounded-lg text-white focus:border-fifa-gold focus:outline-none disabled:cursor-not-allowed placeholder-slate-600"
                      />
                      <span className="text-slate-600 font-bold">–</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={2}
                        value={s.away}
                        onChange={e => update(match.id, 'away', e.target.value.replace(/\D/g, ''))}
                        onBlur={() => save(match)}
                        disabled={locked}
                        placeholder="–"
                        className="w-10 h-10 text-center text-lg font-black bg-surface border border-surface-border rounded-lg text-white focus:border-fifa-gold focus:outline-none disabled:cursor-not-allowed placeholder-slate-600"
                      />
                    </div>

                    {/* Away team */}
                    <div className="flex items-center gap-2 flex-1">
                      {match.away_team.flag_url && (
                        <Image
                          src={match.away_team.flag_url}
                          alt={match.away_team.name}
                          width={24} height={16}
                          className="rounded-sm object-cover"
                          unoptimized
                        />
                      )}
                      <span className="text-sm font-medium text-slate-300 hidden sm:block truncate max-w-[100px]">
                        {match.away_team.name}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="w-16 text-right flex-shrink-0">
                      {locked ? (
                        <span className="text-xs text-slate-600">🔒 Cerrado</span>
                      ) : s.error ? (
                        <span className="text-xs text-red-400">Error</span>
                      ) : s.saved && hasPick ? (
                        <span className="text-xs text-green-400">✓</span>
                      ) : hasPick ? (
                        <span className="text-xs text-slate-500">Sin guardar</span>
                      ) : (
                        <span className="text-xs text-slate-600">{kickoff}</span>
                      )}
                    </div>
                  </div>
                  {s.error && (
                    <p className="text-xs text-red-400 text-center mt-1">{s.error}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <p className="text-xs text-slate-600 text-center">
        Las predicciones se guardan automáticamente · Se cierran 5 minutos antes del partido
      </p>
    </div>
  )
}
