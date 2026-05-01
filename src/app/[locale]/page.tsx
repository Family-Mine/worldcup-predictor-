// src/app/[locale]/page.tsx
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Link from 'next/link'
import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { UnlockButton } from '@/components/ui/UnlockButton'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { hasActiveSubscription, hasGroupBundle } from '@/lib/subscription'

const WORLD_CUP_KICKOFF = '2026-06-11T18:00:00Z'

export const dynamic = 'force-dynamic'

export default async function LandingPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'landing' })
  const tNav = await getTranslations({ locale, namespace: 'nav' })
  const prefix = `/${locale}`

  const supabase = getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [hasBundle, hasSub] = user
    ? await Promise.all([
        hasGroupBundle(supabase, user.id),
        hasActiveSubscription(supabase, user.id),
      ])
    : [false, false]
  const hasBasicOnly = hasSub && !hasBundle

  const features = [
    { emoji: '🤖', title: t('feature_ai_title'), desc: t('feature_ai_desc') },
    { emoji: '🏆', title: t('feature_pools_title'), desc: t('feature_pools_desc') },
    { emoji: '📊', title: t('feature_stats_title'), desc: t('feature_stats_desc') },
    { emoji: '⚡', title: t('feature_live_title'), desc: t('feature_live_desc') },
  ]

  const howSteps = [
    hasSub
      ? { emoji: '✅', title: t('how_step_1_paid_title'), desc: t('how_step_1_paid_desc') }
      : { emoji: '🔓', title: t('how_step_1_title'), desc: t('how_step_1_desc') },
    { emoji: '👥', title: t('how_step_2_title'), desc: t('how_step_2_desc') },
    { emoji: '📈', title: t('how_step_3_title'), desc: t('how_step_3_desc') },
  ]

  const basicBullets = [
    t('tier_basic_bullet_1'),
    t('tier_basic_bullet_2'),
    t('tier_basic_bullet_3'),
  ]

  const bundleBullets = [
    t('tier_bundle_bullet_1'),
    t('tier_bundle_bullet_2'),
    t('tier_bundle_bullet_3'),
    t('tier_bundle_bullet_4'),
    t('tier_bundle_bullet_5'),
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
          {hasBundle ? (
            <Link
              href={`${prefix}/predictions/group-phase`}
              className="px-8 py-4 bg-fifa-green text-white rounded-xl font-bold hover:bg-green-500 transition-colors text-center"
            >
              {t('cta_view_predictions')}
            </Link>
          ) : (
            <a
              href="#pricing"
              className="px-8 py-4 bg-fifa-green text-white rounded-xl font-bold hover:bg-green-500 transition-colors text-center"
            >
              {t('cta_see_plans')}
            </a>
          )}
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
            <div key={title} className="relative overflow-hidden bg-surface-card border border-surface-border rounded-xl p-5">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-fifa-gold to-yellow-700" />
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

      {/* Pricing — hidden once user has Bundle */}
      {!hasBundle && (
      <section id="pricing" className="scroll-mt-24 max-w-5xl mx-auto px-4 py-16 border-t border-surface-border">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">{t('pricing_title')}</h2>
          <p className="text-slate-400 text-base">{t('pricing_desc')}</p>
        </div>

        <div className={hasBasicOnly ? 'max-w-md mx-auto' : 'grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 items-stretch'}>
          {/* Basic — $4.99 (hidden if user already has Basic) */}
          {!hasBasicOnly && (
          <div className="bg-surface-card border border-surface-border rounded-2xl p-7 flex flex-col">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
                {t('tier_basic_label')}
              </p>
              <h3 className="text-2xl font-black text-white mb-2">{t('tier_basic_title')}</h3>
              <p className="text-slate-400 text-sm">{t('tier_basic_desc')}</p>
            </div>

            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-5xl font-black text-white">$4.99</span>
              <span className="text-slate-500 text-sm">{t('pricing_one_time')}</span>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {basicBullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-slate-500 font-bold mt-0.5">·</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            <UnlockButton
              label={t('tier_basic_cta')}
              locale={locale}
              product="predictions"
              variant="secondary"
              className="w-full px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-60 bg-surface border border-surface-border text-white hover:border-slate-400"
            />
          </div>
          )}

          {/* Bundle — $9.99 (highlighted as best value) */}
          <div className="relative bg-gradient-to-br from-fifa-gold/10 via-surface-card to-surface-card border-2 border-fifa-gold rounded-2xl p-7 flex flex-col shadow-[0_0_40px_rgba(234,179,8,0.15)]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-fifa-gold text-black rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap">
              {t('tier_bundle_badge')}
            </div>

            <div className="mb-6 mt-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-fifa-gold mb-3">
                {t('tier_bundle_label')}
              </p>
              <h3 className="text-2xl font-black text-white mb-2">{t('tier_bundle_title')}</h3>
              <p className="text-slate-300 text-sm">{t('tier_bundle_desc')}</p>
            </div>

            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-5xl font-black text-fifa-gold">$9.99</span>
              <span className="text-slate-400 text-sm">{t('pricing_one_time')}</span>
              <span className="ml-auto text-xs text-fifa-gold font-bold">
                {t('tier_bundle_save')}
              </span>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {bundleBullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2 text-sm text-white">
                  <span className="text-fifa-gold font-bold mt-0.5">✓</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            <UnlockButton
              label={t('tier_bundle_cta')}
              locale={locale}
              product="group_bundle"
              className="w-full px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-60 bg-fifa-green text-white hover:bg-green-500"
            />
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">{t('pricing_valid')}</p>
      </section>
      )}

      {/* Pools teaser */}
      <section className="max-w-4xl mx-auto px-4 py-16 border-t border-surface-border">
        <div className="relative overflow-hidden bg-surface-card border border-surface-border rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-fifa-gold to-yellow-700" />
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
