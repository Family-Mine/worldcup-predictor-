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

  function copyLink() {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
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
