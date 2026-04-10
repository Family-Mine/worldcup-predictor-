// src/app/[locale]/predictions/group-phase/page.tsx
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getPrediction } from '@/lib/getPrediction'
import { hasActiveSubscription, hasGroupBundle } from '@/lib/subscription'
import { TeamFlag } from '@/components/teams/TeamFlag'
import { GroupBundleGate } from '@/components/predictions/GroupBundleGate'
import { BettingLinksBar } from '@/components/betting/BettingLinksBar'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { MatchWithTeams } from '@/types/database'
import type { Prediction } from '@/lib/getPrediction'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Group Phase Predictions — WC26',
  description: 'All 2026 FIFA World Cup group stage match predictions in one view',
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ConfidenceDot({ level }: { level: 'high' | 'medium' | 'low' }) {
  const cfg = {
    high:   { color: 'bg-green-400',  label: 'High' },
    medium: { color: 'bg-yellow-400', label: 'Med'  },
    low:    { color: 'bg-red-400',    label: 'Low'  },
  }[level]
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.color}`} />
      {cfg.label}
    </span>
  )
}

function ProbRow({
  homeProb,
  drawProb,
  awayProb,
}: {
  homeProb: number
  drawProb: number
  awayProb: number
}) {
  const home = Math.round(homeProb * 100)
  const draw = Math.round(drawProb * 100)
  const away = Math.round(awayProb * 100)

  const homeWins = homeProb > awayProb && homeProb > drawProb
  const awayWins = awayProb > homeProb && awayProb > drawProb

  return (
    <div className="flex items-center gap-2 w-full">
      {/* Home % */}
      <span className={`text-xs font-bold w-8 text-right tabular-nums ${homeWins ? 'text-fifa-gold' : 'text-slate-400'}`}>
        {home}%
      </span>

      {/* Bar */}
      <div className="flex-1 h-1.5 bg-surface-border rounded-full overflow-hidden flex">
        <div
          className={`h-full rounded-l-full transition-all ${homeWins ? 'bg-fifa-gold' : 'bg-slate-600'}`}
          style={{ width: `${home}%` }}
        />
        <div className="h-full bg-slate-500" style={{ width: `${draw}%` }} />
        <div
          className={`h-full rounded-r-full transition-all ${awayWins ? 'bg-fifa-green' : 'bg-slate-600'}`}
          style={{ width: `${away}%` }}
        />
      </div>

      {/* Away % */}
      <span className={`text-xs font-bold w-8 tabular-nums ${awayWins ? 'text-fifa-green' : 'text-slate-400'}`}>
        {away}%
      </span>
    </div>
  )
}

function MatchRow({
  match,
  prediction,
  locale,
}: {
  match: MatchWithTeams
  prediction: Prediction | null
  locale: string
}) {
  const homeWins = prediction
    ? prediction.home_win_prob > prediction.away_win_prob && prediction.home_win_prob > prediction.draw_prob
    : false
  const awayWins = prediction
    ? prediction.away_win_prob > prediction.home_win_prob && prediction.away_win_prob > prediction.draw_prob
    : false

  return (
    <Link
      href={`/${locale}/matches/${match.id}`}
      className="group flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-white/5 transition-colors"
    >
      {/* Home team */}
      <div className="flex items-center gap-2 flex-1 justify-end">
        <span className={`text-sm font-semibold hidden sm:block ${homeWins ? 'text-white' : 'text-slate-400'}`}>
          {match.home_team?.name ?? 'TBD'}
        </span>
        <span className={`text-sm font-semibold sm:hidden ${homeWins ? 'text-white' : 'text-slate-400'}`}>
          {match.home_team?.country_code ?? ''}
        </span>
        <TeamFlag countryCode={match.home_team?.country_code ?? ''} name={match.home_team?.name ?? 'TBD'} size="sm" />
      </div>

      {/* Score / probs */}
      <div className="flex flex-col items-center gap-1 min-w-[120px]">
        {prediction ? (
          <>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-black tabular-nums ${homeWins ? 'text-white' : 'text-slate-500'}`}>
                {prediction.predicted_home_score}
              </span>
              <span className="text-slate-600 text-sm">–</span>
              <span className={`text-lg font-black tabular-nums ${awayWins ? 'text-white' : 'text-slate-500'}`}>
                {prediction.predicted_away_score}
              </span>
            </div>
            <ProbRow
              homeProb={prediction.home_win_prob}
              drawProb={prediction.draw_prob}
              awayProb={prediction.away_win_prob}
            />
            <ConfidenceDot level={prediction.confidence_level} />
          </>
        ) : (
          <span className="text-slate-600 text-xs">No data</span>
        )}
      </div>

      {/* Away team */}
      <div className="flex items-center gap-2 flex-1">
        <TeamFlag countryCode={match.away_team?.country_code ?? ''} name={match.away_team?.name ?? 'TBD'} size="sm" />
        <span className={`text-sm font-semibold hidden sm:block ${awayWins ? 'text-white' : 'text-slate-400'}`}>
          {match.away_team?.name ?? 'TBD'}
        </span>
        <span className={`text-sm font-semibold sm:hidden ${awayWins ? 'text-white' : 'text-slate-400'}`}>
          {match.away_team?.country_code ?? ''}
        </span>
      </div>
    </Link>
  )
}

function GroupCard({
  letter,
  matches,
  predictions,
  locale,
}: {
  letter: string
  matches: MatchWithTeams[]
  predictions: Map<string, Prediction | null>
  locale: string
}) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
      {/* Group header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border bg-white/[0.02]">
        <span className="w-7 h-7 rounded-lg bg-fifa-gold/10 border border-fifa-gold/30 flex items-center justify-center text-xs font-black text-fifa-gold">
          {letter}
        </span>
        <span className="text-sm font-semibold text-slate-300">Group {letter}</span>
        <span className="ml-auto text-xs text-slate-600">{matches.length} matches</span>
      </div>

      {/* Matches */}
      <div className="divide-y divide-surface-border/50">
        {matches.map((m) => (
          <MatchRow
            key={m.id}
            match={m}
            prediction={predictions.get(m.id) ?? null}
            locale={locale}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function GroupPhasePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ preview?: string }>
}) {
  const { locale } = await params
  const resolvedSearch = await searchParams
  const supabase = getSupabaseServerClient()

  // Dev-only preview bypass
  const isPreview = process.env.NODE_ENV === 'development' && resolvedSearch.preview === '1'

  const { data: { user } } = await supabase.auth.getUser()

  // Auth gates — run in parallel
  const [isPaid, hasBundle] = await Promise.all([
    user ? hasActiveSubscription(supabase, user.id) : Promise.resolve(false),
    user ? hasGroupBundle(supabase, user.id) : Promise.resolve(false),
  ])

  // No bundle → show bundle gate (handles both no-sub and sub-but-no-bundle cases)
  if (!hasBundle && !isPreview) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-black text-white mb-2 text-center">Group Phase Bundle</h1>
        <p className="text-slate-400 text-center mb-8">
          One-click access to every group stage prediction.
        </p>
        <GroupBundleGate isLoggedIn={!!user} hasBaseSub={isPaid} />
      </div>
    )
  }

  // ─── Paid — fetch and show everything ───────────────────────────────────────

  const { data: matchRows, error } = await supabase
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

  if (error || !matchRows) notFound()

  const matches = matchRows as MatchWithTeams[]

  // Fetch all predictions in parallel
  const predResults = await Promise.all(matches.map((m) => getPrediction(m.id)))
  const predictions = new Map<string, Prediction | null>(
    matches.map((m, i) => [m.id, predResults[i]])
  )

  // Group matches by group_letter
  const grouped = new Map<string, MatchWithTeams[]>()
  for (const m of matches) {
    const letter = m.group_letter ?? '?'
    if (!grouped.has(letter)) grouped.set(letter, [])
    grouped.get(letter)!.push(m)
  }

  const groupLetters = Array.from(grouped.keys()).sort()

  // Stats for header
  const totalMatches = matches.length
  const predictedCount = Array.from(predictions.values()).filter(Boolean).length

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Link
            href={`/${locale}/groups`}
            className="text-slate-500 text-sm hover:text-slate-300 transition-colors"
          >
            ← Groups
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-fifa-gold/10 border border-fifa-gold/30 rounded-full px-3 py-1 text-xs font-semibold text-fifa-gold uppercase tracking-widest mb-3">
              Group Bundle · Unlocked
            </div>
            <h1 className="text-4xl font-black text-white leading-tight">
              Group Phase<br />
              <span className="text-fifa-gold">Predictions</span>
            </h1>
          </div>

          <div className="flex gap-6 pb-1">
            <div className="text-center">
              <p className="text-2xl font-black text-white">{groupLetters.length}</p>
              <p className="text-xs text-slate-500 uppercase tracking-widest">Groups</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-white">{totalMatches}</p>
              <p className="text-xs text-slate-500 uppercase tracking-widest">Matches</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-fifa-gold">{predictedCount}</p>
              <p className="text-xs text-slate-500 uppercase tracking-widest">Predicted</p>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-6 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1.5 rounded-full bg-fifa-gold" />
          <span>Home win</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1.5 rounded-full bg-slate-500" />
          <span>Draw</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1.5 rounded-full bg-fifa-green" />
          <span>Away win</span>
        </div>
        <span className="ml-auto hidden sm:block">Click any match for full analysis →</span>
      </div>

      {/* Groups grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {groupLetters.map((letter) => (
          <GroupCard
            key={letter}
            letter={letter}
            matches={grouped.get(letter)!}
            predictions={predictions}
            locale={locale}
          />
        ))}
      </div>

      {/* Betting links */}
      <div className="mt-10">
        <BettingLinksBar />
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-slate-600 mt-6">
        Predictions powered by Bivariate Poisson model + AI analysis · Updated every 6 hours
      </p>
    </div>
  )
}
