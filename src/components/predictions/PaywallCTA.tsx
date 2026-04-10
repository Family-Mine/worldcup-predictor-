// src/components/predictions/PaywallCTA.tsx
'use client'

import { useTranslations } from 'next-intl'

export function PaywallCTA() {
  const t = useTranslations('paywall')

  return (
    <div className="bg-gradient-to-br from-surface-card to-surface border border-fifa-gold/30 rounded-2xl p-8 text-center">
      <div className="text-5xl mb-4">🔒</div>
      <h2 className="text-2xl font-black text-white mb-2">{t('title')}</h2>
      <p className="text-slate-400 mb-6 max-w-md mx-auto">{t('description')}</p>
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <span className="text-3xl font-black text-fifa-gold">{t('price')}</span>
        <button className="px-8 py-3 bg-fifa-green text-white rounded-xl font-bold hover:bg-green-500 transition-colors text-lg">
          {t('cta')}
        </button>
      </div>
      <p className="text-xs text-slate-500 mt-4">One-time purchase · Valid through July 19, 2026</p>
    </div>
  )
}
