// src/app/[locale]/matches/[id]/page.tsx
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getPrediction } from '@/lib/getPrediction'
import { hasActiveSubscription } from '@/lib/subscription'
import { MatchHeader } from '@/components/matches/MatchHeader'
import { TeamFlag } from '@/components/teams/TeamFlag'
import { PaywallGate } from '@/components/predictions/PaywallGate'
import type { MatchWithTeams } from '@/types/database'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = getSupabaseServerClient()
  const { data: match } = await supabase
    .from('matches')
    .select('*, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)')
    .eq('id', params.id)
    .single()
  if (!match) return { title: 'Match' }
  const m = match as MatchWithTeams
  return {
    title: `${m.home_team.name} vs ${m.away_team.name}`,
    description: `AI prediction for ${m.home_team.name} vs ${m.away_team.name} — 2026 FIFA World Cup`,
  }
}

function ProbBar({ label, prob, color }: { label: string; prob: number; color: string }) {
  const pct = Math.round(prob * 100)
  return (
    <div className="flex-1 text-center">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <div className="h-2 bg-surface-border rounded-full overflow-hidden mb-1">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-lg font-bold text-white">{pct}%</p>
    </div>
  )
}

function ConfidenceBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const cfg = {
    high:   { label: 'High confidence',   cls: 'bg-green-500/20 text-green-400' },
    medium: { label: 'Medium confidence', cls: 'bg-yellow-500/20 text-yellow-400' },
    low:    { label: 'Low confidence',    cls: 'bg-red-500/20 text-red-400' },
  }[level]
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

export default async function MatchPage({
  params,
}: {
  params: { id: string; locale: string }
}) {
  const supabase = getSupabaseServerClient()
  const locale = params.locale
  const prefix = `/${locale}`

  const { data: match, error } = await supabase
    .from('matches')
    .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
    .eq('id', params.id)
    .single()

  if (error || !match) notFound()

  const m = match as MatchWithTeams

  // Auth + subscription check
  const { data: { user } } = await supabase.auth.getUser()
  const isPaid = user ? await hasActiveSubscription(supabase, user.id) : false
  const prediction = isPaid ? await getPrediction(params.id) : null

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* DEBUG — remove after confirming */}
      <div className="mb-4 p-2 bg-red-900 text-white text-xs rounded">
        DEBUG: user={user?.email ?? 'null'} | isPaid={String(isPaid)}
      </div>
      {/* Back */}
      {m.group_letter && (
        <div className="mb-6">
          <Link href={`${prefix}/groups/${m.group_letter}`} className="text-slate-500 text-sm hover:text-slate-300">
            ← Group {m.group_letter}
          </Link>
        </div>
      )}

      {/* Match header */}
      <MatchHeader match={m} />

      {/* Prediction */}
      {prediction && (
        <div className="mt-8 bg-surface-card border border-surface-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white">AI Prediction</h2>
            <ConfidenceBadge level={prediction.confidence_level} />
          </div>

          {/* Probability bars */}
          <div className="flex gap-4 mb-6">
            <ProbBar
              label={m.home_team.name}
              prob={prediction.home_win_prob}
              color="bg-fifa-gold"
            />
            <ProbBar
              label="Draw"
              prob={prediction.draw_prob}
              color="bg-slate-500"
            />
            <ProbBar
              label={m.away_team.name}
              prob={prediction.away_win_prob}
              color="bg-fifa-green"
            />
          </div>

          {/* AI Narrative */}
          {(prediction.ai_narrative_en || prediction.ai_narrative_es) && (
            <div className="mb-5 p-4 bg-surface rounded-lg border border-surface-border">
              <p className="text-sm text-slate-300 leading-relaxed italic">
                {locale === 'es'
                  ? (prediction.ai_narrative_es ?? prediction.ai_narrative_en)
                  : (prediction.ai_narrative_en ?? prediction.ai_narrative_es)}
              </p>
            </div>
          )}

          {/* Predicted score */}
          <div className="flex items-center justify-center gap-6 py-4 border-t border-surface-border">
            <div className="flex items-center gap-2">
              <TeamFlag countryCode={m.home_team.country_code} name={m.home_team.name} size="md" />
              <span className="text-sm text-slate-300">{m.home_team.name}</span>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Predicted Score</p>
              <span className="text-4xl font-black text-white tabular-nums">
                {prediction.predicted_home_score} – {prediction.predicted_away_score}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-300">{m.away_team.name}</span>
              <TeamFlag countryCode={m.away_team.country_code} name={m.away_team.name} size="md" />
            </div>
          </div>
        </div>
      )}

      {/* Paywall — shown when not paid */}
      {!isPaid && (
        <div className="mt-8">
          <PaywallGate isLoggedIn={!!user} />
        </div>
      )}

      {/* Head to head */}
      <div className="mt-6 bg-surface-card border border-surface-border rounded-xl p-6">
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
    </div>
  )
}
