// src/app/[locale]/pools/[poolId]/picks/page.tsx
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { PicksGrid } from '@/components/pools/PicksGrid'
import Link from 'next/link'
import type { MatchWithTeams } from '@/types/database'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mis predicciones · WC26' }
export const dynamic = 'force-dynamic'

export default async function PicksPage({
  params,
}: {
  params: { locale: string; poolId: string }
}) {
  const supabase = getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { locale, poolId } = params

  if (!user) redirect(`/${locale}/login`)

  // Verify pool membership
  const { data: pool } = await supabase
    .from('pools')
    .select('id, name')
    .eq('id', poolId)
    .single()

  if (!pool) notFound()

  const { data: membership } = await supabase
    .from('pool_members')
    .select('id')
    .eq('pool_id', poolId)
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect(`/${locale}/pools`)

  // Load group stage matches with teams
  const { data: matchRows } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(*),
      away_team:teams!matches_away_team_id_fkey(*)
    `)
    .eq('stage', 'group')
    .not('group_letter', 'is', null)
    .order('group_letter')
    .order('scheduled_at')

  const matches = (matchRows ?? []) as MatchWithTeams[]

  // Load user's existing picks for this pool
  const { data: existingPicks } = await supabase
    .from('pool_picks')
    .select('*')
    .eq('pool_id', poolId)
    .eq('user_id', user.id)

  const picksCount = existingPicks?.length ?? 0
  const totalMatches = matches.length

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Header */}
      <Link
        href={`/${locale}/pools/${poolId}`}
        className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
      >
        ← {pool.name}
      </Link>

      <div className="mt-6 mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Mis predicciones</h1>
          <p className="text-slate-400 text-sm mt-1">Fase de grupos · {totalMatches} partidos</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-fifa-gold">{picksCount}</p>
          <p className="text-xs text-slate-500">de {totalMatches} completados</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-surface-border rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-fifa-gold rounded-full transition-all"
          style={{ width: `${totalMatches > 0 ? (picksCount / totalMatches) * 100 : 0}%` }}
        />
      </div>

      <PicksGrid
        poolId={poolId}
        matches={matches}
        existingPicks={existingPicks ?? []}
      />
    </div>
  )
}
