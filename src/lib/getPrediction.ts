// src/lib/getPrediction.ts
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
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

  // Generate Claude narratives if API key is available
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

      const { data: matchFull } = await supabase
        .from('matches')
        .select('*, home_team:teams!matches_home_team_id_fkey(name,fifa_ranking,confederation,current_form), away_team:teams!matches_away_team_id_fkey(name,fifa_ranking,confederation,current_form)')
        .eq('id', matchId)
        .single()

      if (matchFull) {
        const home = matchFull.home_team as { name: string; fifa_ranking: number; confederation: string; current_form: string }
        const away = matchFull.away_team as { name: string; fifa_ranking: number; confederation: string; current_form: string }
        const scoreStr = `${prediction.predicted_home_score}–${prediction.predicted_away_score}`
        const winner = prediction.predicted_winner === 'home' ? home.name : prediction.predicted_winner === 'away' ? away.name : 'a draw'
        const probStr = `${home.name} ${Math.round(prediction.home_win_prob * 100)}% / Draw ${Math.round(prediction.draw_prob * 100)}% / ${away.name} ${Math.round(prediction.away_win_prob * 100)}%`

        const baseContext = `
${home.name} (FIFA #${home.fifa_ranking}, ${home.confederation}, form: ${home.current_form ?? 'N/A'}) vs ${away.name} (FIFA #${away.fifa_ranking}, ${away.confederation}, form: ${away.current_form ?? 'N/A'}).
Predicted score: ${scoreStr}. Expected winner: ${winner}. Probabilities: ${probStr}. Confidence: ${prediction.confidence_level}.
Task: Write exactly 3 sentences of match analysis explaining this prediction. Tone: analytical and confident.`

        const [enRes, esRes] = await Promise.all([
          anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 200,
            messages: [{ role: 'user', content: baseContext + ' Language: English.' }],
          }),
          anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 200,
            messages: [{ role: 'user', content: baseContext + ' Language: Spanish.' }],
          }),
        ])

        const getText = (res: Anthropic.Message) =>
          res.content[0]?.type === 'text' ? res.content[0].text.trim() : null

        prediction.ai_narrative_en = getText(enRes)
        prediction.ai_narrative_es = getText(esRes)
      }
    } catch {
      // Narratives are optional — continue without them
    }
  }

  await supabase.from('predictions').upsert(prediction, { onConflict: 'match_id' })

  return prediction
}
