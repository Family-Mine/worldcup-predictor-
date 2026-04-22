// src/components/betting/BettingLinksBar.tsx
// TODO: Replace href values with your actual affiliate tracking links after registering:
//   Rushbet    → https://rushbet-app.com.co/programa-de-afiliados/
//   Wplay      → https://afiliadosw.co
//   Codere     → https://codere-partners.com/es/register/
//   Bet365     → https://www.bet365partners.com/en
//   Betsson    → https://www.betssongroupaffiliates.com/
//   DraftKings → https://affiliates.draftkings.com
//   FanDuel    → https://affiliates.fanduel.com
//   BetMGM     → https://affiliates.betmgm.com
//   Caesars    → https://affiliates.caesars.com
//   ESPN BET   → https://espnbet.com/affiliates

export interface BettingLinksBarProps {
  matchLabel?: string
  compact?: boolean
  locale?: string
}

const BOOKS_LATAM = [
  {
    name: 'Rushbet',
    shortName: 'RB',
    tagline: 'Bono de bienvenida',
    accent: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    dot: 'bg-orange-400',
    href: 'https://rushbet.co', // TODO: reemplazar con link de afiliado
  },
  {
    name: 'Wplay',
    shortName: 'WP',
    tagline: 'Apuestas en vivo',
    accent: 'bg-green-500/10 border-green-500/30 text-green-400',
    dot: 'bg-green-400',
    href: 'https://wplay.co', // TODO: reemplazar con link de afiliado
  },
  {
    name: 'Codere',
    shortName: 'CD',
    tagline: 'Hasta $200.000 de bono',
    accent: 'bg-red-500/10 border-red-500/30 text-red-400',
    dot: 'bg-red-400',
    href: 'https://www.codere.co', // TODO: reemplazar con link de afiliado
  },
  {
    name: 'Bet365',
    shortName: 'B365',
    tagline: 'Cuotas en vivo',
    accent: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    dot: 'bg-emerald-400',
    href: 'https://www.bet365.com', // TODO: reemplazar con link de afiliado
  },
  {
    name: 'Betsson',
    shortName: 'BSN',
    tagline: 'Bono primer depósito',
    accent: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    dot: 'bg-yellow-400',
    href: 'https://www.betsson.com', // TODO: reemplazar con link de afiliado
  },
] as const

const BOOKS_EN = [
  {
    name: 'DraftKings',
    shortName: 'DK',
    tagline: 'Bet $5, Get $200',
    accent: 'bg-green-500/10 border-green-500/30 text-green-400',
    dot: 'bg-green-400',
    href: 'https://sportsbook.draftkings.com', // TODO: replace with affiliate link
  },
  {
    name: 'FanDuel',
    shortName: 'FD',
    tagline: 'No Sweat First Bet',
    accent: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    dot: 'bg-blue-400',
    href: 'https://sportsbook.fanduel.com', // TODO: replace with affiliate link
  },
  {
    name: 'BetMGM',
    shortName: 'MGM',
    tagline: 'First Bet Offer $1,500',
    accent: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    dot: 'bg-amber-400',
    href: 'https://sports.betmgm.com', // TODO: replace with affiliate link
  },
  {
    name: 'Caesars',
    shortName: 'CZR',
    tagline: 'Your First Bet on Caesars',
    accent: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    dot: 'bg-cyan-400',
    href: 'https://sportsbook.caesars.com', // TODO: replace with affiliate link
  },
  {
    name: 'ESPN BET',
    shortName: 'ESPN',
    tagline: 'Bet $10, Get $150',
    accent: 'bg-red-500/10 border-red-500/30 text-red-400',
    dot: 'bg-red-400',
    href: 'https://espnbet.com', // TODO: replace with affiliate link
  },
] as const

export function BettingLinksBar({ matchLabel, compact = false, locale = 'en' }: BettingLinksBarProps) {
  const isEs = locale === 'es'
  const books = isEs ? BOOKS_LATAM : BOOKS_EN
  const adLabel = isEs ? 'Apuesta este partido' : 'Bet this match'
  const ctaLabel = isEs ? 'Apostar →' : 'Bet Now →'
  const headerLabel = isEs
    ? (matchLabel ? `Apuesta en ${matchLabel}` : 'Haz tu apuesta')
    : (matchLabel ? `Bet on ${matchLabel}` : 'Place Your Bets')
  const disclaimer = isEs
    ? 'Apuesta con responsabilidad. Solo para mayores de edad. Verifica la legalidad en tu país.'
    : '21+ and present in a state where sports betting is legal. Gambling problem? Call 1-800-GAMBLER (1-800-426-2537). T&Cs apply.'

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
            <span className="text-[11px] font-semibold mt-auto pt-1">{ctaLabel}</span>
          </a>
        ))}
      </div>

      <p className="text-[11px] text-slate-600 mt-3 leading-relaxed">{disclaimer}</p>
    </div>
  )
}
