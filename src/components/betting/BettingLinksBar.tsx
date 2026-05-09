'use client'

// src/components/betting/BettingLinksBar.tsx
// Affiliate partner data lives in `src/config/affiliates.ts` — update IDs there.

import {
  buildAffiliateUrl,
  getAffiliatesByCategory,
  trackAffiliateClick,
  type AffiliatePartner,
} from '@/config/affiliates'

export interface BettingLinksBarProps {
  matchLabel?: string
  compact?: boolean
  locale?: string
}

export function BettingLinksBar({ matchLabel, compact = false, locale = 'en' }: BettingLinksBarProps) {
  const isEs = locale === 'es'
  const books = getAffiliatesByCategory(isEs ? 'sportsbook-latam' : 'sportsbook-us')
  const adLabel = isEs ? 'Apuesta este partido' : 'Bet this match'
  const ctaLabel = isEs ? 'Apostar →' : 'Bet Now →'
  const headerLabel = isEs
    ? (matchLabel ? `Apuesta en ${matchLabel}` : 'Haz tu apuesta')
    : (matchLabel ? `Bet on ${matchLabel}` : 'Place Your Bets')
  const disclaimer = isEs
    ? 'Apuesta con responsabilidad. Solo para mayores de edad. Verifica la legalidad en tu país.'
    : '21+ and present in a state where sports betting is legal. Gambling problem? Call 1-800-GAMBLER (1-800-426-2537). T&Cs apply.'

  const handleClick = (book: AffiliatePartner) => () => {
    trackAffiliateClick(book, matchLabel)
  }

  if (compact) {
    return (
      <div className="border-t border-surface-border pt-4 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            {adLabel}
          </span>
          <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded font-bold">
            AD
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {books.map((book) => (
            <a
              key={book.name}
              href={buildAffiliateUrl(book)}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={handleClick(book)}
              className={`inline-flex items-center gap-1.5 border rounded-lg px-3 py-1.5 text-xs font-bold transition-opacity hover:opacity-80 ${book.accent}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${book.dot}`} />
              {book.shortName}
            </a>
          ))}
        </div>
        <p className="text-[10px] text-slate-600 mt-2">{disclaimer}</p>
      </div>
    )
  }

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-300">{headerLabel}</h3>
          <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded font-bold">
            AD
          </span>
        </div>
        <span className="text-xs text-slate-600">{isEs ? 'Ofertas exclusivas' : 'Exclusive offers'}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {books.map((book) => (
          <a
            key={book.name}
            href={buildAffiliateUrl(book)}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={handleClick(book)}
            className={`flex flex-col gap-1 border rounded-xl p-3 transition-opacity hover:opacity-80 ${book.accent}`}
          >
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${book.dot}`} />
              <span className="font-black text-sm">{book.name}</span>
            </div>
            <span className="text-[11px] text-slate-400 leading-tight">{book.tagline}</span>
            <span className="text-[11px] font-semibold mt-auto pt-1">{ctaLabel}</span>
          </a>
        ))}
      </div>

      <p className="text-[11px] text-slate-600 mt-3 leading-relaxed">{disclaimer}</p>
    </div>
  )
}
