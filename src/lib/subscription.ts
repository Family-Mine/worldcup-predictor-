// src/lib/subscription.ts
import type { SupabaseClient } from '@supabase/supabase-js'

export async function hasActiveSubscription(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('status, expires_at')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (error || !data) return false
  if (data.expires_at && new Date(data.expires_at) < new Date()) return false
  return true
}

export async function hasGroupBundle(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_add_ons')
    .select('add_on')
    .eq('user_id', userId)
    .eq('add_on', 'group_bundle')
    .maybeSingle()

  return !error && !!data
}
