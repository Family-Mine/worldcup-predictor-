// src/app/[locale]/pools/[poolId]/special/page.tsx
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { SpecialPicksForm } from '@/components/pools/SpecialPicksForm'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Predicciones especiales · WC26' }
export const dynamic = 'force-dynamic'

export default async function SpecialPage({
  params,
}: {
  params: Promise<{ locale: string; poolId: string }>
}) {
  const { locale, poolId } = await params
  const supabase = getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/${locale}/login`)

  const { data: pool } = await supabase
    .from('pools').select('id, name').eq('id', poolId).single()
  if (!pool) notFound()

  const { data: membership } = await supabase
    .from('pool_members').select('id')
    .eq('pool_id', poolId).eq('user_id', user.id).single()
  if (!membership) redirect(`/${locale}/pools`)

  const { data: existing } = await supabase
    .from('pool_special_picks').select('*')
    .eq('pool_id', poolId).eq('user_id', user.id).single()

  // All members' special picks for comparison
  const { data: allSpecial } = await supabase
    .from('pool_special_picks').select('user_id, top_scorer_tournament, top_scorer_group_phase')
    .eq('pool_id', poolId)

  const { data: memberIds } = await supabase
    .from('pool_members').select('user_id').eq('pool_id', poolId)

  const ids = (memberIds ?? []).map(m => m.user_id)
  const { data: profiles } = await supabase
    .from('profiles').select('id, display_name').in('id', ids)

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <Link href={`/${locale}/pools/${poolId}`} className="text-sm text-slate-500 hover:text-slate-300">
        ← {pool.name}
      </Link>

      <h1 className="text-2xl font-black text-white mt-6 mb-2">Predicciones especiales</h1>
      <p className="text-slate-400 text-sm mb-8">
        Quién será el máximo goleador — el que acierte gana puntos de bonificación al final.
      </p>

      <SpecialPicksForm poolId={poolId} existing={existing ?? null} />

      {/* Others' picks */}
      {(allSpecial ?? []).length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-semibold text-white mb-4">Predicciones del grupo</h2>
          <div className="space-y-3">
            {(allSpecial ?? []).map(sp => {
              const profile = profileMap[sp.user_id]
              const isMe = sp.user_id === user.id
              return (
                <div
                  key={sp.user_id}
                  className={`bg-surface-card border rounded-xl p-4 text-sm ${isMe ? 'border-fifa-green/30' : 'border-surface-border'}`}
                >
                  <p className={`font-semibold mb-2 ${isMe ? 'text-fifa-green' : 'text-slate-300'}`}>
                    {profile?.display_name ?? sp.user_id.slice(0, 8)}
                    {isMe && ' (tú)'}
                  </p>
                  {sp.top_scorer_group_phase && (
                    <p className="text-slate-400 text-xs">
                      ⚽ Fase grupos: <span className="text-white">{sp.top_scorer_group_phase}</span>
                    </p>
                  )}
                  {sp.top_scorer_tournament && (
                    <p className="text-slate-400 text-xs mt-1">
                      🏆 Torneo: <span className="text-white">{sp.top_scorer_tournament}</span>
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
