// src/app/[locale]/layout.tsx
// Wraps children with the intl provider plus Navbar/Footer. The
// <html>/<body> shell lives in the root layout (src/app/layout.tsx).
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { getSupabaseServerClient } from '@/lib/supabase/server'

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

  // Middleware refreshes the session cookies — getUser() here just reads them.
  const supabase = getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Navbar user={user} />
      <main>{children}</main>
      <Footer />
    </NextIntlClientProvider>
  )
}
