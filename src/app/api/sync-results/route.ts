// src/app/api/sync-results/route.ts
// Called by Vercel Cron every 6 hours (and manually via GET with secret)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const FD_BASE = 'https://api.football-data.org/v4'
// FIFA World Cup 2026 competition code on football-data.org
const WC_CODE = 'WC'

// Map football-data.org team names → our DB names
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

function mapStatus(fdStatus: string): string {
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

export async function GET(req: NextRequest) {
  // Protect manual calls with a secret (Vercel Cron sends Authorization header automatically)
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
    // Fetch all World Cup matches from football-data.org
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

    let updated = 0
    let skipped = 0

    for (const fdm of fdMatches) {
      const homeName = TEAM_NAME_MAP[fdm.homeTeam.name] ?? fdm.homeTeam.name
      const awayName = TEAM_NAME_MAP[fdm.awayTeam.name] ?? fdm.awayTeam.name
      const homeId = teamIdByName[homeName]
      const awayId = teamIdByName[awayName]

      if (!homeId || !awayId) {
        skipped++
        continue
      }

      const status = mapStatus(fdm.status)
      const homeScore = fdm.score?.fullTime?.home ?? null
      const awayScore = fdm.score?.fullTime?.away ?? null

      const { error } = await supabase
        .from('matches')
        .update({
          status,
          home_score: homeScore,
          away_score: awayScore,
        })
        .eq('home_team_id', homeId)
        .eq('away_team_id', awayId)

      if (!error) {
        updated++
        // Invalidate prediction cache if match just finished
        if (status === 'finished') {
          const { data: match } = await supabase
            .from('matches')
            .select('id')
            .eq('home_team_id', homeId)
            .eq('away_team_id', awayId)
            .single()
          if (match) {
            await supabase
              .from('predictions')
              .update({ updated_at: new Date(0).toISOString() })
              .eq('match_id', match.id)
          }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      total: fdMatches.length,
      updated,
      skipped,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

interface FDMatch {
  status: string
  homeTeam: { name: string }
  awayTeam: { name: string }
  score: {
    fullTime: { home: number | null; away: number | null }
  }
}
