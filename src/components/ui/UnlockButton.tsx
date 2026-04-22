'use client'
// src/components/ui/UnlockButton.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface UnlockButtonProps {
  label: string
  locale: string
}

export function UnlockButton({ label, locale }: UnlockButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: 'predictions',
          returnUrl: `${window.location.origin}/${locale}`,
        }),
      })

      if (res.status === 401) {
        router.push(`/${locale}/login`)
        return
      }

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="px-8 py-4 bg-fifa-green text-white rounded-xl font-bold hover:bg-green-500 transition-colors disabled:opacity-60"
    >
      {loading ? '...' : label}
    </button>
  )
}
