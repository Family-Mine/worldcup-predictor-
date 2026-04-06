// src/lib/poisson.ts
// Bivariate Poisson model for football match prediction

/** Poisson probability: P(X = k) given lambda */
function poissonProb(lambda: number, k: number): number {
  if (k < 0) return 0
  let logP = -lambda + k * Math.log(lambda)
  for (let i = 1; i <= k; i++) logP -= Math.log(i)
  return Math.exp(logP)
}

export interface TeamInput {
  matches_played: number
  goals_for: number
  goals_against: number
  wins: number
  draws: number
}

export interface PoissonResult {
  home_win_prob: number
  draw_prob: number
  away_win_prob: number
  predicted_home_score: number
  predicted_away_score: number
  confidence_level: 'high' | 'medium' | 'low'
  lambda_home: number
  lambda_away: number
}

const MAX_GOALS = 6 // score matrix 0..6 x 0..6

export function calculatePrediction(
  home: TeamInput,
  away: TeamInput,
  homeNewsImpact = 0,
  awayNewsImpact = 0
): PoissonResult {
  // Average goals per game (baseline for international football ~1.15 per team)
  const avgGoals = 1.15

  const homeAttack  = (home.goals_for  / home.matches_played) / avgGoals
  const homeDefense = (home.goals_against / home.matches_played) / avgGoals
  const awayAttack  = (away.goals_for  / away.matches_played) / avgGoals
  const awayDefense = (away.goals_against / away.matches_played) / avgGoals

  // Expected goals (neutral venue — no home advantage at World Cup)
  let lambdaHome = homeAttack * awayDefense * avgGoals
  let lambdaAway = awayAttack * homeDefense * avgGoals

  // Clamp to sensible range
  lambdaHome = Math.max(0.3, Math.min(3.5, lambdaHome + homeNewsImpact * 0.1))
  lambdaAway = Math.max(0.3, Math.min(3.5, lambdaAway + awayNewsImpact * 0.1))

  // Build score probability matrix
  let homeWin = 0, draw = 0, awayWin = 0
  let bestProb = 0
  let predHome = 1, predAway = 1

  for (let h = 0; h <= MAX_GOALS; h++) {
    for (let a = 0; a <= MAX_GOALS; a++) {
      const p = poissonProb(lambdaHome, h) * poissonProb(lambdaAway, a)
      if (h > a) homeWin += p
      else if (h === a) draw += p
      else awayWin += p

      if (p > bestProb) {
        bestProb = p
        predHome = h
        predAway = a
      }
    }
  }

  const confidence: 'high' | 'medium' | 'low' =
    bestProb > 0.20 ? 'high' : bestProb > 0.12 ? 'medium' : 'low'

  return {
    home_win_prob: Math.round(homeWin * 1000) / 1000,
    draw_prob:     Math.round(draw     * 1000) / 1000,
    away_win_prob: Math.round(awayWin  * 1000) / 1000,
    predicted_home_score: predHome,
    predicted_away_score: predAway,
    confidence_level: confidence,
    lambda_home: Math.round(lambdaHome * 100) / 100,
    lambda_away: Math.round(lambdaAway * 100) / 100,
  }
}
