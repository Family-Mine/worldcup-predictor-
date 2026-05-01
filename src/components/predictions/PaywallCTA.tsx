// src/components/predictions/PaywallCTA.tsx
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'

export function PaywallCTA() {
  const t = useTranslations('paywall')
  const [loading, setLoading] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const locale = pathname.split('/')[1] ?? 'es'

  async function handleUnlock() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: 'predictions',
          returnUrl: `${window.location.origin}/${locale}/payment-success`,
        }),
      })
      if (res.status === 401) {
        router.push(`/${locale}/login`)
        return
      }
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-surface-card to-surface border border-fifa-gold/30 rounded-2xl p-8 text-center">
      <div className="text-5xl mb-4">🔒</div>
      <h2 className="text-2xl font-black text-white mb-2">{t('title')}</h2>
      <p className="text-slate-400 mb-6 max-w-md mx-auto">{t('description')}</p>
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <span className="text-3xl font-black text-fifa-gold">{t('price')}</span>
        <button
          onClick={handleUnlock}
          disabled={loading}
          className="px-8 py-3 bg-fifa-green text-white rounded-xl font-bold hover:bg-green-500 transition-colors text-lg disabled:opacity-60"
        >
          {loading ? '...' : t('cta')}
        </button>
      </div>
      <p className="text-xs text-slate-500 mt-4">One-time purchase · Valid through July 19, 2026</p>
    </div>
  )
}
