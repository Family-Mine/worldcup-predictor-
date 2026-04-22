// src/app/[locale]/page.tsx
import { useTranslations } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import Link from 'next/link'
import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { UnlockButton } from '@/components/ui/UnlockButton'

const WORLD_CUP_KICKOFF = '2026-06-11T18:00:00Z'

export default function LandingPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale)
  const t = useTranslations('landing')
  const tNav = useTranslations('nav')
  const prefix = `/${locale}`

  const features = [
    { emoji: '🤖', title: t('feature_ai_title'), desc: t('feature_ai_desc') },
    { emoji: '🏆', title: t('feature_pools_title'), desc: t('feature_pools_desc') },
    { emoji: '📊', title: t('feature_stats_title'), desc: t('feature_stats_desc') },
    { emoji: '⚡', title: t('feature_live_title'), desc: t('feature_live_desc') },
  ]

  const howSteps = [
    { emoji: '🔓', title: t('how_step_1_title'), desc: t('how_step_1_desc') },
    { emoji: '👥', title: t('how_step_2_title'), desc: t('how_step_2_desc') },
    { emoji: '📈', title: t('how_step_3_title'), desc: t('how_step_3_desc') },
  ]

  const pricingBullets = [
    t('pricing_bullet_1'),
    t('pricing_bullet_2'),
    t('pricing_bullet_3'),
  ]

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-surface-card border border-surface-border rounded-full px-4 py-1.5 text-sm text-slate-400 mb-8">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          2026 FIFA World Cup · USA / Canada / Mexico
        </div>

        <div className="w-12 h-0.5 bg-fifa-gold mx-auto mb-6" />
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
          <UnlockButton label={t('cta_unlock')} locale={locale} />
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

      {/* Features */}
      <section className="max-w-4xl mx-auto px-4 py-16 border-t border-surface-border">
        <h2 className="text-2xl font-black text-white text-center mb-10">{t('features_title')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(({ emoji, title, desc }) => (
            <div key={title} className="bg-surface-card border border-surface-border rounded-xl p-5">
              <div className="text-3xl mb-3">{emoji}</div>
              <h3 className="text-white font-bold mb-1">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 py-16 border-t border-surface-border">
        <h2 className="text-2xl font-black text-white text-center mb-10">{t('how_title')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {howSteps.map(({ emoji, title, desc }, i) => (
            <div key={title} className="text-center">
              <div className="w-12 h-12 rounded-full bg-fifa-gold/10 border border-fifa-gold/30 text-fifa-gold font-black text-lg flex items-center justify-center mx-auto mb-4">
                {i + 1}
              </div>
              <div className="text-2xl mb-2">{emoji}</div>
              <h3 className="text-white font-bold mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-md mx-auto px-4 py-16 border-t border-surface-border text-center">
        <h2 className="text-2xl font-black text-white mb-2">{t('pricing_title')}</h2>
        <p className="text-slate-400 text-sm mb-8">{t('pricing_desc')}</p>
        <div className="bg-surface-card border border-fifa-gold/30 rounded-2xl p-8">
          <div className="text-5xl font-black text-fifa-gold mb-1">$4.99</div>
          <p className="text-slate-500 text-sm mb-6">{t('pricing_one_time')}</p>
          <ul className="text-left space-y-3 mb-8">
            {pricingBullets.map((bullet) => (
              <li key={bullet} className="flex items-center gap-2 text-sm text-slate-300">
                <span className="text-fifa-green font-bold">✓</span>
                {bullet}
              </li>
            ))}
          </ul>
          <UnlockButton label={t('cta_unlock')} locale={locale} />
          <p className="text-xs text-slate-600 mt-4">{t('pricing_valid')}</p>
        </div>
      </section>

      {/* Pools teaser */}
      <section className="max-w-4xl mx-auto px-4 py-16 border-t border-surface-border">
        <div className="bg-surface-card border border-surface-border rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="text-5xl">🏆</div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-black text-white mb-2">{t('pools_teaser_title')}</h2>
            <p className="text-slate-400 text-sm">{t('pools_teaser_desc')}</p>
          </div>
          <Link
            href={`${prefix}/pools`}
            className="flex-shrink-0 px-6 py-3 bg-fifa-green text-white rounded-xl font-bold hover:bg-green-500 transition-colors text-sm"
          >
            {t('pools_teaser_cta')}
          </Link>
        </div>
      </section>

      {/* Groups teaser */}
      <section className="max-w-4xl mx-auto px-4 py-16 border-t border-surface-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-white">{tNav('groups')}</h2>
        </div>
        <p className="text-slate-400 mb-6">48 {t('teams_count')} · 12 {t('groups_count')} · 104 {t('matches_count')}</p>
        <Link
          href={`${prefix}/groups`}
          className="inline-flex items-center gap-2 text-fifa-gold hover:underline font-medium"
        >
          {t('view_all_groups')} →
        </Link>
      </section>
    </div>
  )
}
