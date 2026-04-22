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
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  function copyLink() {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    })
  }

  function copyCode() {
    navigator.clipboard.writeText(inviteCode).then(() => {
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
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
          className="ml-auto text-xs px-3 py-1.5 rounded-lg border border-surface-border hover:border-fifa-gold hover:text-fifa-gold transition-colors text-slate-400"
        >
          {copiedLink ? t('copied') : t('copy_link')}
        </button>
        <button
          onClick={copyCode}
          className="text-xs px-3 py-1.5 rounded-lg border border-surface-border hover:border-fifa-gold hover:text-fifa-gold transition-colors text-slate-400"
        >
          {copiedCode ? t('copied') : t('copy_code')}
        </button>
      </div>
      <p className="text-xs text-slate-600 mt-2 truncate">{inviteUrl}</p>
    </div>
  )
}
