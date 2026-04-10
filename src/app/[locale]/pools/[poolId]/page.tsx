// src/app/[locale]/pools/[poolId]/page.tsx
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { PoolLeaderboard } from '@/components/pools/PoolLeaderboard'
import { InviteCodeBanner } from '@/components/pools/InviteCodeBanner'
import { inviteUrl } from '@/lib/pools'
import Link from 'next/link'
import type { LeaderboardEntryWithProfile, TournamentTopScorer } from '@/types/pools'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Grupo · WC26 Predictor' }
}

export default async function PoolPage({
  params,
}: {
  params: Promise<{ locale: string; poolId: string }>
}) {
  const { locale, poolId } = await params
  const supabase = getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/${locale}/login`)

  // Load pool
  const { data: pool } = await supabase
    .from('pools')
    .select('*')
    .eq('id', poolId)
    .single()

  if (!pool) notFound()

  // Verify membership
  const { data: membership } = await supabase
    .from('pool_members')
    .select('id')
    .eq('pool_id', poolId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    // Not a member — offer to join
    redirect(`/${locale}/pools/join?code=${pool.invite_code}`)
  }

  // Load leaderboard + profiles + special picks + top scorer in parallel
  const [
    { data: leaderboardRows },
    { data: memberRows },
    { data: specialPickRows },
    { data: topScorerRows },
  ] = await Promise.all([
    supabase.from('pool_leaderboard').select('*').eq('pool_id', poolId),
    supabase.from('pool_members').select('user_id').eq('pool_id', poolId),
    supabase
      .from('pool_special_picks')
      .select('user_id, top_scorer_tournament')
      .eq('pool_id', poolId),
    supabase.from('tournament_top_scorer').select('*').limit(1),
  ])

  const memberIds = (memberRows ?? []).map(m => m.user_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', memberIds)

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

  const allEntries: LeaderboardEntryWithProfile[] = memberIds.map(uid => {
    const lb = (leaderboardRows ?? []).find(r => r.user_id === uid)
    return {
      pool_id: poolId,
      user_id: uid,
      total_points:    lb?.total_points    ?? 0,
      group_points:    lb?.group_points    ?? 0,
      knockout_points: lb?.knockout_points ?? 0,
      exact_scores:    lb?.exact_scores    ?? 0,
      correct_results: lb?.correct_results ?? 0,
      last_updated:    lb?.last_updated    ?? new Date().toISOString(),
      profile: profileMap[uid] ?? { id: uid, display_name: uid.slice(0, 8), avatar_url: null },
    }
  })

  const topScorer: TournamentTopScorer | null = topScorerRows?.[0] ?? null
  const specialPicks = (specialPickRows ?? []).map(p => ({
    user_id: p.user_id,
    top_scorer_tournament: p.top_scorer_tournament,
  }))

  const url = inviteUrl(pool.invite_code, locale)

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Back */}
      <Link href={`/${locale}/pools`} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
        ← Mis grupos
      </Link>

      {/* Pool header */}
      <div className="mt-6 mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white">{pool.name}</h1>
            <p className="text-slate-500 text-sm mt-1">{allEntries.length} participante{allEntries.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link
              href={`/${locale}/pools/${poolId}/picks`}
              className="px-4 py-2 bg-fifa-green text-white font-bold text-sm rounded-xl hover:bg-green-500 transition-colors"
            >
              Mis predicciones
            </Link>
            <Link
              href={`/${locale}/pools/${poolId}/special`}
              className="px-4 py-2 border border-surface-border text-slate-300 text-sm rounded-xl hover:border-slate-400 transition-colors"
            >
              Especiales
            </Link>
          </div>
        </div>
      </div>

      {/* Invite banner */}
      <div className="mb-8">
        <InviteCodeBanner inviteCode={pool.invite_code} inviteUrl={url} />
      </div>

      {/* Leaderboard */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Tabla de posiciones</h2>
        <PoolLeaderboard
          entries={allEntries}
          currentUserId={user.id}
          specialPicks={specialPicks}
          topScorer={topScorer}
        />
      </div>

      {/* Scoring rules */}
      <div className="mt-8 p-4 bg-surface-card border border-surface-border rounded-xl">
        <h3 className="text-xs text-slate-500 uppercase tracking-widest mb-3">Sistema de puntos</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-2xl font-black text-green-400">3</p>
            <p className="text-xs text-slate-400 mt-1">Marcador exacto</p>
          </div>
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-2xl font-black text-yellow-400">1</p>
            <p className="text-xs text-slate-400 mt-1">Ganador correcto</p>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-2xl font-black text-red-400">0</p>
            <p className="text-xs text-slate-400 mt-1">Predicción incorrecta</p>
          </div>
        </div>
      </div>
    </div>
  )
}
