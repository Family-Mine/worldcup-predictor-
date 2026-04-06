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
