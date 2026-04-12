// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server'

const locales = ['es', 'en']
const defaultLocale = 'es'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip API routes, static files, and already-localized paths
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/sitemap') ||
    locales.some(locale => pathname.startsWith(`/${locale}`))
  ) {
    return NextResponse.next()
  }

  // Redirect root and unlocalized paths to default locale
  const url = request.nextUrl.clone()
  url.pathname = `/${defaultLocale}${pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
