'use client'
// src/components/pools/InviteCodeBanner.tsx
import { useState } from 'react'
import { useTranslations } from 'next-intl'

interface InviteCodeBannerProps {
  inviteCode: string
  inviteUrl: string
}

export function InviteCodeBanner({ inviteCode, inviteUrl }: InviteCodeBannerProps) {
  const t = useTranslations('pools')
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    let ok = false
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteUrl)
        ok = true
      }
    } catch {
      // fall through to legacy path
    }
    if (!ok) {
      // Fallback for iOS Safari < 13.4 and non-secure contexts
      const ta = document.createElement('textarea')
      ta.value = inviteUrl
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try { ok = document.execCommand('copy') } catch { /* noop */ }
      document.body.removeChild(ta)
    }
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="bg-surface-card border border-fifa-gold/30 rounded-xl p-4">
      <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">{t('invite_code')}</p>
      <div className="flex items-center gap-3">
        <span className="text-2xl font-black text-fifa-gold tracking-widest font-mono">
          {inviteCode}
        </span>
        <button
          onClick={copyLink}
          className="ml-auto text-xs px-4 py-1.5 rounded-lg border border-surface-border hover:border-fifa-gold hover:text-fifa-gold transition-colors text-slate-400"
        >
          {copied ? t('copied') : t('share_link')}
        </button>
      </div>
      <p className="text-xs text-slate-600 mt-2 truncate">{inviteUrl}</p>
    </div>
  )
}
