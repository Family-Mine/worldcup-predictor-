// src/lib/pools.ts
import type { Match } from '@/types/database'

/** Returns true if predictions for this match are locked (kick-off within 5 min or past) */
export function isMatchLocked(match: Pick<Match, 'scheduled_at'>): boolean {
  const kickoff = new Date(match.scheduled_at).getTime()
  const fiveMinBefore = kickoff - 5 * 60 * 1000
  return Date.now() >= fiveMinBefore
}

/** Compute result from scores */
export function getResult(homeScore: number, awayScore: number): 'home' | 'draw' | 'away' {
  if (homeScore > awayScore) return 'home'
  if (homeScore < awayScore) return 'away'
  return 'draw'
}

/** Points for a pick */
export function computePoints(
  pickedHome: number,
  pickedAway: number,
  actualHome: number,
  actualAway: number
): number {
  if (pickedHome === actualHome && pickedAway === actualAway) return 3
  if (getResult(pickedHome, pickedAway) === getResult(actualHome, actualAway)) return 1
  return 0
}

/** Generate readable invite URL */
export function inviteUrl(inviteCode: string, locale: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return `${base}/${locale}/pools/join?code=${inviteCode}`
}
