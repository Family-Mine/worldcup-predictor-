// src/app/[locale]/pools/join/page.tsx
import Link from 'next/link'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { JoinPoolForm, JoinPoolFormManual } from '@/components/pools/JoinPoolForm'

interface Props {
  params: { locale: string }
  searchParams: { code?: string }
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = params
  const code = searchParams.code?.toUpperCase()

  if (!code) {
    return { title: 'Join a Pool — WC26 Predictor' }
  }

  const supabase = getSupabaseAdminClient()
  const { data: pool } = await supabase
    .from('pools')
    .select('name')
    .eq('invite_code', code)
    .single()

  const poolName = pool?.name ?? 'a pool'
  const title = locale === 'es'
    ? `Te invitan a la quinela "${poolName}" — WC26 Predictor`
    : `You're invited to join "${poolName}" — WC26 Predictor`
  const description = locale === 'es'
    ? `Predice los marcadores del Mundial 2026, compite con amigos y sigue la tabla de posiciones en tiempo real.`
    : `Predict scores for every 2026 World Cup match, compete with friends, and follow the live leaderboard.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://wc26predictor.com/${locale}/pools/join?code=${code}`,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export default async function JoinPoolPage({ params, searchParams }: Props) {
  const { locale } = params
  const code = searchParams.code?.toUpperCase() ?? ''
  const t = await getTranslations({ locale, namespace: 'pools' })

  let poolName: string | null = null
  if (code) {
    const supabase = getSupabaseAdminClient()
    const { data: pool } = await supabase
      .from('pools')
      .select('name')
      .eq('invite_code', code)
      .single()
    poolName = pool?.name ?? null
  }

  const steps = [
    t('invite_step_1'),
    t('invite_step_2'),
    t('invite_step_3'),
    t('invite_step_4'),
  ]

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Link href={`/${locale}`} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
        ← WC26 Predictor
      </Link>

      {/* Invite banner */}
      {poolName && (
        <div className="mt-8 bg-surface-card border border-fifa-gold/30 rounded-2xl p-6 mb-6">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">🏆 {t('invite_banner_label')}</p>
          <h1 className="text-2xl font-black text-white mb-1">
            {t('invite_banner_title', { pool: poolName })}
          </h1>
          <p className="text-slate-400 text-sm mb-6">{t('invite_banner_subtitle')}</p>

          {/* Steps */}
          <ul className="space-y-3 mb-6">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                <span className="w-6 h-6 rounded-full bg-fifa-gold/20 border border-fifa-gold/40 text-fifa-gold text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>

          {/* Scoring pills */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            <div className="text-center p-2 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-lg font-black text-green-400">3</p>
              <p className="text-xs text-slate-400">{t('exact_score')}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-lg font-black text-yellow-400">1</p>
              <p className="text-xs text-slate-400">{t('correct_winner')}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-lg font-black text-red-400">0</p>
              <p className="text-xs text-slate-400">{t('wrong_prediction')}</p>
            </div>
          </div>

          <JoinPoolForm locale={locale} code={code} />
        </div>
      )}

      {/* Manual code entry (no code in URL or invalid) */}
      {!poolName && (
        <div className="mt-8">
          <h1 className="text-3xl font-black text-white mb-2">{t('join_title')}</h1>
          <p className="text-slate-400 text-sm mb-8">{t('join_subtitle')}</p>
          <JoinPoolFormManual locale={locale} />
        </div>
      )}

      <p className="text-center text-sm text-slate-500 mt-6">
        {t('no_code')}{' '}
        <Link href={`/${locale}/pools/new`} className="text-fifa-gold hover:underline">
          {t('create_your_own')}
        </Link>
      </p>
    </div>
  )
}
