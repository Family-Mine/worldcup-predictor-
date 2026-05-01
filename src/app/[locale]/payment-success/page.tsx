// src/app/[locale]/payment-success/page.tsx
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { hasActiveSubscription, hasGroupBundle } from '@/lib/subscription'
import { PaymentPending } from '@/components/predictions/PaymentPending'

export const dynamic = 'force-dynamic'

export default async function PaymentSuccessPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'paymentSuccess' })
  const supabase = getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/${locale}/login`)

  const [paid, hasBundle] = await Promise.all([
    hasActiveSubscription(supabase, user.id),
    hasGroupBundle(supabase, user.id),
  ])

  if (!paid && !hasBundle) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <PaymentPending />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-fifa-green/15 border-2 border-fifa-green mb-6">
          <svg
            className="w-10 h-10 text-fifa-green"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white mb-3">{t('title')}</h1>
        <p className="text-slate-400 text-base max-w-md mx-auto">
          {hasBundle ? t('subtitle_bundle') : t('subtitle_basic')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {hasBundle && (
          <Link
            href={`/${locale}/predictions/group-phase`}
            className="block bg-fifa-gold/5 border-2 border-fifa-gold rounded-xl p-5 hover:bg-fifa-gold/10 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-fifa-gold mb-1">
                  {t('cta_bundle_label')}
                </p>
                <h3 className="text-lg font-black text-white">{t('cta_bundle_title')}</h3>
                <p className="text-slate-400 text-sm mt-1">{t('cta_bundle_desc')}</p>
              </div>
              <span className="text-fifa-gold text-2xl">→</span>
            </div>
          </Link>
        )}

        <Link
          href={`/${locale}/groups`}
          className="block bg-surface-card border border-surface-border rounded-xl p-5 hover:border-slate-500 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                {t('cta_basic_label')}
              </p>
              <h3 className="text-lg font-bold text-white">{t('cta_basic_title')}</h3>
              <p className="text-slate-400 text-sm mt-1">{t('cta_basic_desc')}</p>
            </div>
            <span className="text-slate-400 text-2xl">→</span>
          </div>
        </Link>

        <Link
          href={`/${locale}/pools`}
          className="block bg-surface-card border border-surface-border rounded-xl p-5 hover:border-slate-500 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                {t('cta_pools_label')}
              </p>
              <h3 className="text-lg font-bold text-white">{t('cta_pools_title')}</h3>
              <p className="text-slate-400 text-sm mt-1">{t('cta_pools_desc')}</p>
            </div>
            <span className="text-slate-400 text-2xl">→</span>
          </div>
        </Link>
      </div>

      <p className="text-center text-xs text-slate-600 mt-8">{t('receipt_note')}</p>
    </div>
  )
}
