// src/app/[locale]/matches/[id]/page.tsx
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { MatchHeader } from '@/components/matches/MatchHeader'
import { PaywallCTA } from '@/components/predictions/PaywallCTA'
import { TeamFlag } from '@/components/teams/TeamFlag'
import type { MatchWithTeams } from '@/types/database'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export const revalidate = 1800

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = getSupabaseServerClient()
  const { data: match } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(name),
      away_team:teams!matches_away_team_id_fkey(name)
    `)
    .eq('id', params.id)
    .single()

  if (!match) return { title: 'Match' }

  const m = match as MatchWithTeams
  return {
    title: `${m.home_team.name} vs ${m.away_team.name}`,
    description: `Match prediction and analysis for ${m.home_team.name} vs ${m.away_team.name} — 2026 FIFA World Cup`,
  }
}

export default async function MatchPage({ params }: { params: { id: string } }) {
  const supabase = getSupabaseServerClient()

  const { data: match, error } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(*),
      away_team:teams!matches_away_team_id_fkey(*)
    `)
    .eq('id', params.id)
    .single()

  if (error || !match) notFound()

  const m = match as MatchWithTeams

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Back link */}
      {m.group_letter && (
        <div className="mb-6">
          <Link href={`/groups/${m.group_letter}`} className="text-slate-500 text-sm hover:text-slate-300">
            ← Group {m.group_letter}
          </Link>
        </div>
      )}

      {/* Match header */}
      <MatchHeader match={m} />

      {/* Head to head placeholder */}
      <div className="mt-8 bg-surface-card border border-surface-border rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Head to Head</h2>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TeamFlag countryCode={m.home_team.country_code} name={m.home_team.name} size="sm" />
            <span className="text-sm text-slate-300">{m.home_team.name}</span>
          </div>
          <span className="text-xs text-slate-600 text-center">Historical data coming soon</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-300">{m.away_team.name}</span>
            <TeamFlag countryCode={m.away_team.country_code} name={m.away_team.name} size="sm" />
          </div>
        </div>
      </div>

      {/* Paywall CTA */}
      <div className="mt-8">
        <PaywallCTA />
      </div>
    </div>
  )
}
