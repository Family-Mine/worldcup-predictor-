// src/components/matches/MatchCard.tsx
import Link from 'next/link'
import { useLocale } from 'next-intl'
import type { MatchWithTeams } from '@/types/database'
import { TeamFlag } from '@/components/teams/TeamFlag'
import { formatMatchDateShort } from '@/lib/utils'

interface MatchCardProps {
  match: MatchWithTeams
}

export function MatchCard({ match }: MatchCardProps) {
  const locale = useLocale()
  const prefix = `/${locale}`
  const isFinished = match.status === 'finished'
  const isLive = match.status === 'live'

  return (
    <Link href={`${prefix}/matches/${match.id}`}>
      <div className="bg-surface-card border border-surface-border rounded-xl px-4 py-3 hover:border-slate-500 transition-colors flex items-center gap-4">
        <span className="text-xs text-slate-500 w-16 flex-shrink-0">
          {formatMatchDateShort(match.scheduled_at)}
        </span>

        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="text-sm text-white font-medium text-right">{match.home_team.name}</span>
          <TeamFlag countryCode={match.home_team.country_code} name={match.home_team.name} size="sm" />
        </div>

        <div className="flex items-center gap-1 mx-2 min-w-[60px] justify-center">
          {isFinished || isLive ? (
            <span className={`text-lg font-black tabular-nums ${isLive ? 'text-green-400' : 'text-white'}`}>
              {match.home_score ?? 0} – {match.away_score ?? 0}
            </span>
          ) : (
            <span className="text-xs text-slate-500 font-medium">vs</span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-1">
          <TeamFlag countryCode={match.away_team.country_code} name={match.away_team.name} size="sm" />
          <span className="text-sm text-white font-medium">{match.away_team.name}</span>
        </div>

        <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
          match.status === 'live' ? 'bg-green-500/20 text-green-400' :
          match.status === 'finished' ? 'bg-surface-border text-slate-500' :
          'bg-surface-border text-slate-400'
        }`}>
          {match.status === 'live' ? '● LIVE' : match.status === 'finished' ? 'FT' : 'SCH'}
        </span>
      </div>
    </Link>
  )
}
