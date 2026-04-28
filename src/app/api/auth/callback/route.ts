import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const locale = searchParams.get('locale') ?? 'es'

  // Default: go home. Only go to reset-password for email recovery sessions.
  let destination = `${origin}/${locale}`

  const response = NextResponse.redirect(destination)

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )
    const { data } = await supabase.auth.exchangeCodeForSession(code)

    // Only redirect to reset-password if this is genuinely an email recovery session.
    // Social OAuth (Google/Apple) should never land on reset-password even if
    // Supabase included type=recovery in the callback URL.
    const provider = data?.session?.user?.app_metadata?.provider
    const isSocialOAuth = provider === 'google' || provider === 'apple'

    if (type === 'recovery' && !isSocialOAuth) {
      destination = `${origin}/${locale}/reset-password`
      return NextResponse.redirect(destination, { headers: response.headers })
    }
  }

  return response
}
