import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const locale = searchParams.get('locale') ?? 'es'

  // OAuth provider returned an error (e.g. user cancelled, access denied)
  if (error) {
    return NextResponse.redirect(`${origin}/${locale}/login?oauth_error=${encodeURIComponent(error)}`)
  }

  const response = NextResponse.redirect(`${origin}/${locale}/welcome`)

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
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    // On mobile in-app browsers (WhatsApp, Instagram, etc.) the PKCE code
    // verifier cookie may be lost when the browser context switches for OAuth.
    // Instead of silently leaving the user unauthenticated, redirect to login.
    if (exchangeError) {
      return NextResponse.redirect(`${origin}/${locale}/login?oauth_error=session_failed`)
    }
  }

  return response
}
