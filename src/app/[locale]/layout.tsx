// src/app/[locale]/layout.tsx
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { Space_Grotesk } from 'next/font/google'
import '../globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400', '600', '700'] })

export const metadata: Metadata = {
  title: {
    default: 'WC26 Predictor — AI Match Predictions',
    template: '%s · WC26 Predictor',
  },
  description: 'AI-powered score predictions for every 2026 FIFA World Cup match. Win probabilities, exact score forecasts backed by 2 years of stats.',
  openGraph: {
    title: 'WC26 Predictor',
    description: 'AI-powered match predictions for the 2026 FIFA World Cup',
    type: 'website',
  },
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  setRequestLocale(locale)
  const messages = await getMessages({ locale })

  // Get current user for navbar
  const { createServerClient } = await import('@supabase/ssr')
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang={locale} className="dark">
      <body className={`${spaceGrotesk.className} bg-surface text-slate-100 min-h-screen`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Navbar user={user} />
          <main>{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
