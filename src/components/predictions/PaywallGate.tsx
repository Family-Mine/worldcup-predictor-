'use client'
// src/components/predictions/PaywallGate.tsx
import { useState } from 'react'
import { useParams } from 'next/navigation'

interface PaywallGateProps {
  isLoggedIn: boolean
}

export function PaywallGate({ isLoggedIn }: PaywallGateProps) {
  const params = useParams()
  const locale = (params.locale as string) || 'en'
  const prefix = `/${locale}`
  const [loading, setLoading] = useState(false)

  async function handleUnlock() {
    if (!isLoggedIn) {
      window.location.href = `${prefix}/login`
      return
    }

    setLoading(true)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnUrl: window.location.href }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface-card border border-fifa-gold/30 rounded-xl p-8 text-center">
      <div className="text-4xl mb-3">🔒</div>
      <h3 className="text-xl font-bold text-white mb-2">Unlock All Predictions</h3>
      <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
        Get win probabilities, predicted scores, and AI analysis for all 104 World Cup matches.
      </p>

      <div className="flex items-baseline justify-center gap-1 mb-6">
        <span className="text-4xl font-black text-fifa-gold">$4.99</span>
        <span className="text-slate-400 text-sm">one-time</span>
      </div>

      <button
        onClick={handleUnlock}
        disabled={loading}
        className="w-full max-w-xs bg-fifa-gold text-black font-bold py-3 rounded-xl hover:bg-yellow-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? 'Redirecting…' : isLoggedIn ? 'Unlock Now — $4.99' : 'Sign in to Unlock'}
      </button>

      <p className="text-xs text-slate-500 mt-3">
        One purchase · All 104 matches · Valid through August 2026
      </p>
    </div>
  )
}
