// src/app/[locale]/teams/[id]/page.tsx
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { TeamFlag } from '@/components/teams/TeamFlag'
import { FormBadge } from '@/components/teams/FormBadge'
import type { Team, TeamStats, NewsItem } from '@/types/database'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const revalidate = 3600

export default async function TeamPage({ params }: { params: { id: string; locale: string } }) {
  const locale = params.locale
  const prefix = `/${locale}`
  const supabase = getSupabaseServerClient()

  const [{ data: team, error }, { data: stats }, { data: news }] = await Promise.all([
    supabase.from('teams').select('*').eq('id', params.id).single(),
    supabase
      .from('team_stats')
      .select('*')
      .eq('team_id', params.id)
      .order('period', { ascending: false }),
    supabase
      .from('news_items')
      .select('*')
      .eq('team_id', params.id)
      .eq('active', true)
      .order('fetched_at', { ascending: false })
      .limit(5),
  ])

  if (error || !team) notFound()

  const t = team as Team
  const s = (stats as TeamStats[]) ?? []
  const n = (news as NewsItem[]) ?? []

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Back link */}
      <div className="mb-6">
        <Link href={`${prefix}/groups/${t.group_letter}`} className="text-slate-500 text-sm hover:text-slate-300">
          ← Group {t.group_letter}
        </Link>
      </div>

      {/* Team header */}
      <div className="flex items-start gap-6 mb-10">
        <TeamFlag countryCode={t.country_code} name={t.name} size="xl" />
        <div>
          <h1 className="text-4xl font-black text-white">{t.name}</h1>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-400">
            <span>{t.confederation}</span>
            <span>·</span>
            <span>FIFA Rank <span className="text-white font-semibold">#{t.fifa_ranking}</span></span>
            <span>·</span>
            <span>Group <span className="text-fifa-gold font-semibold">{t.group_letter}</span></span>
          </div>
          <p className="text-slate-500 text-sm mt-1">Coach: <span className="text-slate-300">{t.coach}</span></p>
          {t.current_form && (
            <div className="mt-3">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Recent Form</p>
              <FormBadge form={t.current_form} />
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      {s.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">Historical Stats</h2>
          <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Year</th>
                  <th className="px-4 py-3 text-center">P</th>
                  <th className="px-4 py-3 text-center">W</th>
                  <th className="px-4 py-3 text-center">D</th>
                  <th className="px-4 py-3 text-center">L</th>
                  <th className="px-4 py-3 text-center">GF</th>
                  <th className="px-4 py-3 text-center">GA</th>
                  <th className="px-4 py-3 text-center">CS</th>
                </tr>
              </thead>
              <tbody>
                {s.map(stat => (
                  <tr key={stat.id} className="border-b border-surface-border last:border-0">
                    <td className="px-4 py-3 font-semibold text-white">{stat.period}</td>
                    <td className="px-4 py-3 text-center text-slate-300">{stat.matches_played}</td>
                    <td className="px-4 py-3 text-center text-green-400">{stat.wins}</td>
                    <td className="px-4 py-3 text-center text-yellow-400">{stat.draws}</td>
                    <td className="px-4 py-3 text-center text-red-400">{stat.losses}</td>
                    <td className="px-4 py-3 text-center text-slate-300">{stat.goals_for}</td>
                    <td className="px-4 py-3 text-center text-slate-300">{stat.goals_against}</td>
                    <td className="px-4 py-3 text-center text-slate-300">{stat.clean_sheets}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No stats placeholder */}
      {s.length === 0 && (
        <div className="mb-10 bg-surface-card border border-surface-border rounded-xl p-6 text-center">
          <p className="text-slate-500 text-sm">Historical stats will be populated once the data pipeline runs.</p>
        </div>
      )}

      {/* News */}
      {n.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Latest News</h2>
          <div className="space-y-3">
            {n.map(item => (
              <div key={item.id} className="bg-surface-card border border-surface-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    item.type === 'injury' ? 'bg-red-500/20 text-red-400' :
                    item.type === 'suspension' ? 'bg-orange-500/20 text-orange-400' :
                    item.type === 'form' ? 'bg-green-500/20 text-green-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {item.type}
                  </span>
                  {item.source_url && (
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {item.source_name}
                    </a>
                  )}
                </div>
                <p className="text-slate-300 text-sm">{item.content_en}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
