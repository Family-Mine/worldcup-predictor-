'use client'
// src/components/ui/UnlockButton.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Product = 'predictions' | 'group_bundle'

interface UnlockButtonProps {
  label: string
  locale: string
  product?: Product
  variant?: 'primary' | 'secondary'
  className?: string
}

export function UnlockButton({
  label,
  locale,
  product = 'predictions',
  variant = 'primary',
  className,
}: UnlockButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product,
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

  const baseStyles = 'rounded-xl font-bold transition-colors disabled:opacity-60'
  const variantStyles =
    variant === 'primary'
      ? 'bg-fifa-green text-white hover:bg-green-500'
      : 'bg-surface border border-surface-border text-white hover:border-slate-500'

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={className ?? `px-8 py-4 ${baseStyles} ${variantStyles}`}
    >
      {loading ? '...' : label}
    </button>
  )
}
