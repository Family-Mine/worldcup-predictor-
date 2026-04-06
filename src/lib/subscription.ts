// src/lib/subscription.ts
import { createClient } from '@supabase/supabase-js'

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data } = await supabase
    .from('subscriptions')
    .select('status, expires_at')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (!data) return false
  if (data.expires_at && new Date(data.expires_at) < new Date()) return false
  return true
}
