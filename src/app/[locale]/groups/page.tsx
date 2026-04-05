// src/app/[locale]/groups/page.tsx
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { GroupCard } from '@/components/groups/GroupCard'
import type { Team } from '@/types/database'

export const revalidate = 3600

export default async function GroupsPage() {
  const supabase = getSupabaseServerClient()
  const { data: teams, error } = await supabase
    .from('teams')
    .select('*')
    .order('group_letter', { ascending: true })
    .order('fifa_ranking', { ascending: true })

  if (error) {
    console.error('Error fetching teams:', error)
  }

  const groupedTeams = ((teams as Team[]) ?? []).reduce<Record<string, Team[]>>((acc, team) => {
    const g = team.group_letter
    if (!acc[g]) acc[g] = []
    acc[g].push(team)
    return acc
  }, {})

  const groupLetters = Object.keys(groupedTeams).sort()

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-white mb-2">World Cup Groups</h1>
      <p className="text-slate-400 mb-8">48 teams · 12 groups · Groups A through L</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {groupLetters.map(letter => (
          <GroupCard key={letter} letter={letter} teams={groupedTeams[letter]} />
        ))}
      </div>
    </div>
  )
}
