'use server'
// src/app/actions/pools.ts
import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isMatchLocked } from '@/lib/pools'

async function getUser() {
  const supabase = getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

// ── Create pool ───────────────────────────────────────────────

export async function createPool(_prev: unknown, formData: FormData) {
  const { supabase, user } = await getUser()
  const locale = (formData.get('locale') as string) || 'en'
  if (!user) redirect(`/${locale}/login`)

  const name = (formData.get('name') as string)?.trim()
  if (!name || name.length < 3) return { error: 'El nombre debe tener al menos 3 caracteres.' }

  const { data: pool, error } = await supabase
    .from('pools')
    .insert({ name, created_by: user.id })
    .select()
    .single()

  if (error || !pool) return { error: error?.message ?? 'No se pudo crear el pool.' }

  // Creator auto-joins
  const { error: memberError } = await supabase
    .from('pool_members')
    .insert({ pool_id: pool.id, user_id: user.id })
  if (memberError) return { error: 'No se pudo unir al pool creado.' }

  // Init leaderboard entry
  const { error: lbError } = await supabase.from('pool_leaderboard').insert({
    pool_id: pool.id, user_id: user.id,
    total_points: 0, group_points: 0, knockout_points: 0, exact_scores: 0, correct_results: 0,
  })
  if (lbError) return { error: 'No se pudo inicializar el marcador.' }

  redirect(`/${locale}/pools/${pool.id}`)
}

// ── Join pool ─────────────────────────────────────────────────

export async function joinPool(_prev: unknown, formData: FormData) {
  const { supabase, user } = await getUser()
  const locale = (formData.get('locale') as string) || 'en'
  if (!user) redirect(`/${locale}/login`)

  const code = (formData.get('code') as string)?.trim().toUpperCase()
  if (!code) return { error: 'Ingresa el código de invitación.' }

  // Use RPC to bypass RLS (non-members can't read pools yet)
  const { data: poolId, error: rpcError } = await supabase
    .rpc('get_pool_id_by_invite_code', { p_code: code })

  if (rpcError || !poolId) return { error: 'Código inválido. Verifica e intenta de nuevo.' }

  const { error } = await supabase
    .from('pool_members')
    .insert({ pool_id: poolId, user_id: user.id })

  // 23505 = unique_violation (already a member), just redirect
  if (error && error.code !== '23505') {
    return { error: 'No se pudo unir al pool.' }
  }

  // Init leaderboard entry if not exists
  await supabase.from('pool_leaderboard').upsert(
    { pool_id: poolId, user_id: user.id, total_points: 0, group_points: 0, knockout_points: 0, exact_scores: 0, correct_results: 0 },
    { onConflict: 'pool_id,user_id', ignoreDuplicates: true }
  )

  redirect(`/${locale}/pools/${poolId}`)
}

// ── Submit pick ───────────────────────────────────────────────

export async function submitPick(
  poolId: string,
  matchId: string,
  homeScore: number,
  awayScore: number
): Promise<{ error?: string }> {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'No autenticado.' }

  // Check match lock
  const { data: match } = await supabase
    .from('matches')
    .select('scheduled_at')
    .eq('id', matchId)
    .single()

  if (!match) return { error: 'Partido no encontrado.' }
  if (isMatchLocked(match)) return { error: 'Las predicciones para este partido están cerradas.' }

  const { error } = await supabase.from('pool_picks').upsert(
    {
      pool_id: poolId,
      user_id: user.id,
      match_id: matchId,
      home_score: homeScore,
      away_score: awayScore,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'pool_id,user_id,match_id' }
  )

  if (error) return { error: 'No se pudo guardar la predicción.' }
  return {}
}

// ── Submit special pick ───────────────────────────────────────

export async function submitSpecialPick(
  poolId: string,
  topScorerTournament: string,
  topScorerGroupPhase: string
): Promise<{ error?: string }> {
  const { supabase, user } = await getUser()
  if (!user) return { error: 'No autenticado.' }

  const { error } = await supabase.from('pool_special_picks').upsert(
    {
      pool_id: poolId,
      user_id: user.id,
      top_scorer_tournament: topScorerTournament.trim() || null,
      top_scorer_group_phase: topScorerGroupPhase.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'pool_id,user_id' }
  )

  if (error) return { error: 'No se pudo guardar.' }
  return {}
}
