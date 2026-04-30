'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function PaymentPending() {
  const router = useRouter()
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    if (attempts >= 10) return
    const t = setTimeout(() => {
      router.refresh()
      setAttempts(a => a + 1)
    }, 3000)
    return () => clearTimeout(t)
  }, [attempts, router])

  if (attempts >= 10) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-xl p-8 text-center">
        <p className="text-white font-bold mb-2">Payment received</p>
        <p className="text-slate-400 text-sm mb-4">
          Taking longer than expected. Please refresh the page manually or contact support.
        </p>
        <button
          onClick={() => router.refresh()}
          className="px-6 py-2 bg-fifa-green text-white rounded-xl font-bold hover:bg-green-500 transition-colors"
        >
          Refresh
        </button>
      </div>
    )
  }

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-8 text-center">
      <div className="text-5xl mb-4 animate-spin">⚽</div>
      <p className="text-white font-bold mb-2">Processing your payment…</p>
      <p className="text-slate-400 text-sm">This will only take a moment.</p>
    </div>
  )
}
