// src/components/matches/MatchHeader.tsx
import type { MatchWithTeams } from '@/types/database'
import { TeamFlag } from '@/components/teams/TeamFlag'
import { formatMatchDate } from '@/lib/utils'

interface MatchHeaderProps {
  match: MatchWithTeams
}

export function MatchHeader({ match }: MatchHeaderProps) {
  const isFinished = match.status === 'finished'
  const isLive = match.status === 'live'

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-8 text-center">
      <div className="flex items-center justify-center gap-2 mb-4">
        {match.stage === 'group' && match.group_letter && (
          <span className="text-xs text-slate-500 uppercase tracking-widest">
            Group {match.group_letter}
          </span>
        )}
        {match.venue && (
          <>
            <span className="text-slate-700">·</span>
            <span className="text-xs text-slate-500">{match.venue}</span>
          </>
        )}
        {isLive && (
          <span className="inline-flex items-center gap-1 text-xs text-green-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            LIVE
          </span>
        )}
      </div>

      <div className="flex items-center justify-center gap-6 md:gap-12">
        <div className="flex flex-col items-center gap-3 flex-1">
          <TeamFlag countryCode={match.home_team.country_code} name={match.home_team.name} size="xl" />
          <span className="text-lg md:text-xl font-bold text-white text-center">{match.home_team.name}</span>
          <span className="text-xs text-slate-500">#{match.home_team.fifa_ranking} FIFA</span>
        </div>

        <div className="flex flex-col items-center min-w-[80px] md:min-w-[120px]">
          {isFinished ? (
            <span className="text-4xl md:text-5xl font-black text-white tabular-nums">
              {match.home_score}–{match.away_score}
            </span>
          ) : isLive ? (
            <span className="text-4xl md:text-5xl font-black text-green-400 tabular-nums">
              {match.home_score ?? 0}–{match.away_score ?? 0}
            </span>
          ) : (
            <>
              <span className="text-3xl font-black text-slate-500">vs</span>
              <span className="text-xs text-slate-500 mt-2 text-center">
                {formatMatchDate(match.scheduled_at)}
              </span>
            </>
          )}
        </div>

        <div className="flex flex-col items-center gap-3 flex-1">
          <TeamFlag countryCode={match.away_team.country_code} name={match.away_team.name} size="xl" />
          <span className="text-lg md:text-xl font-bold text-white text-center">{match.away_team.name}</span>
          <span className="text-xs text-slate-500">#{match.away_team.fifa_ranking} FIFA</span>
        </div>
      </div>
    </div>
  )
}
