'use client'
// src/components/pools/PicksGrid.tsx
import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
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

function TeamLabel({ team, slot, side }: {
  team: MatchWithTeams['home_team']
  slot: string | null
  side: 'home' | 'away'
}) {
  if (!team) {
    return (
      <span className="text-xs font-mono font-bold text-slate-500 bg-surface-border px-2 py-1 rounded">
        {slot ?? '?'}
      </span>
    )
  }
  return (
    <div className={`flex items-center gap-2 ${side === 'home' ? 'flex-row-reverse' : 'flex-row'}`}>
      {team.flag_url && (
        <Image
          src={team.flag_url}
          alt={team.name}
          width={24} height={16}
          className="rounded-sm object-cover"
          unoptimized
        />
      )}
      <span className="text-sm font-medium text-slate-300 hidden sm:block truncate max-w-[100px]">
        {team.name}
      </span>
    </div>
  )
}

export function PicksGrid({ poolId, matches, existingPicks }: PicksGridProps) {
  const t = useTranslations('pools')
  const [, startTransition] = useTransition()

  const stageLabel = (stage: string): string => {
    const labels: Record<string, string> = {
      r32:   t('stage_r32'),
      r16:   t('stage_r16'),
      qf:    t('stage_qf'),
      sf:    t('stage_sf'),
      '3rd': t('stage_3rd'),
      final: t('stage_final'),
    }
    return labels[stage] ?? stage
  }

  const STAGE_ORDER: Record<string, number> = {
    r32: 1, r16: 2, qf: 3, sf: 4, '3rd': 5, final: 6,
  }

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
    if (s.home === '' || s.away === '') return
    const home = parseInt(s.home, 10)
    const away = parseInt(s.away, 10)
    if (isNaN(home) || isNaN(away) || home < 0 || away < 0) {
      setScores(prev => ({ ...prev, [match.id]: { ...prev[match.id], error: t('invalid_score') } }))
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

  const groups: Record<string, { matches: MatchWithTeams[]; stageKey: string }> = {}
  for (const m of matches) {
    const stageKey = m.group_letter ? '' : m.stage
    const key = m.group_letter
      ? `${t('group_prefix')} ${m.group_letter}`
      : stageLabel(m.stage)
    if (!groups[key]) groups[key] = { matches: [], stageKey }
    groups[key].matches.push(m)
  }

  return (
    <div className="space-y-6">
      {Object.entries(groups).sort(([, a], [, b]) => {
        const oa = STAGE_ORDER[a.stageKey] ?? 0
        const ob = STAGE_ORDER[b.stageKey] ?? 0
        if (oa && ob) return oa - ob
        if (oa || ob) return oa ? 1 : -1
        return 0
      }).map(([groupKey, { matches: gMatches }]) => (
        <div key={groupKey} className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border bg-white/[0.02]">
            <span className="w-7 h-7 rounded-lg bg-fifa-gold/10 border border-fifa-gold/30 flex items-center justify-center text-xs font-black text-fifa-gold">
              {groupKey.replace(`${t('group_prefix')} `, '')}
            </span>
            <span className="text-sm font-semibold text-slate-300">{groupKey}</span>
          </div>

          <div className="divide-y divide-surface-border/50">
            {gMatches.map(match => {
              const isTBD = match.home_team_id === null || match.away_team_id === null
              const locked = isTBD || isMatchLocked(match)
              const s = scores[match.id] ?? { home: '', away: '', saved: false }
              const hasPick = s.home !== '' && s.away !== ''
              const kickoff = new Date(match.scheduled_at).toLocaleDateString('es', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
              })

              return (
                <div key={match.id} className={`px-4 py-3 ${locked ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center flex-1 justify-end">
                      <TeamLabel team={match.home_team} slot={match.home_slot} side="home" />
                    </div>

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

                    <div className="flex items-center flex-1">
                      <TeamLabel team={match.away_team} slot={match.away_slot} side="away" />
                    </div>

                    <div className="w-20 text-right flex-shrink-0">
                      {isTBD ? (
                        <span className="text-xs text-slate-600">{t('tbd')}</span>
                      ) : locked ? (
                        <span className="text-xs text-slate-600">{t('locked')}</span>
                      ) : s.error ? (
                        <span className="text-xs text-red-400">Error</span>
                      ) : s.saved && hasPick ? (
                        <span className="text-xs text-green-400">✓</span>
                      ) : hasPick ? (
                        <span className="text-xs text-slate-500">{t('unsaved')}</span>
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

      <p className="text-xs text-slate-600 text-center">{t('auto_save_note')}</p>
    </div>
  )
}
