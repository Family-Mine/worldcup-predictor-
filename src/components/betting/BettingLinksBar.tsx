// src/components/betting/BettingLinksBar.tsx
// IMPORTANT: Replace the `href` values below with your actual affiliate tracking links
// once you sign up for each sportsbook's affiliate program:
//   DraftKings  → https://affiliates.draftkings.com
//   FanDuel     → https://affiliates.fanduel.com
//   BetMGM      → https://affiliates.betmgm.com
//   Caesars     → https://affiliates.caesars.com
//   ESPN BET    → https://espnbet.com/affiliates

export interface BettingLinksBarProps {
  matchLabel?: string // e.g. "Argentina vs Morocco" — used for context text
  compact?: boolean   // smaller version for group-phase list
}

const BOOKS = [
  {
    name: 'DraftKings',
    shortName: 'DK',
    tagline: 'Bet $5, Get $200',
    accent: 'bg-green-500/10 border-green-500/30 text-green-400',
    dot: 'bg-green-400',
    // TODO: replace with your affiliate link
    href: 'https://sportsbook.draftkings.com',
  },
  {
    name: 'FanDuel',
    shortName: 'FD',
    tagline: 'No Sweat First Bet',
    accent: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    dot: 'bg-blue-400',
    // TODO: replace with your affiliate link
    href: 'https://sportsbook.fanduel.com',
  },
  {
    name: 'BetMGM',
    shortName: 'MGM',
    tagline: 'First Bet Offer $1,500',
    accent: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    dot: 'bg-amber-400',
    // TODO: replace with your affiliate link
    href: 'https://sports.betmgm.com',
  },
  {
    name: 'Caesars',
    shortName: 'CZR',
    tagline: 'Your First Bet on Caesars',
    accent: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    dot: 'bg-cyan-400',
    // TODO: replace with your affiliate link
    href: 'https://sportsbook.caesars.com',
  },
  {
    name: 'ESPN BET',
    shortName: 'ESPN',
    tagline: 'Bet $10, Get $150',
    accent: 'bg-red-500/10 border-red-500/30 text-red-400',
    dot: 'bg-red-400',
    // TODO: replace with your affiliate link
    href: 'https://espnbet.com',
  },
] as const

export function BettingLinksBar({ matchLabel, compact = false }: BettingLinksBarProps) {
  if (compact) {
    return (
      <div className="border-t border-surface-border pt-4 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            Bet this match
          </span>
          <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded font-bold">
            AD
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {BOOKS.map((book) => (
            <a
              key={book.name}
              href={book.href}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className={`inline-flex items-center gap-1.5 border rounded-lg px-3 py-1.5 text-xs font-bold transition-opacity hover:opacity-80 ${book.accent}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${book.dot}`} />
              {book.shortName}
            </a>
          ))}
        </div>
        <p className="text-[10px] text-slate-600 mt-2">
          21+ only. Gambling problem? Call 1-800-GAMBLER. Check state availability.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-300">
            {matchLabel ? `Bet on ${matchLabel}` : 'Place Your Bets'}
          </h3>
          <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded font-bold">
            AD
          </span>
        </div>
        <span className="text-xs text-slate-600">Exclusive offers</span>
      </div>

      {/* Books grid */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {BOOKS.map((book) => (
          <a
            key={book.name}
            href={book.href}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className={`flex flex-col gap-1 border rounded-xl p-3 transition-opacity hover:opacity-80 ${book.accent}`}
          >
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${book.dot}`} />
              <span className="font-black text-sm">{book.name}</span>
            </div>
            <span className="text-[11px] text-slate-400 leading-tight">{book.tagline}</span>
            <span className="text-[11px] font-semibold mt-auto pt-1">Bet Now →</span>
          </a>
        ))}
      </div>

      {/* Responsible gambling disclaimer */}
      <p className="text-[11px] text-slate-600 mt-3 leading-relaxed">
        21+ and present in a state where sports betting is legal. Gambling problem?
        Call <span className="text-slate-500 font-medium">1-800-GAMBLER</span> (1-800-426-2537).
        Offers vary by state. Must opt in. T&amp;Cs apply.
      </p>
    </div>
  )
}
