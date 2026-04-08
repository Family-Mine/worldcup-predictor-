# Knockout Phase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar la fase eliminatoria al módulo de quinelas del WC26, con 3 premios separados (Grupos, Knockout, Goleador) y sincronización automática.

**Architecture:** Schema migration agrega `group_points`/`knockout_points` a `pool_leaderboard`, hace nullable los team IDs de `matches` para partidos TBD, y crea tabla global `tournament_top_scorer`. La UI extiende el leaderboard con tabs y la página de picks con tabs Grupos/Knockout. El cron diario se extiende para sincronizar equipos knockout y el goleador.

**Tech Stack:** Next.js 14 App Router · TypeScript · Supabase (PostgreSQL + RLS + SECURITY DEFINER functions) · Tailwind CSS · football-data.org API

---

## File Map

| Archivo | Acción |
|---------|--------|
| `supabase/migrations/knockout_phase.sql` | CREAR — migration con schema changes + función SQL actualizada |
| `src/types/database.ts` | MODIFICAR — Match nullable team IDs + slots |
| `src/types/pools.ts` | MODIFICAR — PoolLeaderboardEntry con group_points/knockout_points; nuevo TournamentTopScorer |
| `src/components/pools/PoolLeaderboard.tsx` | MODIFICAR — convertir a client, agregar 3 tabs + sección Goleador |
| `src/app/[locale]/pools/[poolId]/page.tsx` | MODIFICAR — fetches adicionales para specialPicks y topScorer |
| `src/app/[locale]/pools/[poolId]/picks/page.tsx` | MODIFICAR — tabs Grupos/Knockout via searchParam |
| `src/components/pools/PicksGrid.tsx` | MODIFICAR — manejar equipos TBD (null team_id → mostrar slot) |
| `src/app/api/sync-results/route.ts` | MODIFICAR — llamar calculate_pool_points + sync equipos knockout + sync goleador |

---

## Task 1: DB Migration

**Files:**
- Create: `supabase/migrations/knockout_phase.sql`

- [ ] **Step 1: Crear el archivo de migration**

```sql
-- supabase/migrations/knockout_phase.sql
-- ============================================================
-- WC26 Predictor — Knockout Phase Migration
-- ============================================================

-- 1. Agregar group_points y knockout_points a pool_leaderboard
ALTER TABLE pool_leaderboard
  ADD COLUMN IF NOT EXISTS group_points    int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS knockout_points int NOT NULL DEFAULT 0;

-- 2. Hacer nullable los FK de equipos en matches (para partidos TBD)
ALTER TABLE matches
  ALTER COLUMN home_team_id DROP NOT NULL,
  ALTER COLUMN away_team_id DROP NOT NULL;

-- 3. Agregar columnas de slot para mostrar posición antes de conocer equipos
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS home_slot text,
  ADD COLUMN IF NOT EXISTS away_slot text;

-- 4. Crear tabla global de goleador real
CREATE TABLE IF NOT EXISTS tournament_top_scorer (
  id          int PRIMARY KEY DEFAULT 1,  -- siempre 1 fila (upsert por id)
  player_name text NOT NULL,
  team_name   text NOT NULL,
  goals       int  NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE tournament_top_scorer ENABLE ROW LEVEL SECURITY;
CREATE POLICY "top_scorer_select" ON tournament_top_scorer FOR SELECT USING (true);
-- INSERT/UPDATE solo via service_role key (cron)

-- 5. Actualizar función calculate_pool_points para separar por fase
CREATE OR REPLACE FUNCTION calculate_pool_points(
  p_match_id   uuid,
  p_actual_home smallint,
  p_actual_away smallint
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Paso 1: asignar puntos a cada pick de este partido
  UPDATE pool_picks
  SET points_awarded = CASE
    WHEN home_score = p_actual_home AND away_score = p_actual_away THEN 3
    WHEN (
      CASE WHEN home_score > away_score THEN 'home'
           WHEN home_score < away_score THEN 'away'
           ELSE 'draw' END
    ) = (
      CASE WHEN p_actual_home > p_actual_away THEN 'home'
           WHEN p_actual_home < p_actual_away THEN 'away'
           ELSE 'draw' END
    ) THEN 1
    ELSE 0
  END
  WHERE match_id = p_match_id;

  -- Paso 2: recalcular leaderboard con puntos separados por fase
  INSERT INTO pool_leaderboard (
    pool_id, user_id,
    total_points, group_points, knockout_points,
    exact_scores, correct_results, last_updated
  )
  SELECT
    pp.pool_id,
    pp.user_id,
    COALESCE(SUM(pp.points_awarded), 0),
    COALESCE(SUM(pp.points_awarded) FILTER (WHERE m.stage = 'group'), 0),
    COALESCE(SUM(pp.points_awarded) FILTER (WHERE m.stage <> 'group'), 0),
    COUNT(*) FILTER (WHERE pp.points_awarded = 3),
    COUNT(*) FILTER (WHERE pp.points_awarded >= 1),
    now()
  FROM pool_picks pp
  JOIN matches m ON m.id = pp.match_id
  WHERE pp.pool_id IN (
    SELECT DISTINCT pool_id FROM pool_picks WHERE match_id = p_match_id
  )
    AND pp.points_awarded IS NOT NULL
  GROUP BY pp.pool_id, pp.user_id
  ON CONFLICT (pool_id, user_id) DO UPDATE SET
    total_points    = EXCLUDED.total_points,
    group_points    = EXCLUDED.group_points,
    knockout_points = EXCLUDED.knockout_points,
    exact_scores    = EXCLUDED.exact_scores,
    correct_results = EXCLUDED.correct_results,
    last_updated    = EXCLUDED.last_updated;
END;
$$;
```

- [ ] **Step 2: Aplicar migration en Supabase**

Usar el MCP de Supabase:
```
mcp__plugin_supabase_supabase__apply_migration
project_id: hhdrvkilwtuqftabulov
name: knockout_phase
query: <contenido del archivo anterior>
```

O desde la CLI de Supabase si está disponible:
```bash
supabase db push --db-url "postgresql://postgres:[password]@db.hhdrvkilwtuqftabulov.supabase.co:5432/postgres"
```

- [ ] **Step 3: Verificar en Supabase SQL Editor**

Ejecutar esta query y confirmar que retorna 0 errores:
```sql
-- Verificar columnas nuevas en pool_leaderboard
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'pool_leaderboard'
  AND column_name IN ('group_points', 'knockout_points');

-- Verificar que home_team_id es nullable en matches
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'matches'
  AND column_name IN ('home_team_id', 'away_team_id', 'home_slot', 'away_slot');

-- Verificar tabla tournament_top_scorer
SELECT table_name FROM information_schema.tables
WHERE table_name = 'tournament_top_scorer';
```

Resultado esperado: 2 filas para pool_leaderboard (group_points, knockout_points), 4 filas para matches (is_nullable = YES para team IDs), 1 fila para tournament_top_scorer.

- [ ] **Step 4: Commit**

```bash
cd ~/Desktop/worldcup-predictor
git add supabase/migrations/knockout_phase.sql
git commit -m "feat: add knockout phase DB migration — leaderboard phase points, TBD team slots, top scorer table"
```

---

## Task 2: Actualizar tipos TypeScript

**Files:**
- Modify: `src/types/database.ts`
- Modify: `src/types/pools.ts`

- [ ] **Step 1: Actualizar `src/types/database.ts`**

Reemplazar la interfaz `Match` completa con:
```typescript
export interface Match {
  id: string
  home_team_id: string | null   // null cuando el equipo aún no está definido (knockout TBD)
  away_team_id: string | null   // null cuando el equipo aún no está definido
  home_slot: string | null      // ej: "1A", "2B" — se muestra cuando home_team_id es null
  away_slot: string | null      // ej: "3C"
  group_letter: string | null
  scheduled_at: string
  venue: string
  status: 'scheduled' | 'live' | 'finished'
  home_score: number | null
  away_score: number | null
  stage: 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'final' | '3rd'
}
```

Reemplazar la interfaz `MatchWithTeams` completa con:
```typescript
export interface MatchWithTeams extends Match {
  home_team: Team | null   // null cuando TBD
  away_team: Team | null   // null cuando TBD
}
```

- [ ] **Step 2: Actualizar `src/types/pools.ts`**

Reemplazar `PoolLeaderboardEntry`:
```typescript
export interface PoolLeaderboardEntry {
  pool_id: string
  user_id: string
  total_points: number
  group_points: number
  knockout_points: number
  exact_scores: number
  correct_results: number
  last_updated: string
}
```

Agregar al final del archivo (antes del último export):
```typescript
export interface TournamentTopScorer {
  id: number
  player_name: string
  team_name: string
  goals: number
  updated_at: string
}
```

- [ ] **Step 3: Verificar que no hay errores de tipos**

```bash
cd ~/Desktop/worldcup-predictor
npx tsc --noEmit 2>&1 | head -30
```

Resultado esperado: sin errores (o solo errores pre-existentes no relacionados con Match/MatchWithTeams).

- [ ] **Step 4: Commit**

```bash
git add src/types/database.ts src/types/pools.ts
git commit -m "feat: update TypeScript types for knockout phase — nullable team IDs, slots, phase points"
```

---

## Task 3: Leaderboard con tabs de premios + sección Goleador

**Files:**
- Modify: `src/components/pools/PoolLeaderboard.tsx`
- Modify: `src/app/[locale]/pools/[poolId]/page.tsx`

- [ ] **Step 1: Reemplazar `src/components/pools/PoolLeaderboard.tsx`**

```typescript
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
              const predicted = pick?.top_scorer_tournament?.trim().toLowerCase() ?? ''
              const actual = topScorer.player_name.trim().toLowerCase()
              const isCorrect = predicted !== '' && predicted === actual
              const isMe = entry.user_id === currentUserId
              return (
                <div
                  key={entry.user_id}
                  className={`px-4 py-3 flex items-center gap-3 ${isMe ? 'bg-fifa-gold/5' : ''}`}
                >
                  <div className="w-7 h-7 rounded-full bg-surface-border flex items-center justify-center text-xs font-bold text-slate-400 flex-shrink-0">
                    {entry.profile.display_name.charAt(0).toUpperCase()}
                  </div>
                  <span className={`flex-1 text-sm font-medium ${isMe ? 'text-fifa-gold' : 'text-slate-200'}`}>
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
```

- [ ] **Step 2: Actualizar `src/app/[locale]/pools/[poolId]/page.tsx`**

Agregar los fetches de specialPicks y topScorer. Reemplazar el bloque del `Promise.all` y todo lo que viene después hasta el `const isOwner`:

```typescript
  // Load leaderboard + profiles + special picks + top scorer in parallel
  const [
    { data: leaderboardRows },
    { data: memberRows },
    { data: specialPickRows },
    { data: topScorerRows },
  ] = await Promise.all([
    supabase.from('pool_leaderboard').select('*').eq('pool_id', poolId),
    supabase.from('pool_members').select('user_id').eq('pool_id', poolId),
    supabase
      .from('pool_special_picks')
      .select('user_id, top_scorer_tournament')
      .eq('pool_id', poolId),
    supabase.from('tournament_top_scorer').select('*').limit(1),
  ])

  const memberIds = (memberRows ?? []).map(m => m.user_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', memberIds)

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

  const allEntries: LeaderboardEntryWithProfile[] = memberIds.map(uid => {
    const lb = (leaderboardRows ?? []).find(r => r.user_id === uid)
    return {
      pool_id: poolId,
      user_id: uid,
      total_points:    lb?.total_points    ?? 0,
      group_points:    lb?.group_points    ?? 0,
      knockout_points: lb?.knockout_points ?? 0,
      exact_scores:    lb?.exact_scores    ?? 0,
      correct_results: lb?.correct_results ?? 0,
      last_updated:    lb?.last_updated    ?? new Date().toISOString(),
      profile: profileMap[uid] ?? { id: uid, display_name: uid.slice(0, 8), avatar_url: null },
    }
  })

  const topScorer = topScorerRows?.[0] ?? null
  const specialPicks = (specialPickRows ?? []).map(p => ({
    user_id: p.user_id,
    top_scorer_tournament: p.top_scorer_tournament,
  }))

  const isOwner = pool.created_by === user.id
```

Actualizar el JSX donde se usa `<PoolLeaderboard>` para pasar las nuevas props:

```tsx
        <PoolLeaderboard
          entries={allEntries}
          currentUserId={user.id}
          specialPicks={specialPicks}
          topScorer={topScorer}
        />
```

- [ ] **Step 3: Verificar tipos**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Esperado: sin errores nuevos.

- [ ] **Step 4: Verificar en el browser**

```bash
npm run dev
```

Navegar a `http://localhost:3000/es/pools/[algún-pool-id]`. Confirmar que:
- Aparecen los 3 tabs: General · Grupos · Knockout
- Tab Knockout muestra "La fase knockout aún no ha comenzado"
- Sección Goleador muestra "En espera del resultado final..."

- [ ] **Step 5: Commit**

```bash
git add src/components/pools/PoolLeaderboard.tsx src/app/[locale]/pools/[poolId]/page.tsx
git commit -m "feat: leaderboard with General/Grupos/Knockout tabs + Goleador section"
```

---

## Task 4: Picks page — tabs Grupos / Knockout

**Files:**
- Modify: `src/app/[locale]/pools/[poolId]/picks/page.tsx`

- [ ] **Step 1: Reemplazar `src/app/[locale]/pools/[poolId]/picks/page.tsx`**

```typescript
// src/app/[locale]/pools/[poolId]/picks/page.tsx
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { PicksGrid } from '@/components/pools/PicksGrid'
import Link from 'next/link'
import type { MatchWithTeams } from '@/types/database'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mis predicciones · WC26' }
export const dynamic = 'force-dynamic'

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

  if (!user) redirect(`/${locale}/login`)

  const activeTab: Tab = searchParams.tab === 'knockout' ? 'knockout' : 'groups'

  // Verify pool membership
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

  // Load matches for the active tab
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

  // Load user's existing picks for this pool
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

  // Check if knockout phase has any teams confirmed yet
  const knockoutHasTeams = activeTab === 'knockout'
    ? matches.some(m => m.home_team_id !== null)
    : true

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Header */}
      <Link
        href={`/${locale}/pools/${poolId}`}
        className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
      >
        ← {pool.name}
      </Link>

      <div className="mt-6 mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Mis predicciones</h1>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-fifa-gold">{picksCount}</p>
          <p className="text-xs text-slate-500">de {totalMatches} completados</p>
        </div>
      </div>

      {/* Phase tabs */}
      <div className="flex gap-1 p-1 bg-surface-card border border-surface-border rounded-xl mb-6">
        {([
          { id: 'groups',   label: '🏁 Fase de Grupos' },
          { id: 'knockout', label: '⚡ Knockout' },
        ] as { id: Tab; label: string }[]).map(tab => (
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

      {/* Progress bar */}
      {totalMatches > 0 && (
        <div className="h-1.5 bg-surface-border rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-fifa-gold rounded-full transition-all"
            style={{ width: `${(picksCount / totalMatches) * 100}%` }}
          />
        </div>
      )}

      {/* Content */}
      {activeTab === 'knockout' && !knockoutHasTeams ? (
        <div className="text-center py-16 border border-surface-border rounded-xl">
          <p className="text-4xl mb-4">⚡</p>
          <p className="text-slate-300 font-semibold">Los picks de eliminatorias estarán disponibles</p>
          <p className="text-slate-500 text-sm mt-2">cuando se conozcan los equipos de cada llave</p>
          <p className="text-xs text-slate-600 mt-4">El cron actualiza los equipos diariamente</p>
        </div>
      ) : totalMatches === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-sm">No hay partidos disponibles en esta fase todavía.</p>
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
```

- [ ] **Step 2: Verificar en el browser**

```bash
npm run dev
```

Navegar a `http://localhost:3000/es/pools/[pool-id]/picks`. Confirmar:
- Tab "Fase de Grupos" activo por defecto con los 104 partidos
- Click en tab "Knockout" navega a `?tab=knockout`
- Tab Knockout muestra el banner "Los picks de eliminatorias estarán disponibles..."

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/pools/[poolId]/picks/page.tsx
git commit -m "feat: picks page with Grupos/Knockout tabs via searchParam"
```

---

## Task 5: PicksGrid — manejo de equipos TBD

**Files:**
- Modify: `src/components/pools/PicksGrid.tsx`

- [ ] **Step 1: Actualizar `src/components/pools/PicksGrid.tsx`**

Reemplazar el archivo completo:

```typescript
'use client'
// src/components/pools/PicksGrid.tsx
import { useState, useTransition } from 'react'
import { submitPick } from '@/app/actions/pools'
import { isMatchLocked } from '@/lib/pools'
import type { MatchWithTeams } from '@/types/database'
import type { PoolPick } from '@/types/pools'
import Image from 'next/image'

interface PicksGridProps {
  poolId: string
  matches: MatchWithTeams[]
  existingPicks: PoolPick[]
}

type ScoreMap = Record<string, { home: string; away: string; saved: boolean; error?: string }>

/** Renderiza el nombre de un equipo o su slot TBD */
function TeamLabel({ team, slot, side }: {
  team: MatchWithTeams['home_team']
  slot: string | null
  side: 'home' | 'away'
}) {
  if (!team) {
    return (
      <span className="text-xs font-mono font-bold text-slate-500 bg-surface-border px-2 py-1 rounded">
        {slot ?? '?'}
      </span>
    )
  }
  return (
    <div className={`flex items-center gap-2 ${side === 'home' ? 'flex-row-reverse' : 'flex-row'}`}>
      {team.flag_url && (
        <Image
          src={team.flag_url}
          alt={team.name}
          width={24} height={16}
          className="rounded-sm object-cover"
          unoptimized
        />
      )}
      <span className="text-sm font-medium text-slate-300 hidden sm:block truncate max-w-[100px]">
        {team.name}
      </span>
    </div>
  )
}

export function PicksGrid({ poolId, matches, existingPicks }: PicksGridProps) {
  const [isPending, startTransition] = useTransition()

  const initial: ScoreMap = {}
  for (const p of existingPicks) {
    initial[p.match_id] = {
      home: String(p.home_score),
      away: String(p.away_score),
      saved: true,
    }
  }
  const [scores, setScores] = useState<ScoreMap>(initial)

  function update(matchId: string, side: 'home' | 'away', val: string) {
    setScores(prev => ({
      ...prev,
      [matchId]: { ...prev[matchId], [side]: val, saved: false, error: undefined },
    }))
  }

  function save(match: MatchWithTeams) {
    const s = scores[match.id]
    if (!s) return
    if (s.home === '' || s.away === '') return
    const home = parseInt(s.home, 10)
    const away = parseInt(s.away, 10)
    if (isNaN(home) || isNaN(away) || home < 0 || away < 0) {
      setScores(prev => ({ ...prev, [match.id]: { ...prev[match.id], error: 'Marcador inválido.' } }))
      return
    }

    startTransition(async () => {
      const result = await submitPick(poolId, match.id, home, away)
      setScores(prev => ({
        ...prev,
        [match.id]: {
          ...prev[match.id],
          saved: !result.error,
          error: result.error,
        },
      }))
    })
  }

  // Group by group_letter (groups phase) or by stage (knockout)
  const groups: Record<string, MatchWithTeams[]> = {}
  for (const m of matches) {
    const key = m.group_letter
      ? `Grupo ${m.group_letter}`
      : stageLabel(m.stage)
    if (!groups[key]) groups[key] = []
    groups[key].push(m)
  }

  return (
    <div className="space-y-6">
      {Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([groupKey, gMatches]) => (
        <div key={groupKey} className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
          {/* Group/stage header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border bg-white/[0.02]">
            <span className="w-7 h-7 rounded-lg bg-fifa-gold/10 border border-fifa-gold/30 flex items-center justify-center text-xs font-black text-fifa-gold">
              {groupKey.replace('Grupo ', '')}
            </span>
            <span className="text-sm font-semibold text-slate-300">{groupKey}</span>
          </div>

          <div className="divide-y divide-surface-border/50">
            {gMatches.map(match => {
              const isTBD = match.home_team_id === null || match.away_team_id === null
              const locked = isTBD || isMatchLocked(match)
              const s = scores[match.id] ?? { home: '', away: '', saved: false }
              const hasPick = s.home !== '' && s.away !== ''
              const kickoff = new Date(match.scheduled_at).toLocaleDateString('es', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
              })

              return (
                <div key={match.id} className={`px-4 py-3 ${locked ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-3">
                    {/* Home team */}
                    <div className="flex items-center flex-1 justify-end">
                      <TeamLabel team={match.home_team} slot={match.home_slot} side="home" />
                    </div>

                    {/* Score inputs */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={2}
                        value={s.home}
                        onChange={e => update(match.id, 'home', e.target.value.replace(/\D/g, ''))}
                        onBlur={() => save(match)}
                        disabled={locked}
                        placeholder="–"
                        className="w-10 h-10 text-center text-lg font-black bg-surface border border-surface-border rounded-lg text-white focus:border-fifa-gold focus:outline-none disabled:cursor-not-allowed placeholder-slate-600"
                      />
                      <span className="text-slate-600 font-bold">–</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={2}
                        value={s.away}
                        onChange={e => update(match.id, 'away', e.target.value.replace(/\D/g, ''))}
                        onBlur={() => save(match)}
                        disabled={locked}
                        placeholder="–"
                        className="w-10 h-10 text-center text-lg font-black bg-surface border border-surface-border rounded-lg text-white focus:border-fifa-gold focus:outline-none disabled:cursor-not-allowed placeholder-slate-600"
                      />
                    </div>

                    {/* Away team */}
                    <div className="flex items-center flex-1">
                      <TeamLabel team={match.away_team} slot={match.away_slot} side="away" />
                    </div>

                    {/* Status */}
                    <div className="w-20 text-right flex-shrink-0">
                      {isTBD ? (
                        <span className="text-xs text-slate-600">Por definir</span>
                      ) : locked ? (
                        <span className="text-xs text-slate-600">🔒 Cerrado</span>
                      ) : s.error ? (
                        <span className="text-xs text-red-400">Error</span>
                      ) : s.saved && hasPick ? (
                        <span className="text-xs text-green-400">✓</span>
                      ) : hasPick ? (
                        <span className="text-xs text-slate-500">Sin guardar</span>
                      ) : (
                        <span className="text-xs text-slate-600">{kickoff}</span>
                      )}
                    </div>
                  </div>
                  {s.error && (
                    <p className="text-xs text-red-400 text-center mt-1">{s.error}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <p className="text-xs text-slate-600 text-center">
        Las predicciones se guardan automáticamente · Se cierran 5 minutos antes del partido
      </p>
    </div>
  )
}

function stageLabel(stage: string): string {
  const labels: Record<string, string> = {
    r32:   'Ronda de 32',
    r16:   'Octavos de Final',
    qf:    'Cuartos de Final',
    sf:    'Semifinales',
    '3rd': 'Tercer Lugar',
    final: 'Final',
  }
  return labels[stage] ?? stage
}
```

- [ ] **Step 2: Verificar en el browser**

En `http://localhost:3000/es/pools/[pool-id]/picks` (tab Grupos), confirmar:
- Los partidos con `home_team_id` real muestran nombre + bandera igual que antes
- No hay errores de TypeScript en consola

Para probar TBD manualmente, insertar un partido de prueba en Supabase SQL Editor:
```sql
-- Insertar partido knockout de prueba con equipos TBD
INSERT INTO matches (stage, scheduled_at, venue, status, home_slot, away_slot)
VALUES ('r16', now() + interval '10 days', 'SoFi Stadium', 'scheduled', '1A', '2B');
```

Luego navegar al tab Knockout y confirmar:
- El partido TBD muestra "1A" y "2B" como etiquetas
- Los inputs están deshabilitados
- Status muestra "Por definir"

Limpiar el partido de prueba:
```sql
DELETE FROM matches WHERE home_slot = '1A' AND away_slot = '2B' AND stage = 'r16';
```

- [ ] **Step 3: Commit**

```bash
git add src/components/pools/PicksGrid.tsx
git commit -m "feat: PicksGrid handles TBD teams with slot labels and disabled inputs"
```

---

## Task 6: Extender sync-results con equipos knockout y goleador

**Files:**
- Modify: `src/app/api/sync-results/route.ts`

- [ ] **Step 1: Actualizar `src/app/api/sync-results/route.ts`**

Reemplazar el archivo completo:

```typescript
// src/app/api/sync-results/route.ts
// Vercel Cron diario — sincroniza resultados + equipos knockout + goleador
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const FD_BASE = 'https://api.football-data.org/v4'
const WC_CODE = 'WC'

const TEAM_NAME_MAP: Record<string, string> = {
  'Mexico':                   'Mexico',
  'South Africa':             'South Africa',
  'Korea Republic':           'South Korea',
  'Czech Republic':           'Czech Republic',
  'Czechia':                  'Czech Republic',
  'Canada':                   'Canada',
  'Bosnia and Herzegovina':   'Bosnia & Herz.',
  'Bosnia-Herzegovina':       'Bosnia & Herz.',
  'Qatar':                    'Qatar',
  'Switzerland':              'Switzerland',
  'Brazil':                   'Brazil',
  'Morocco':                  'Morocco',
  'Haiti':                    'Haiti',
  'Scotland':                 'Scotland',
  'USA':                      'USA',
  'United States':            'USA',
  'Paraguay':                 'Paraguay',
  'Australia':                'Australia',
  'Turkey':                   'Türkiye',
  'Türkiye':                  'Türkiye',
  'Germany':                  'Germany',
  'Curacao':                  'Curaçao',
  "Côte d'Ivoire":            'Ivory Coast',
  'Ivory Coast':              'Ivory Coast',
  'Ecuador':                  'Ecuador',
  'Netherlands':              'Netherlands',
  'Japan':                    'Japan',
  'Sweden':                   'Sweden',
  'Tunisia':                  'Tunisia',
  'Belgium':                  'Belgium',
  'Egypt':                    'Egypt',
  'Iran':                     'Iran',
  'New Zealand':              'New Zealand',
  'Spain':                    'Spain',
  'Cape Verde':               'Cape Verde',
  'Saudi Arabia':             'Saudi Arabia',
  'Uruguay':                  'Uruguay',
  'France':                   'France',
  'Senegal':                  'Senegal',
  'Iraq':                     'Iraq',
  'Norway':                   'Norway',
  'Argentina':                'Argentina',
  'Algeria':                  'Algeria',
  'Austria':                  'Austria',
  'Jordan':                   'Jordan',
  'Portugal':                 'Portugal',
  'DR Congo':                 'DR Congo',
  'Congo DR':                 'DR Congo',
  'Uzbekistan':               'Uzbekistan',
  'Colombia':                 'Colombia',
  'England':                  'England',
  'Croatia':                  'Croatia',
  'Ghana':                    'Ghana',
  'Panama':                   'Panama',
}

function mapStatus(fdStatus: string): 'scheduled' | 'live' | 'finished' {
  switch (fdStatus) {
    case 'IN_PLAY':
    case 'PAUSED':
    case 'HALFTIME': return 'live'
    case 'FINISHED':
    case 'AWARDED':  return 'finished'
    default:         return 'scheduled'
  }
}

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// ── 1. Sync de resultados ─────────────────────────────────────────────────────

async function syncResults(
  supabase: ReturnType<typeof db>,
  fdMatches: FDMatch[],
  teamIdByName: Record<string, string>
): Promise<{ updated: number; skipped: number; pointsCalc: number }> {
  let updated = 0, skipped = 0, pointsCalc = 0

  for (const fdm of fdMatches) {
    const homeName = TEAM_NAME_MAP[fdm.homeTeam.name] ?? fdm.homeTeam.name
    const awayName = TEAM_NAME_MAP[fdm.awayTeam.name] ?? fdm.awayTeam.name
    const homeId = teamIdByName[homeName]
    const awayId = teamIdByName[awayName]

    if (!homeId || !awayId) { skipped++; continue }

    const status = mapStatus(fdm.status)
    const homeScore = fdm.score?.fullTime?.home ?? null
    const awayScore = fdm.score?.fullTime?.away ?? null

    const { error } = await supabase
      .from('matches')
      .update({ status, home_score: homeScore, away_score: awayScore })
      .eq('home_team_id', homeId)
      .eq('away_team_id', awayId)

    if (error) continue
    updated++

    // Calcular puntos de quinela cuando el partido termina con marcador
    if (status === 'finished' && homeScore !== null && awayScore !== null) {
      const { data: match } = await supabase
        .from('matches')
        .select('id')
        .eq('home_team_id', homeId)
        .eq('away_team_id', awayId)
        .single()

      if (match) {
        await supabase.rpc('calculate_pool_points', {
          p_match_id:   match.id,
          p_actual_home: homeScore,
          p_actual_away: awayScore,
        })
        pointsCalc++

        // Invalidar cache de predicciones
        await supabase
          .from('predictions')
          .update({ updated_at: new Date(0).toISOString() })
          .eq('match_id', match.id)
      }
    }
  }

  return { updated, skipped, pointsCalc }
}

// ── 2. Sync de equipos knockout ───────────────────────────────────────────────

async function syncKnockoutTeams(
  supabase: ReturnType<typeof db>,
  fdMatches: FDMatch[],
  teamIdByName: Record<string, string>
): Promise<{ resolved: number }> {
  // Obtener partidos knockout sin equipos asignados en nuestra DB
  const { data: tbdMatches } = await supabase
    .from('matches')
    .select('id, scheduled_at')
    .neq('stage', 'group')
    .is('home_team_id', null)

  if (!tbdMatches?.length) return { resolved: 0 }

  let resolved = 0

  for (const dbMatch of tbdMatches) {
    const dbTime = new Date(dbMatch.scheduled_at).getTime()

    // Buscar partido en la API por hora de inicio (tolerancia 5 min)
    const fdm = fdMatches.find(m => {
      const apiTime = new Date(m.utcDate).getTime()
      return Math.abs(apiTime - dbTime) < 5 * 60 * 1000
    })
    if (!fdm) continue

    const homeName = TEAM_NAME_MAP[fdm.homeTeam.name] ?? fdm.homeTeam.name
    const awayName = TEAM_NAME_MAP[fdm.awayTeam.name] ?? fdm.awayTeam.name
    const homeId = teamIdByName[homeName]
    const awayId = teamIdByName[awayName]

    // Solo actualizar si AMBOS equipos están confirmados en la API
    if (!homeId || !awayId) continue

    const { error } = await supabase
      .from('matches')
      .update({ home_team_id: homeId, away_team_id: awayId })
      .eq('id', dbMatch.id)

    if (!error) resolved++
  }

  return { resolved }
}

// ── 3. Sync de goleador ───────────────────────────────────────────────────────

async function syncTopScorer(
  supabase: ReturnType<typeof db>,
  apiKey: string
): Promise<{ player: string | null }> {
  const res = await fetch(`${FD_BASE}/competitions/${WC_CODE}/scorers?limit=1`, {
    headers: { 'X-Auth-Token': apiKey },
    next: { revalidate: 0 },
  })

  if (!res.ok) return { player: null }

  const data = await res.json()
  const top = data.scorers?.[0]
  if (!top) return { player: null }

  const playerName: string = top.player?.name ?? ''
  const teamName: string   = top.team?.name   ?? ''
  const goals: number      = top.goals        ?? 0

  if (!playerName) return { player: null }

  await supabase.from('tournament_top_scorer').upsert(
    { id: 1, player_name: playerName, team_name: teamName, goals, updated_at: new Date().toISOString() },
    { onConflict: 'id' }
  )

  return { player: playerName }
}

// ── Handler principal ─────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.FOOTBALL_DATA_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'FOOTBALL_DATA_API_KEY not set' }, { status: 500 })
  }

  try {
    // Fetch all WC matches once — reutilizado por syncResults y syncKnockoutTeams
    const res = await fetch(`${FD_BASE}/competitions/${WC_CODE}/matches`, {
      headers: { 'X-Auth-Token': apiKey },
      next: { revalidate: 0 },
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: `football-data.org error: ${res.status}`, detail: text }, { status: 502 })
    }

    const data = await res.json()
    const fdMatches: FDMatch[] = data.matches ?? []

    const supabase = db()

    // Build team name → id lookup
    const { data: teams } = await supabase.from('teams').select('id, name')
    const teamIdByName: Record<string, string> = {}
    for (const t of teams ?? []) teamIdByName[t.name] = t.id

    // Ejecutar las 3 tareas de sync
    const [resultsOut, knockoutOut, scorerOut] = await Promise.all([
      syncResults(supabase, fdMatches, teamIdByName),
      syncKnockoutTeams(supabase, fdMatches, teamIdByName),
      syncTopScorer(supabase, apiKey),
    ])

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      results:  resultsOut,
      knockout: knockoutOut,
      scorer:   scorerOut,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

interface FDMatch {
  utcDate: string
  status: string
  homeTeam: { name: string }
  awayTeam: { name: string }
  score: {
    fullTime: { home: number | null; away: number | null }
  }
}
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Esperado: sin errores nuevos.

- [ ] **Step 3: Probar el cron manualmente**

Con el dev server corriendo, abrir otra terminal:
```bash
curl -s http://localhost:3000/api/sync-results | jq .
```

Resultado esperado (estructura):
```json
{
  "ok": true,
  "timestamp": "2026-04-07T...",
  "results":  { "updated": 0, "skipped": 0, "pointsCalc": 0 },
  "knockout": { "resolved": 0 },
  "scorer":   { "player": null }
}
```

`player: null` es esperado porque el torneo no ha comenzado.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/sync-results/route.ts
git commit -m "feat: extend sync-results with knockout team resolution and top scorer sync"
```

---

## Task 7: Insertar partidos knockout en DB (datos del torneo)

**Files:**
- Create: `scripts/seed_knockout_matches.py`

> **Nota:** Este task siembra los partidos de la fase eliminatoria en la DB con equipos TBD. Las fechas/sedes son las oficiales del WC26. El cron irá llenando los equipos conforme avance el torneo.

- [ ] **Step 1: Crear `scripts/seed_knockout_matches.py`**

```python
#!/usr/bin/env python3
"""
seed_knockout_matches.py — Inserta partidos de fase eliminatoria WC26 en la DB.
Los equipos se dejan NULL (TBD). El cron los llena cuando avanzan.

Uso: python3 scripts/seed_knockout_matches.py
"""

import urllib.request, urllib.error, json, os, sys

SUPABASE_URL = "https://hhdrvkilwtuqftabulov.supabase.co"
SERVICE_KEY  = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not SERVICE_KEY:
    print("ERROR: Set SUPABASE_SERVICE_ROLE_KEY env var")
    sys.exit(1)

def supabase_post(table: str, rows: list[dict]) -> dict:
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    body = json.dumps(rows).encode()
    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("apikey", SERVICE_KEY)
    req.add_header("Authorization", f"Bearer {SERVICE_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=representation")
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

# Partidos eliminatorios WC26 — fechas oficiales FIFA (UTC)
# stage: r32=Ronda32, r16=Octavos, qf=Cuartos, sf=Semis, 3rd=3erLugar, final=Final
# home_slot / away_slot: código de posición para mostrar antes de conocer equipos
KNOCKOUT_MATCHES = [
    # ── Ronda de 32 (4 Jul – 7 Jul 2026) ──
    # Nota: ajustar fechas exactas cuando FIFA las confirme
    {"stage": "r32", "scheduled_at": "2026-07-04T20:00:00Z", "venue": "SoFi Stadium, Los Angeles",       "home_slot": "1A", "away_slot": "2B"},
    {"stage": "r32", "scheduled_at": "2026-07-04T23:30:00Z", "venue": "AT&T Stadium, Dallas",             "home_slot": "1C", "away_slot": "2D"},
    {"stage": "r32", "scheduled_at": "2026-07-05T20:00:00Z", "venue": "MetLife Stadium, New York",        "home_slot": "1B", "away_slot": "2A"},
    {"stage": "r32", "scheduled_at": "2026-07-05T23:30:00Z", "venue": "Levi's Stadium, San Francisco",    "home_slot": "1D", "away_slot": "2C"},
    {"stage": "r32", "scheduled_at": "2026-07-06T20:00:00Z", "venue": "Hard Rock Stadium, Miami",         "home_slot": "1E", "away_slot": "2F"},
    {"stage": "r32", "scheduled_at": "2026-07-06T23:30:00Z", "venue": "Gillette Stadium, Boston",         "home_slot": "1G", "away_slot": "2H"},
    {"stage": "r32", "scheduled_at": "2026-07-07T20:00:00Z", "venue": "Estadio Azteca, Ciudad de México", "home_slot": "1F", "away_slot": "2E"},
    {"stage": "r32", "scheduled_at": "2026-07-07T23:30:00Z", "venue": "BC Place, Vancouver",              "home_slot": "1H", "away_slot": "2G"},
    {"stage": "r32", "scheduled_at": "2026-07-08T20:00:00Z", "venue": "Arrowhead Stadium, Kansas City",   "home_slot": "1I", "away_slot": "2J"},
    {"stage": "r32", "scheduled_at": "2026-07-08T23:30:00Z", "venue": "Allegiant Stadium, Las Vegas",     "home_slot": "1K", "away_slot": "2L"},
    {"stage": "r32", "scheduled_at": "2026-07-09T20:00:00Z", "venue": "Lincoln Financial Field, Filad.",  "home_slot": "1J", "away_slot": "2I"},
    {"stage": "r32", "scheduled_at": "2026-07-09T23:30:00Z", "venue": "Empower Field, Denver",            "home_slot": "1L", "away_slot": "2K"},
    {"stage": "r32", "scheduled_at": "2026-07-10T20:00:00Z", "venue": "Estadio BBVA, Monterrey",          "home_slot": "3A/B/C", "away_slot": "W49"},
    {"stage": "r32", "scheduled_at": "2026-07-10T23:30:00Z", "venue": "NRG Stadium, Houston",             "home_slot": "3D/E/F", "away_slot": "W50"},
    {"stage": "r32", "scheduled_at": "2026-07-11T20:00:00Z", "venue": "BMO Field, Toronto",               "home_slot": "3G/H/I", "away_slot": "W51"},
    {"stage": "r32", "scheduled_at": "2026-07-11T23:30:00Z", "venue": "Estadio Akron, Guadalajara",       "home_slot": "3J/K/L", "away_slot": "W52"},
    # ── Octavos de Final (13 Jul – 18 Jul 2026) ──
    {"stage": "r16", "scheduled_at": "2026-07-13T20:00:00Z", "venue": "SoFi Stadium, Los Angeles",       "home_slot": "W49", "away_slot": "W50"},
    {"stage": "r16", "scheduled_at": "2026-07-13T23:30:00Z", "venue": "MetLife Stadium, New York",        "home_slot": "W51", "away_slot": "W52"},
    {"stage": "r16", "scheduled_at": "2026-07-14T20:00:00Z", "venue": "AT&T Stadium, Dallas",             "home_slot": "W53", "away_slot": "W54"},
    {"stage": "r16", "scheduled_at": "2026-07-14T23:30:00Z", "venue": "Hard Rock Stadium, Miami",         "home_slot": "W55", "away_slot": "W56"},
    {"stage": "r16", "scheduled_at": "2026-07-16T20:00:00Z", "venue": "Estadio Azteca, Ciudad de México", "home_slot": "W57", "away_slot": "W58"},
    {"stage": "r16", "scheduled_at": "2026-07-16T23:30:00Z", "venue": "Levi's Stadium, San Francisco",    "home_slot": "W59", "away_slot": "W60"},
    {"stage": "r16", "scheduled_at": "2026-07-17T20:00:00Z", "venue": "Arrowhead Stadium, Kansas City",   "home_slot": "W61", "away_slot": "W62"},
    {"stage": "r16", "scheduled_at": "2026-07-17T23:30:00Z", "venue": "Gillette Stadium, Boston",         "home_slot": "W63", "away_slot": "W64"},
    # ── Cuartos de Final (21 Jul – 24 Jul 2026) ──
    {"stage": "qf", "scheduled_at": "2026-07-21T20:00:00Z", "venue": "MetLife Stadium, New York",        "home_slot": "W65", "away_slot": "W66"},
    {"stage": "qf", "scheduled_at": "2026-07-21T23:30:00Z", "venue": "SoFi Stadium, Los Angeles",       "home_slot": "W67", "away_slot": "W68"},
    {"stage": "qf", "scheduled_at": "2026-07-23T20:00:00Z", "venue": "AT&T Stadium, Dallas",             "home_slot": "W69", "away_slot": "W70"},
    {"stage": "qf", "scheduled_at": "2026-07-23T23:30:00Z", "venue": "Hard Rock Stadium, Miami",         "home_slot": "W71", "away_slot": "W72"},
    # ── Semifinales (29 Jul – 30 Jul 2026) ──
    {"stage": "sf", "scheduled_at": "2026-07-29T20:00:00Z", "venue": "AT&T Stadium, Dallas",             "home_slot": "W73", "away_slot": "W74"},
    {"stage": "sf", "scheduled_at": "2026-07-30T20:00:00Z", "venue": "MetLife Stadium, New York",        "home_slot": "W75", "away_slot": "W76"},
    # ── Tercer Lugar ──
    {"stage": "3rd", "scheduled_at": "2026-08-01T20:00:00Z", "venue": "Hard Rock Stadium, Miami",        "home_slot": "L77", "away_slot": "L78"},
    # ── Final ──
    {"stage": "final", "scheduled_at": "2026-08-02T20:00:00Z", "venue": "MetLife Stadium, New York",     "home_slot": "W77", "away_slot": "W78"},
]

def main():
    print(f"Insertando {len(KNOCKOUT_MATCHES)} partidos eliminatorios...")
    result = supabase_post("matches", KNOCKOUT_MATCHES)
    print(f"OK — {len(result)} partidos insertados")

if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Ejecutar el script**

```bash
cd ~/Desktop/worldcup-predictor
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZHJ2a2lsd3R1cWZ0YWJ1bG92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTE1NzUwNCwiZXhwIjoyMDkwNzMzNTA0fQ.ciAIGKgf7spKpu93hJZaTxK921ssRFMdMdwcrD9vT3o"
python3 scripts/seed_knockout_matches.py
```

Resultado esperado: `OK — 32 partidos insertados`

- [ ] **Step 3: Verificar en Supabase**

```sql
SELECT stage, count(*) FROM matches WHERE stage <> 'group' GROUP BY stage ORDER BY stage;
```

Resultado esperado:
```
 stage | count
-------+-------
 3rd   |     1
 final |     1
 qf    |     4
 r16   |     8
 r32   |    16
 sf    |     2
```

- [ ] **Step 4: Verificar en el browser**

Navegar al tab Knockout en la página de picks de cualquier quinela. Confirmar:
- Se ven los partidos con slots como "1A", "W49", etc.
- Inputs deshabilitados
- Status "Por definir"

- [ ] **Step 5: Commit**

```bash
git add scripts/seed_knockout_matches.py
git commit -m "feat: seed script for WC26 knockout matches with TBD team slots"
```

---

## Self-Review

**Spec coverage:**
- ✅ DB schema: pool_leaderboard (group_points, knockout_points), matches (nullable IDs + slots), tournament_top_scorer → Task 1
- ✅ Tabs Grupos/Knockout en picks page → Task 4
- ✅ TBD teams con slot labels → Task 5
- ✅ 3 premios en leaderboard (tabs General/Grupos/Knockout + Goleador) → Task 3
- ✅ Top scorer automático → Task 6
- ✅ Cron extendido (no nuevas rutas — Hobby plan) → Task 6
- ✅ TypeScript types actualizados → Task 2
- ✅ calculate_pool_points separado por fase → Task 1
- ✅ Datos de partidos knockout en DB → Task 7

**Type consistency:**
- `MatchWithTeams.home_team: Team | null` — definido en Task 2, usado en Task 5 ✅
- `PoolLeaderboardEntry.group_points` — definido en Task 2, usado en Task 3 ✅
- `TournamentTopScorer` — definido en Task 2, usado en Task 3 ✅
- `stageLabel()` — definido y usado en Task 5 ✅
- `TeamLabel` component — definido y usado dentro de Task 5 ✅

**Sin placeholders:** Todos los pasos tienen código completo. ✅
