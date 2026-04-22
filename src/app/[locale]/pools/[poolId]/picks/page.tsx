// src/app/[locale]/pools/[poolId]/picks/page.tsx
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { PicksGrid } from '@/components/pools/PicksGrid'
import Link from 'next/link'
import type { MatchWithTeams } from '@/types/database'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'pools' })
  return { title: `${t('picks_title')} · WC26` }
}

type Tab = 'groups' | 'knockout'

export default async function PicksPage({
  params,
  searchParams,
}: {
  params: { locale: string; poolId: string }
  searchParams: { tab?: string }
}) {
  const supabase = getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { locale, poolId } = params
  const t = await getTranslations({ locale, namespace: 'pools' })

  if (!user) redirect(`/${locale}/login`)

  const activeTab: Tab = searchParams.tab === 'knockout' ? 'knockout' : 'groups'

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

  const matchQuery = activeTab === 'groups'
    ? supabase
        .from('matches')
        .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
        .eq('stage', 'group')
        .not('group_letter', 'is', null)
        .order('group_letter')
        .order('scheduled_at')
    : supabase
        .from('matches')
        .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
        .in('stage', ['r32', 'r16', 'qf', 'sf', 'final', '3rd'])
        .order('scheduled_at')

  const { data: matchRows } = await matchQuery
  const matches = (matchRows ?? []) as MatchWithTeams[]

  const { data: existingPicks } = await supabase
    .from('pool_picks')
    .select('*')
    .eq('pool_id', poolId)
    .eq('user_id', user.id)

  const picksForTab = (existingPicks ?? []).filter(p =>
    matches.some(m => m.id === p.match_id)
  )

  const picksCount = picksForTab.length
  const totalMatches = matches.length

  const knockoutHasTeams = activeTab === 'knockout'
    ? matches.some(m => m.home_team_id !== null)
    : true

  const tabs: { id: Tab; label: string }[] = [
    { id: 'groups',   label: t('group_phase_tab') },
    { id: 'knockout', label: t('knockout_tab') },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link
        href={`/${locale}/pools/${poolId}`}
        className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
      >
        ← {pool.name}
      </Link>

      <div className="mt-6 mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">{t('picks_title')}</h1>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-fifa-gold">{picksCount}</p>
          <p className="text-xs text-slate-500">{t('completed_of', { total: totalMatches })}</p>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-surface-card border border-surface-border rounded-xl mb-6">
        {tabs.map(tab => (
          <Link
            key={tab.id}
            href={`/${locale}/pools/${poolId}/picks?tab=${tab.id}`}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg text-center transition-colors ${
              activeTab === tab.id
                ? 'bg-fifa-gold text-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {totalMatches > 0 && (
        <div className="h-1.5 bg-surface-border rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-fifa-gold rounded-full transition-all"
            style={{ width: `${(picksCount / totalMatches) * 100}%` }}
          />
        </div>
      )}

      {activeTab === 'knockout' && !knockoutHasTeams ? (
        <div className="text-center py-16 border border-surface-border rounded-xl">
          <p className="text-4xl mb-4">⚡</p>
          <p className="text-slate-300 font-semibold">{t('knockout_not_ready')}</p>
          <p className="text-slate-500 text-sm mt-2">{t('knockout_wait')}</p>
          <p className="text-xs text-slate-600 mt-4">{t('cron_note')}</p>
        </div>
      ) : totalMatches === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-sm">{t('no_matches')}</p>
        </div>
      ) : (
        <PicksGrid
          poolId={poolId}
          matches={matches}
          existingPicks={picksForTab}
        />
      )}
    </div>
  )
}
