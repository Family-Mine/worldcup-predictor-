// src/app/api/sync-results/route.ts
// Vercel Cron diario — sincroniza resultados + equipos knockout + goleador
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const FD_BASE = 'https://api.football-data.org/v4'
const WC_CODE = 'WC'

const TEAM_NAME_MAP: Record<string, string> = {
  'Mexico':                   'Mexico',
  'South Africa':             'South Africa',
  'Korea Republic':           'South Korea',
  'Czech Republic':           'Czech Republic',
  'Czechia':                  'Czech Republic',
  'Canada':                   'Canada',
  'Bosnia and Herzegovina':   'Bosnia & Herz.',
  'Bosnia-Herzegovina':       'Bosnia & Herz.',
  'Qatar':                    'Qatar',
  'Switzerland':              'Switzerland',
  'Brazil':                   'Brazil',
  'Morocco':                  'Morocco',
  'Haiti':                    'Haiti',
  'Scotland':                 'Scotland',
  'USA':                      'USA',
  'United States':            'USA',
  'Paraguay':                 'Paraguay',
  'Australia':                'Australia',
  'Turkey':                   'Türkiye',
  'Türkiye':                  'Türkiye',
  'Germany':                  'Germany',
  'Curacao':                  'Curaçao',
  "Côte d'Ivoire":            'Ivory Coast',
  'Ivory Coast':              'Ivory Coast',
  'Ecuador':                  'Ecuador',
  'Netherlands':              'Netherlands',
  'Japan':                    'Japan',
  'Sweden':                   'Sweden',
  'Tunisia':                  'Tunisia',
  'Belgium':                  'Belgium',
  'Egypt':                    'Egypt',
  'Iran':                     'Iran',
  'New Zealand':              'New Zealand',
  'Spain':                    'Spain',
  'Cape Verde':               'Cape Verde',
  'Saudi Arabia':             'Saudi Arabia',
  'Uruguay':                  'Uruguay',
  'France':                   'France',
  'Senegal':                  'Senegal',
  'Iraq':                     'Iraq',
  'Norway':                   'Norway',
  'Argentina':                'Argentina',
  'Algeria':                  'Algeria',
  'Austria':                  'Austria',
  'Jordan':                   'Jordan',
  'Portugal':                 'Portugal',
  'DR Congo':                 'DR Congo',
  'Congo DR':                 'DR Congo',
  'Uzbekistan':               'Uzbekistan',
  'Colombia':                 'Colombia',
  'England':                  'England',
  'Croatia':                  'Croatia',
  'Ghana':                    'Ghana',
  'Panama':                   'Panama',
}

function mapStatus(fdStatus: string): 'scheduled' | 'live' | 'finished' {
  switch (fdStatus) {
    case 'IN_PLAY':
    case 'PAUSED':
    case 'HALFTIME': return 'live'
    case 'FINISHED':
    case 'AWARDED':  return 'finished'
    default:         return 'scheduled'
  }
}

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// ── 1. Sync de resultados ─────────────────────────────────────────────────────

async function syncResults(
  supabase: ReturnType<typeof db>,
  fdMatches: FDMatch[],
  teamIdByName: Record<string, string>
): Promise<{ updated: number; skipped: number; pointsCalc: number }> {
  let updated = 0, skipped = 0, pointsCalc = 0

  for (const fdm of fdMatches) {
    const homeName = TEAM_NAME_MAP[fdm.homeTeam.name] ?? fdm.homeTeam.name
    const awayName = TEAM_NAME_MAP[fdm.awayTeam.name] ?? fdm.awayTeam.name
    const homeId = teamIdByName[homeName]
    const awayId = teamIdByName[awayName]

    if (!homeId || !awayId) { skipped++; continue }

    const status = mapStatus(fdm.status)
    const homeScore = fdm.score?.fullTime?.home ?? null
    const awayScore = fdm.score?.fullTime?.away ?? null

    const { error } = await supabase
      .from('matches')
      .update({ status, home_score: homeScore, away_score: awayScore })
      .eq('home_team_id', homeId)
      .eq('away_team_id', awayId)

    if (error) continue
    updated++

    // Calculate pool points when a match finishes with a score
    if (status === 'finished' && homeScore !== null && awayScore !== null) {
      const { data: match } = await supabase
        .from('matches')
        .select('id')
        .eq('home_team_id', homeId)
        .eq('away_team_id', awayId)
        .single()

      if (match) {
        await supabase.rpc('calculate_pool_points', {
          p_match_id:    match.id,
          p_actual_home: homeScore,
          p_actual_away: awayScore,
        })
        pointsCalc++

        // Invalidate prediction cache
        await supabase
          .from('predictions')
          .update({ updated_at: new Date(0).toISOString() })
          .eq('match_id', match.id)
      }
    }
  }

  return { updated, skipped, pointsCalc }
}

// ── 2. Sync de equipos knockout ───────────────────────────────────────────────

async function syncKnockoutTeams(
  supabase: ReturnType<typeof db>,
  fdMatches: FDMatch[],
  teamIdByName: Record<string, string>
): Promise<{ resolved: number }> {
  // Get knockout matches with TBD teams from our DB
  const { data: tbdMatches } = await supabase
    .from('matches')
    .select('id, scheduled_at')
    .neq('stage', 'group')
    .is('home_team_id', null)

  if (!tbdMatches?.length) return { resolved: 0 }

  let resolved = 0

  for (const dbMatch of tbdMatches) {
    const dbTime = new Date(dbMatch.scheduled_at).getTime()

    // Match by kickoff time (5-minute tolerance)
    const fdm = fdMatches.find(m => {
      const apiTime = new Date(m.utcDate).getTime()
      return Math.abs(apiTime - dbTime) < 5 * 60 * 1000
    })
    if (!fdm) continue

    const homeName = TEAM_NAME_MAP[fdm.homeTeam.name] ?? fdm.homeTeam.name
    const awayName = TEAM_NAME_MAP[fdm.awayTeam.name] ?? fdm.awayTeam.name
    const homeId = teamIdByName[homeName]
    const awayId = teamIdByName[awayName]

    // Only update when both teams are confirmed in the API
    if (!homeId || !awayId) continue

    const { error } = await supabase
      .from('matches')
      .update({ home_team_id: homeId, away_team_id: awayId })
      .eq('id', dbMatch.id)

    if (!error) resolved++
  }

  return { resolved }
}

// ── 3. Sync de goleador ───────────────────────────────────────────────────────

async function syncTopScorer(
  supabase: ReturnType<typeof db>,
  apiKey: string
): Promise<{ player: string | null }> {
  const res = await fetch(`${FD_BASE}/competitions/${WC_CODE}/scorers?limit=1`, {
    headers: { 'X-Auth-Token': apiKey },
    next: { revalidate: 0 },
  })

  if (!res.ok) return { player: null }

  const data = await res.json()
  const top = data.scorers?.[0]
  if (!top) return { player: null }

  const playerName: string = top.player?.name ?? ''
  const teamName: string   = top.team?.name   ?? ''
  const goals: number      = top.goals        ?? 0

  if (!playerName) return { player: null }

  await supabase.from('tournament_top_scorer').upsert(
    { id: 1, player_name: playerName, team_name: teamName, goals, updated_at: new Date().toISOString() },
    { onConflict: 'id' }
  )

  return { player: playerName }
}

// ── Handler principal ─────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.FOOTBALL_DATA_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'FOOTBALL_DATA_API_KEY not set' }, { status: 500 })
  }

  try {
    // Fetch all WC matches once — reused by syncResults and syncKnockoutTeams
    const res = await fetch(`${FD_BASE}/competitions/${WC_CODE}/matches`, {
      headers: { 'X-Auth-Token': apiKey },
      next: { revalidate: 0 },
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: `football-data.org error: ${res.status}`, detail: text }, { status: 502 })
    }

    const data = await res.json()
    const fdMatches: FDMatch[] = data.matches ?? []

    const supabase = db()

    // Build team name → id lookup
    const { data: teams } = await supabase.from('teams').select('id, name')
    const teamIdByName: Record<string, string> = {}
    for (const t of teams ?? []) teamIdByName[t.name] = t.id

    // Resolve knockout team IDs first, then sync results + scorer in parallel
    const knockoutOut = await syncKnockoutTeams(supabase, fdMatches, teamIdByName)
    const [resultsOut, scorerOut] = await Promise.all([
      syncResults(supabase, fdMatches, teamIdByName),
      syncTopScorer(supabase, apiKey),
    ])

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      results:  resultsOut,
      knockout: knockoutOut,
      scorer:   scorerOut,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

interface FDMatch {
  utcDate: string
  status: string
  homeTeam: { name: string }
  awayTeam: { name: string }
  score: {
    fullTime: { home: number | null; away: number | null }
  }
}
