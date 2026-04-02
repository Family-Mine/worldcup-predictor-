// src/types/database.ts

export interface Team {
  id: string
  name: string
  country_code: string
  group_letter: string
  fifa_ranking: number
  flag_url: string
  confederation: string
  coach: string
  current_form: string
}

export interface Match {
  id: string
  home_team_id: string
  away_team_id: string
  group_letter: string | null
  scheduled_at: string
  venue: string
  status: 'scheduled' | 'live' | 'finished'
  home_score: number | null
  away_score: number | null
  stage: 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'final' | '3rd'
}

export interface Prediction {
  id: string
  match_id: string
  home_win_prob: number
  draw_prob: number
  away_win_prob: number
  predicted_home_score: number | null
  predicted_away_score: number | null
  predicted_winner: 'home' | 'draw' | 'away'
  confidence_level: 'high' | 'medium' | 'low'
  ai_narrative_en: string
  ai_narrative_es: string
  updated_at: string
}

export interface TeamStats {
  id: string
  team_id: string
  period: string
  matches_played: number
  wins: number
  draws: number
  losses: number
  goals_for: number
  goals_against: number
  clean_sheets: number
  avg_possession: number
  big_chances_created: number
}

export interface NewsItem {
  id: string
  team_id: string
  type: 'injury' | 'suspension' | 'form' | 'tactical'
  content_en: string
  content_es: string
  impact_weight: number
  source_url: string | null
  source_name: string
  fetched_at: string
  active: boolean
}

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string
  stripe_payment_intent_id: string
  status: 'active' | 'cancelled' | 'expired'
  expires_at: string | null
}

export interface UserPick {
  id: string
  user_id: string
  match_id: string
  picked_home_score: number
  picked_away_score: number
  picked_winner: 'home' | 'draw' | 'away'
  created_at: string
}

// Joined types for UI convenience
export interface MatchWithTeams extends Match {
  home_team: Team
  away_team: Team
}

export interface GroupStanding {
  group_letter: string
  team: Team
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  goal_difference: number
  points: number
}
