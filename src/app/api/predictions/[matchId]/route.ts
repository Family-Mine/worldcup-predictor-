// src/app/api/predictions/[matchId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculatePrediction, TeamInput } from '@/lib/poisson'

const CACHE_HOURS = 6

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const { matchId } = params
  const db = supabase()

  // Check cache
  const { data: cached } = await db
    .from('predictions')
    .select('*')
    .eq('match_id', matchId)
    .single()

  if (cached) {
    const age = (Date.now() - new Date(cached.updated_at).getTime()) / 3600000
    if (age < CACHE_HOURS) {
      return NextResponse.json(cached)
    }
  }

  // Fetch match with teams
  const { data: match, error: matchErr } = await db
    .from('matches')
    .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
    .eq('id', matchId)
    .single()

  if (matchErr || !match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  }

  // Fetch stats (recency-weighted: 2025 counts 2x)
  async function getTeamInput(teamId: string): Promise<TeamInput> {
    const { data: stats } = await db
      .from('team_stats')
      .select('*')
      .eq('team_id', teamId)
      .in('period', ['2024', '2025'])

    if (!stats || stats.length === 0) {
      return { matches_played: 20, goals_for: 20, goals_against: 20, wins: 8, draws: 4 }
    }

    let mp = 0, gf = 0, ga = 0, w = 0, d = 0
    for (const s of stats) {
      const weight = s.period === '2025' ? 2 : 1
      mp += s.matches_played * weight
      gf += s.goals_for      * weight
      ga += s.goals_against  * weight
      w  += s.wins           * weight
      d  += s.draws          * weight
    }
    return { matches_played: mp, goals_for: gf, goals_against: ga, wins: w, draws: d }
  }

  // Fetch active news impact for each team
  async function getNewsImpact(teamId: string): Promise<number> {
    const { data: news } = await db
      .from('news_items')
      .select('impact_weight')
      .eq('team_id', teamId)
      .eq('active', true)
    if (!news) return 0
    return news.reduce((sum: number, n: { impact_weight: number }) => sum + (n.impact_weight ?? 0), 0)
  }

  const [homeInput, awayInput, homeImpact, awayImpact] = await Promise.all([
    getTeamInput(match.home_team_id),
    getTeamInput(match.away_team_id),
    getNewsImpact(match.home_team_id),
    getNewsImpact(match.away_team_id),
  ])

  const result = calculatePrediction(homeInput, awayInput, homeImpact, awayImpact)

  const predictedWinner =
    result.home_win_prob > result.away_win_prob && result.home_win_prob > result.draw_prob
      ? 'home'
      : result.away_win_prob > result.draw_prob
      ? 'away'
      : 'draw'

  const prediction = {
    match_id: matchId,
    home_win_prob:        result.home_win_prob,
    draw_prob:            result.draw_prob,
    away_win_prob:        result.away_win_prob,
    predicted_home_score: result.predicted_home_score,
    predicted_away_score: result.predicted_away_score,
    predicted_winner:     predictedWinner,
    confidence_level:     result.confidence_level,
    ai_narrative_en:      null,
    ai_narrative_es:      null,
    updated_at:           new Date().toISOString(),
  }

  // Upsert to cache
  await db.from('predictions').upsert(prediction, { onConflict: 'match_id' })

  return NextResponse.json(prediction)
}
