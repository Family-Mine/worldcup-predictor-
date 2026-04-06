// src/lib/getPrediction.ts
import { createClient } from '@supabase/supabase-js'
import { calculatePrediction } from './poisson'

const CACHE_HOURS = 6

export interface Prediction {
  match_id: string
  home_win_prob: number
  draw_prob: number
  away_win_prob: number
  predicted_home_score: number
  predicted_away_score: number
  predicted_winner: string
  confidence_level: 'high' | 'medium' | 'low'
  ai_narrative_en: string | null
  ai_narrative_es: string | null
  updated_at: string
}

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function getPrediction(matchId: string): Promise<Prediction | null> {
  const supabase = db()

  // Return cached if fresh
  const { data: cached } = await supabase
    .from('predictions')
    .select('*')
    .eq('match_id', matchId)
    .single()

  if (cached) {
    const ageHours = (Date.now() - new Date(cached.updated_at).getTime()) / 3600000
    if (ageHours < CACHE_HOURS) return cached as Prediction
  }

  // Fetch stats weighted: 2025 = 2x, 2024 = 1x
  async function teamInput(teamId: string) {
    const { data } = await supabase
      .from('team_stats')
      .select('*')
      .eq('team_id', teamId)
      .in('period', ['2024', '2025'])

    if (!data || data.length === 0) {
      return { matches_played: 20, goals_for: 20, goals_against: 20, wins: 8, draws: 4 }
    }

    let mp = 0, gf = 0, ga = 0, w = 0, d = 0
    for (const s of data) {
      const weight = s.period === '2025' ? 2 : 1
      mp += s.matches_played * weight
      gf += s.goals_for      * weight
      ga += s.goals_against  * weight
      w  += s.wins           * weight
      d  += s.draws          * weight
    }
    return { matches_played: mp, goals_for: gf, goals_against: ga, wins: w, draws: d }
  }

  async function newsImpact(teamId: string): Promise<number> {
    const { data } = await supabase
      .from('news_items')
      .select('impact_weight')
      .eq('team_id', teamId)
      .eq('active', true)
    return (data ?? []).reduce((s: number, n: { impact_weight: number }) => s + (n.impact_weight ?? 0), 0)
  }

  // Get match home/away team IDs
  const { data: match } = await supabase
    .from('matches')
    .select('home_team_id, away_team_id')
    .eq('id', matchId)
    .single()

  if (!match) return null

  const [homeStats, awayStats, homeImpact, awayImpact] = await Promise.all([
    teamInput(match.home_team_id),
    teamInput(match.away_team_id),
    newsImpact(match.home_team_id),
    newsImpact(match.away_team_id),
  ])

  const result = calculatePrediction(homeStats, awayStats, homeImpact, awayImpact)

  const winner =
    result.home_win_prob > result.away_win_prob && result.home_win_prob > result.draw_prob
      ? 'home'
      : result.away_win_prob > result.draw_prob
      ? 'away'
      : 'draw'

  const prediction: Prediction = {
    match_id:             matchId,
    home_win_prob:        result.home_win_prob,
    draw_prob:            result.draw_prob,
    away_win_prob:        result.away_win_prob,
    predicted_home_score: result.predicted_home_score,
    predicted_away_score: result.predicted_away_score,
    predicted_winner:     winner,
    confidence_level:     result.confidence_level,
    ai_narrative_en:      null,
    ai_narrative_es:      null,
    updated_at:           new Date().toISOString(),
  }

  await supabase.from('predictions').upsert(prediction, { onConflict: 'match_id' })

  return prediction
}
