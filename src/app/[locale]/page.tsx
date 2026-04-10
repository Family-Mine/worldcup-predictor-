// src/app/[locale]/page.tsx
import { useTranslations } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import Link from 'next/link'
import { CountdownTimer } from '@/components/ui/CountdownTimer'

const WORLD_CUP_KICKOFF = '2026-06-11T18:00:00Z'

export default function LandingPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale)
  const t = useTranslations('landing')
  const tNav = useTranslations('nav')
  const prefix = `/${locale}`

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-surface-card border border-surface-border rounded-full px-4 py-1.5 text-sm text-slate-400 mb-8">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          2026 FIFA World Cup · USA / Canada / Mexico
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
          {t('hero_title')}
        </h1>

        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12">
          {t('hero_subtitle')}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            href={`${prefix}/groups`}
            className="px-8 py-4 bg-surface-card border border-surface-border rounded-xl text-white font-semibold hover:border-slate-500 transition-colors"
          >
            {t('cta_explore')}
          </Link>
          <button className="px-8 py-4 bg-fifa-green text-white rounded-xl font-bold hover:bg-green-500 transition-colors">
            {t('cta_unlock')}
          </button>
        </div>

        {/* Countdown */}
        <div>
          <p className="text-slate-500 text-sm uppercase tracking-widest mb-4">
            {t('countdown_label')}
          </p>
          <CountdownTimer
            targetDate={WORLD_CUP_KICKOFF}
            labels={{
              days: t('days'),
              hours: t('hours'),
              minutes: t('minutes'),
              seconds: t('seconds'),
            }}
          />
        </div>
      </section>

      {/* Groups preview teaser */}
      <section className="max-w-7xl mx-auto px-4 py-16 border-t border-surface-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-white">{tNav('groups')}</h2>
        </div>
        <p className="text-slate-400 mb-6">48 teams · 12 groups · 104 matches</p>
        <Link
          href={`${prefix}/groups`}
          className="inline-flex items-center gap-2 text-fifa-gold hover:underline font-medium"
        >
          View all groups →
        </Link>
      </section>
    </div>
  )
}
