'use client'
// src/components/pools/PoolLeaderboard.tsx
import { useState } from 'react'
import type { LeaderboardEntryWithProfile, TournamentTopScorer } from '@/types/pools'

type Tab = 'general' | 'groups' | 'knockout'

interface SpecialPickSummary {
  user_id: string
  top_scorer_tournament: string | null
}

interface PoolLeaderboardProps {
  entries: LeaderboardEntryWithProfile[]
  currentUserId: string
  specialPicks: SpecialPickSummary[]
  topScorer: TournamentTopScorer | null
}

const MEDALS = ['🥇', '🥈', '🥉']

const TABS: { id: Tab; label: string; key: keyof LeaderboardEntryWithProfile }[] = [
  { id: 'general',  label: 'General',  key: 'total_points' },
  { id: 'groups',   label: 'Grupos',   key: 'group_points' },
  { id: 'knockout', label: 'Knockout', key: 'knockout_points' },
]

export function PoolLeaderboard({
  entries,
  currentUserId,
  specialPicks,
  topScorer,
}: PoolLeaderboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('general')

  const { key } = TABS.find(t => t.id === activeTab)!
  const sorted = [...entries].sort((a, b) =>
    (b[key] as number) - (a[key] as number) || b.exact_scores - a.exact_scores
  )

  const allZero = sorted.every(e => (e[key] as number) === 0)

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-card border border-surface-border rounded-xl">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-fifa-gold text-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Leaderboard table */}
      {entries.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p className="text-4xl mb-3">⏳</p>
          <p className="text-sm">Nadie ha hecho predicciones todavía.</p>
          <p className="text-xs text-slate-600 mt-1">¡Sé el primero!</p>
        </div>
      ) : activeTab === 'knockout' && allZero ? (
        <div className="text-center py-10 border border-surface-border rounded-xl text-slate-500">
          <p className="text-3xl mb-3">⚡</p>
          <p className="text-sm">La fase knockout aún no ha comenzado.</p>
          <p className="text-xs text-slate-600 mt-1">Los puntos se actualizarán cuando empiece la eliminatoria.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-surface-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-widest font-medium w-10">#</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-widest font-medium">Jugador</th>
                <th className="text-center px-3 py-3 text-xs text-slate-500 uppercase tracking-widest font-medium">Pts</th>
                <th className="text-center px-3 py-3 text-xs text-slate-500 uppercase tracking-widest font-medium hidden sm:table-cell">Exactos</th>
                <th className="text-center px-3 py-3 text-xs text-slate-500 uppercase tracking-widest font-medium hidden sm:table-cell">Ganador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50">
              {sorted.map((entry, i) => {
                const isMe = entry.user_id === currentUserId
                return (
                  <tr
                    key={entry.user_id}
                    className={`transition-colors ${isMe ? 'bg-fifa-green/5 border-l-2 border-l-fifa-green' : 'hover:bg-white/[0.02]'}`}
                  >
                    <td className="px-4 py-3 text-center">
                      {i < 3
                        ? <span className="text-base">{MEDALS[i]}</span>
                        : <span className="text-slate-500 text-xs font-mono">{i + 1}</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-surface-border flex items-center justify-center text-xs font-bold text-slate-400 flex-shrink-0">
                          {entry.profile.display_name.charAt(0).toUpperCase()}
                        </div>
                        <span className={`font-medium ${isMe ? 'text-fifa-green' : 'text-slate-200'}`}>
                          {entry.profile.display_name}
                          {isMe && <span className="text-xs text-slate-500 ml-1">(tú)</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-lg font-black ${isMe ? 'text-fifa-green' : 'text-white'}`}>
                        {entry[key] as number}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1 text-xs text-green-400 font-semibold">
                        <span className="text-green-500">★</span> {entry.exact_scores}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center hidden sm:table-cell">
                      <span className="text-xs text-slate-400">{entry.correct_results}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-surface-border/50 flex gap-4 text-xs text-slate-600">
            <span><span className="text-green-400">★</span> Exacto = 3 pts</span>
            <span>Ganador correcto = 1 pt</span>
            <span>Incorrecto = 0 pts</span>
          </div>
        </div>
      )}

      {/* Sección Goleador */}
      <div className="border border-surface-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-surface-border bg-white/[0.02] flex items-center gap-2">
          <span className="text-base">🥅</span>
          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Goleador del torneo</span>
          {topScorer && (
            <span className="ml-auto text-xs text-slate-500">
              {topScorer.player_name} ({topScorer.goals} goles)
            </span>
          )}
        </div>
        {!topScorer ? (
          <div className="px-4 py-4 text-center text-slate-500 text-sm">
            En espera del resultado final del torneo...
          </div>
        ) : (
          <div className="divide-y divide-surface-border/50">
            {entries.map(entry => {
              const pick = specialPicks.find(p => p.user_id === entry.user_id)
              const normalize = (s: string) => s.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
              const predicted = normalize(pick?.top_scorer_tournament ?? '')
              const actual = normalize(topScorer.player_name)
              const isCorrect = predicted !== '' && predicted === actual
              const isMe = entry.user_id === currentUserId
              return (
                <div
                  key={entry.user_id}
                  className={`px-4 py-3 flex items-center gap-3 ${isMe ? 'bg-fifa-green/5' : ''}`}
                >
                  <div className="w-7 h-7 rounded-full bg-surface-border flex items-center justify-center text-xs font-bold text-slate-400 flex-shrink-0">
                    {entry.profile.display_name.charAt(0).toUpperCase()}
                  </div>
                  <span className={`flex-1 text-sm font-medium ${isMe ? 'text-fifa-green' : 'text-slate-200'}`}>
                    {entry.profile.display_name}
                  </span>
                  <span className="text-xs text-slate-500 mr-2">
                    {pick?.top_scorer_tournament ?? <em className="text-slate-600">Sin predicción</em>}
                  </span>
                  {isCorrect && <span className="text-green-400 text-sm font-bold">✓ Premio</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
