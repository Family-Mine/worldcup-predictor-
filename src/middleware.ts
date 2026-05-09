// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

const locales = ['es', 'en']
const defaultLocale = 'es'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Build a base response we can mutate with refreshed Supabase cookies
  let response = NextResponse.next({ request })

  // Refresh the Supabase session on every request. getUser() validates and
  // rotates the access token if needed; setAll persists the new cookies on
  // both the request (so downstream handlers see them) and the response
  // (so the browser stores them).
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )
  await supabase.auth.getUser()

  // Skip locale logic for API routes, static files, sitemap, favicon, and
  // already-localized paths — but still return the response with refreshed cookies.
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/sitemap') ||
    locales.some(locale => pathname.startsWith(`/${locale}`))
  ) {
    return response
  }

  // Supabase redirects to Site URL with ?code= when redirectTo is not used
  if (pathname === '/' && request.nextUrl.searchParams.has('code')) {
    const url = request.nextUrl.clone()
    const type = request.nextUrl.searchParams.get('type')
    url.pathname = type === 'recovery' ? '/api/auth/callback' : '/api/auth/callback/oauth'
    url.searchParams.set('locale', defaultLocale)
    return forwardCookies(NextResponse.redirect(url), response)
  }

  // Redirect root and unlocalized paths to default locale
  const url = request.nextUrl.clone()
  url.pathname = `/${defaultLocale}${pathname}`
  return forwardCookies(NextResponse.redirect(url), response)
}

// Carry refreshed Supabase cookies onto a new redirect response
function forwardCookies(target: NextResponse, source: NextResponse) {
  source.cookies.getAll().forEach(c => target.cookies.set(c))
  return target
}

export const config = {
  // Run on everything except static assets and image optimization output
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
