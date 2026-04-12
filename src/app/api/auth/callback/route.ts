// src/app/api/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const locale = searchParams.get('locale') ?? 'es'

  if (code) {
    const supabase = getSupabaseServerClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  if (type === 'recovery') {
    return NextResponse.redirect(`${origin}/${locale}/reset-password`)
  }

  return NextResponse.redirect(`${origin}/${locale}`)
}
