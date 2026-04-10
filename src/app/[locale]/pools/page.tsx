// src/app/[locale]/pools/page.tsx
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mis Grupos — WC26 Predictor' }
export const dynamic = 'force-dynamic'

export default async function PoolsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/${locale}/login`)

  // Get pools the user belongs to
  const { data: memberships } = await supabase
    .from('pool_members')
    .select('pool_id, joined_at')
    .eq('user_id', user.id)

  const poolIds = memberships?.map(m => m.pool_id) ?? []

  const { data: pools } = poolIds.length > 0
    ? await supabase.from('pools').select('*').in('id', poolIds).order('created_at', { ascending: false })
    : { data: [] }

  // Get leaderboard position for each pool
  const { data: leaderboardRows } = poolIds.length > 0
    ? await supabase.from('pool_leaderboard').select('pool_id, total_points').in('pool_id', poolIds).eq('user_id', user.id)
    : { data: [] }

  const pointsByPool = Object.fromEntries((leaderboardRows ?? []).map(r => [r.pool_id, r.total_points]))

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Mis Grupos</h1>
          <p className="text-slate-400 text-sm mt-1">Quinelas con amigos · WC26</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/${locale}/pools/join`}
            className="px-4 py-2 text-sm border border-surface-border rounded-xl text-slate-300 hover:border-slate-500 transition-colors"
          >
            Unirme
          </Link>
          <Link
            href={`/${locale}/pools/new`}
            className="px-4 py-2 text-sm bg-fifa-green text-white font-bold rounded-xl hover:bg-green-500 transition-colors"
          >
            + Nuevo grupo
          </Link>
        </div>
      </div>

      {(!pools || pools.length === 0) ? (
        <div className="text-center py-20 border border-dashed border-surface-border rounded-xl">
          <p className="text-5xl mb-4">🏆</p>
          <h2 className="text-xl font-bold text-white mb-2">Crea tu primera quinela</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
            Invita a tus amigos, predigan los marcadores y sigan la tabla de posiciones.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href={`/${locale}/pools/join`}
              className="px-5 py-2.5 border border-surface-border rounded-xl text-slate-300 hover:border-slate-400 transition-colors text-sm"
            >
              Unirme con código
            </Link>
            <Link
              href={`/${locale}/pools/new`}
              className="px-5 py-2.5 bg-fifa-green text-white font-bold rounded-xl hover:bg-green-500 transition-colors text-sm"
            >
              Crear grupo
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {pools.map(pool => (
            <Link
              key={pool.id}
              href={`/${locale}/pools/${pool.id}`}
              className="block bg-surface-card border border-surface-border rounded-xl p-4 hover:border-slate-500 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-white">{pool.name}</h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">{pool.invite_code}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-fifa-gold">{pointsByPool[pool.id] ?? 0}</p>
                  <p className="text-xs text-slate-500">puntos</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
