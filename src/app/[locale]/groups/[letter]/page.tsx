// src/app/[locale]/groups/[letter]/page.tsx
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { TeamFlag } from '@/components/teams/TeamFlag'
import { FormBadge } from '@/components/teams/FormBadge'
import { MatchCard } from '@/components/matches/MatchCard'
import type { Team, MatchWithTeams, GroupStanding } from '@/types/database'
import { calculatePoints } from '@/lib/utils'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const revalidate = 3600

export default async function GroupPage({ params }: { params: { letter: string; locale: string } }) {
  const letter = params.letter.toUpperCase()
  const locale = params.locale
  const prefix = `/${locale}`
  const supabase = getSupabaseServerClient()

  const [{ data: teams, error: teamsError }, { data: matches }] = await Promise.all([
    supabase.from('teams').select('*').eq('group_letter', letter),
    supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(*),
        away_team:teams!matches_away_team_id_fkey(*)
      `)
      .eq('group_letter', letter)
      .order('scheduled_at', { ascending: true }),
  ])

  if (teamsError || !teams || teams.length === 0) notFound()

  const standings: GroupStanding[] = (teams as Team[]).map(team => {
    const teamMatches = ((matches as MatchWithTeams[]) ?? []).filter(
      m => m.status === 'finished' &&
        (m.home_team_id === team.id || m.away_team_id === team.id)
    )
    let won = 0, drawn = 0, lost = 0, gf = 0, ga = 0
    teamMatches.forEach(m => {
      const isHome = m.home_team_id === team.id
      const teamGoals = isHome ? (m.home_score ?? 0) : (m.away_score ?? 0)
      const oppGoals = isHome ? (m.away_score ?? 0) : (m.home_score ?? 0)
      gf += teamGoals
      ga += oppGoals
      if (teamGoals > oppGoals) won++
      else if (teamGoals === oppGoals) drawn++
      else lost++
    })
    return {
      team,
      group_letter: letter,
      played: won + drawn + lost,
      won, drawn, lost,
      goals_for: gf,
      goals_against: ga,
      goal_difference: gf - ga,
      points: calculatePoints(won, drawn),
    }
  }).sort((a, b) => b.points - a.points || b.goal_difference - a.goal_difference)

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-2">
        <Link href={`${prefix}/groups`} className="text-slate-500 text-sm hover:text-slate-300">← Groups</Link>
      </div>
      <div className="mb-8">
        <span className="text-slate-400 text-sm uppercase tracking-widest">Group</span>
        <h1 className="text-4xl font-black text-white">{letter}</h1>
      </div>

      {/* Standings */}
      <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden mb-10">
        <div className="grid grid-cols-[1fr,auto,auto,auto,auto,auto,auto] gap-x-3 px-4 py-2 text-xs text-slate-500 uppercase tracking-wider border-b border-surface-border">
          <span>Team</span>
          <span className="text-center w-6">P</span>
          <span className="text-center w-6">W</span>
          <span className="text-center w-6">D</span>
          <span className="text-center w-6">L</span>
          <span className="text-center w-8">GD</span>
          <span className="text-center w-8 font-bold text-white">Pts</span>
        </div>
        {standings.map((s, i) => (
          <Link href={`${prefix}/teams/${s.team.id}`} key={s.team.id}>
            <div className="grid grid-cols-[1fr,auto,auto,auto,auto,auto,auto] gap-x-3 px-4 py-3 items-center border-b border-surface-border last:border-0 hover:bg-surface-border/30 transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-slate-500 text-sm w-4 flex-shrink-0">{i + 1}</span>
                <TeamFlag countryCode={s.team.country_code} name={s.team.name} size="sm" />
                <span className="text-sm text-white font-medium truncate">{s.team.name}</span>
                <div className="hidden sm:block ml-1">
                  <FormBadge form={s.team.current_form} />
                </div>
              </div>
              <span className="text-center text-sm text-slate-300 w-6">{s.played}</span>
              <span className="text-center text-sm text-green-400 w-6">{s.won}</span>
              <span className="text-center text-sm text-yellow-400 w-6">{s.drawn}</span>
              <span className="text-center text-sm text-red-400 w-6">{s.lost}</span>
              <span className="text-center text-sm text-slate-300 w-8">{s.goal_difference > 0 ? `+${s.goal_difference}` : s.goal_difference}</span>
              <span className="text-center text-sm font-bold text-white w-8">{s.points}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Fixtures */}
      <h2 className="text-xl font-bold text-white mb-4">Fixtures</h2>
      {(matches as MatchWithTeams[] ?? []).length === 0 ? (
        <p className="text-slate-500 text-sm">No fixtures scheduled yet.</p>
      ) : (
        <div className="space-y-3">
          {(matches as MatchWithTeams[]).map(match => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  )
}
