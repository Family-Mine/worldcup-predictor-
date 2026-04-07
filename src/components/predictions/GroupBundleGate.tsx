'use client'
// src/components/predictions/GroupBundleGate.tsx
import { useState } from 'react'
import { useParams } from 'next/navigation'

interface GroupBundleGateProps {
  isLoggedIn: boolean
  hasBaseSub: boolean
}

export function GroupBundleGate({ isLoggedIn, hasBaseSub }: GroupBundleGateProps) {
  const params = useParams()
  const locale = (params.locale as string) || 'en'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePurchase() {
    if (!isLoggedIn) {
      window.location.href = `/${locale}/login`
      return
    }

    setLoading(true)
    setError(null)

    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product: 'group_bundle',
        returnUrl: window.location.href,
      }),
    })

    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      setError(data.error ?? 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  // User not logged in
  if (!isLoggedIn) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-xl p-8 text-center">
        <div className="text-4xl mb-3">🔐</div>
        <h3 className="text-xl font-bold text-white mb-2">Sign in to unlock the Group Bundle</h3>
        <p className="text-slate-400 text-sm mb-6">Create a free account and unlock all 2026 World Cup predictions.</p>
        <a
          href={`/${locale}/login`}
          className="inline-block px-8 py-3 bg-fifa-gold text-black font-bold rounded-xl hover:bg-yellow-400 transition-colors"
        >
          Sign in
        </a>
      </div>
    )
  }

  // Has base subscription — offer the bundle
  return (
    <div className="bg-surface-card border border-fifa-gold/40 rounded-xl p-8 text-center">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 bg-fifa-gold/10 border border-fifa-gold/30 rounded-full px-4 py-1.5 text-xs font-semibold text-fifa-gold uppercase tracking-widest mb-6">
        Add-on · One-time purchase
      </div>

      <h3 className="text-2xl font-black text-white mb-3">Group Phase Bundle</h3>
      <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
        Everything in one purchase — all 104 individual match predictions plus the full group phase
        view with win probabilities, predicted scores, and AI analysis.
      </p>

      {/* Feature list */}
      <ul className="text-left max-w-xs mx-auto mb-8 space-y-2">
        {[
          'All 104 match predictions unlocked',
          'All group stage matches in one view',
          'Win probability bars per match',
          'Predicted scores with confidence level',
          'Grouped by A–L for easy navigation',
        ].map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
            <span className="text-fifa-gold">✓</span> {f}
          </li>
        ))}
      </ul>

      <div className="flex items-baseline justify-center gap-1 mb-6">
        <span className="text-5xl font-black text-fifa-gold">$9.99</span>
        <span className="text-slate-400 text-sm">one-time</span>
      </div>

      {error && (
        <p className="text-red-400 text-sm mb-4">{error}</p>
      )}

      <button
        onClick={handlePurchase}
        disabled={loading}
        className="w-full max-w-xs bg-fifa-gold text-black font-bold py-3 rounded-xl hover:bg-yellow-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? 'Redirecting to checkout…' : 'Unlock Group Bundle — $9.99'}
      </button>

      <p className="text-xs text-slate-500 mt-3">
        One-time · Instant access · Valid through August 2026
      </p>
    </div>
  )
}
