// src/components/pools/PoolLeaderboard.tsx
import type { LeaderboardEntryWithProfile } from '@/types/pools'

interface PoolLeaderboardProps {
  entries: LeaderboardEntryWithProfile[]
  currentUserId: string
}

const MEDALS = ['🥇', '🥈', '🥉']

export function PoolLeaderboard({ entries, currentUserId }: PoolLeaderboardProps) {
  const sorted = [...entries].sort((a, b) =>
    b.total_points - a.total_points || b.exact_scores - a.exact_scores
  )

  if (sorted.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p className="text-4xl mb-3">⏳</p>
        <p className="text-sm">Nadie ha hecho predicciones todavía.</p>
        <p className="text-xs text-slate-600 mt-1">¡Sé el primero!</p>
      </div>
    )
  }

  return (
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
                className={`transition-colors ${isMe ? 'bg-fifa-gold/5 border-l-2 border-l-fifa-gold' : 'hover:bg-white/[0.02]'}`}
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
                    <span className={`font-medium ${isMe ? 'text-fifa-gold' : 'text-slate-200'}`}>
                      {entry.profile.display_name}
                      {isMe && <span className="text-xs text-slate-500 ml-1">(tú)</span>}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className={`text-lg font-black ${isMe ? 'text-fifa-gold' : 'text-white'}`}>
                    {entry.total_points}
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

      {/* Legend */}
      <div className="px-4 py-2 border-t border-surface-border/50 flex gap-4 text-xs text-slate-600">
        <span><span className="text-green-400">★</span> Exacto = 3 pts</span>
        <span>Ganador correcto = 1 pt</span>
        <span>Incorrecto = 0 pts</span>
      </div>
    </div>
  )
}
