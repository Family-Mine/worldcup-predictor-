// src/types/pools.ts

export interface Pool {
  id: string
  name: string
  invite_code: string
  created_by: string
  created_at: string
}

export interface PoolMember {
  id: string
  pool_id: string
  user_id: string
  joined_at: string
}

export interface PoolPick {
  id: string
  pool_id: string
  user_id: string
  match_id: string
  home_score: number
  away_score: number
  points_awarded: number | null
  created_at: string
  updated_at: string
}

export interface PoolSpecialPick {
  id: string
  pool_id: string
  user_id: string
  top_scorer_tournament: string | null
  top_scorer_group_phase: string | null
  updated_at: string
}

export interface PoolLeaderboardEntry {
  pool_id: string
  user_id: string
  total_points: number
  group_points: number
  knockout_points: number
  exact_scores: number
  correct_results: number
  last_updated: string
}

export interface Profile {
  id: string
  display_name: string
  avatar_url: string | null
}

// Joined types for UI
export interface LeaderboardEntryWithProfile extends PoolLeaderboardEntry {
  profile: Profile
}

export interface PoolWithMemberCount extends Pool {
  member_count: number
  user_rank?: number
  user_points?: number
}

export interface TournamentTopScorer {
  id: number
  player_name: string
  team_name: string
  goals: number
  updated_at: string
}
