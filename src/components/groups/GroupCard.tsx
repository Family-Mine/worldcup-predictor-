'use client'
// src/components/groups/GroupCard.tsx
import Link from 'next/link'
import { useLocale } from 'next-intl'
import type { Team } from '@/types/database'
import { TeamFlag } from '@/components/teams/TeamFlag'

interface GroupCardProps {
  letter: string
  teams: Team[]
}

export function GroupCard({ letter, teams }: GroupCardProps) {
  const locale = useLocale()
  const prefix = `/${locale}`

  return (
    <Link href={`${prefix}/groups/${letter}`}>
      <div className="bg-surface-card border border-surface-border rounded-xl p-4 hover:border-fifa-gold transition-colors cursor-pointer group h-full">
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-black text-white group-hover:text-fifa-gold transition-colors">
            Group {letter}
          </span>
          <span className="text-xs text-slate-500">4 teams</span>
        </div>
        <div className="space-y-2">
          {teams.map(team => (
            <div key={team.id} className="flex items-center gap-2">
              <TeamFlag countryCode={team.country_code} name={team.name} size="sm" />
              <span className="text-sm text-slate-300 truncate">{team.name}</span>
              <span className="ml-auto text-xs text-slate-500 flex-shrink-0">#{team.fifa_ranking}</span>
            </div>
          ))}
        </div>
      </div>
    </Link>
  )
}
