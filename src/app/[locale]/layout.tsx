// src/app/[locale]/layout.tsx
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { Inter } from 'next/font/google'
import '../globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

const inter = Inter({ subsets: ['latin'] })

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
  const messages = await getMessages()

  return (
    <html lang={locale} className="dark">
      <body className={`${inter.className} bg-surface text-slate-100 min-h-screen`}>
        <NextIntlClientProvider messages={messages}>
            <Navbar />
            <main>{children}</main>
            <Footer />
          </NextIntlClientProvider>
      </body>
    </html>
  )
}
