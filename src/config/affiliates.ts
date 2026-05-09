// src/config/affiliates.ts
// Centralized affiliate partner configuration. Replace each `affiliateId`
// placeholder once the partner program approval lands — components import
// from here so swapping IDs never requires touching UI code.

export type AffiliateCategory = 'sportsbook-latam' | 'sportsbook-us'

export interface AffiliatePartner {
  name: string
  shortName: string
  tagline: string
  affiliateId: string
  baseUrl: string
  logo?: string
  category: AffiliateCategory
  accent: string
  dot: string
  signupUrl?: string
}

export const AFFILIATE_UTM = {
  utm_source: 'worldcup-predictor',
  utm_medium: 'app',
  utm_campaign: 'wc2026',
} as const

export const AFFILIATE_PARTNERS: AffiliatePartner[] = [
  {
    name: 'Rushbet',
    shortName: 'RB',
    tagline: 'Bono de bienvenida',
    affiliateId: 'AFFILIATE_ID',
    baseUrl: 'https://rushbet.co',
    category: 'sportsbook-latam',
    accent: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    dot: 'bg-orange-400',
    signupUrl: 'https://rushbet-app.com.co/programa-de-afiliados/',
  },
  {
    name: 'Wplay',
    shortName: 'WP',
    tagline: 'Apuestas en vivo',
    affiliateId: 'AFFILIATE_ID',
    baseUrl: 'https://wplay.co',
    category: 'sportsbook-latam',
    accent: 'bg-green-500/10 border-green-500/30 text-green-400',
    dot: 'bg-green-400',
    signupUrl: 'https://afiliadosw.co',
  },
  {
    name: 'Codere',
    shortName: 'CD',
    tagline: 'Hasta $200.000 de bono',
    affiliateId: 'AFFILIATE_ID',
    baseUrl: 'https://www.codere.co',
    category: 'sportsbook-latam',
    accent: 'bg-red-500/10 border-red-500/30 text-red-400',
    dot: 'bg-red-400',
    signupUrl: 'https://codere-partners.com/es/register/',
  },
  {
    name: 'Bet365',
    shortName: 'B365',
    tagline: 'Cuotas en vivo',
    affiliateId: 'AFFILIATE_ID',
    baseUrl: 'https://www.bet365.com',
    category: 'sportsbook-latam',
    accent: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    dot: 'bg-emerald-400',
    signupUrl: 'https://www.bet365partners.com/en',
  },
  {
    name: 'Betsson',
    shortName: 'BSN',
    tagline: 'Bono primer depósito',
    affiliateId: 'AFFILIATE_ID',
    baseUrl: 'https://www.betsson.com',
    category: 'sportsbook-latam',
    accent: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    dot: 'bg-yellow-400',
    signupUrl: 'https://www.betssongroupaffiliates.com/',
  },
  {
    name: 'DraftKings',
    shortName: 'DK',
    tagline: 'Bet $5, Get $200',
    affiliateId: 'AFFILIATE_ID',
    baseUrl: 'https://sportsbook.draftkings.com',
    category: 'sportsbook-us',
    accent: 'bg-green-500/10 border-green-500/30 text-green-400',
    dot: 'bg-green-400',
    signupUrl: 'https://affiliates.draftkings.com',
  },
  {
    name: 'FanDuel',
    shortName: 'FD',
    tagline: 'No Sweat First Bet',
    affiliateId: 'AFFILIATE_ID',
    baseUrl: 'https://sportsbook.fanduel.com',
    category: 'sportsbook-us',
    accent: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    dot: 'bg-blue-400',
    signupUrl: 'https://affiliates.fanduel.com',
  },
  {
    name: 'BetMGM',
    shortName: 'MGM',
    tagline: 'First Bet Offer $1,500',
    affiliateId: 'AFFILIATE_ID',
    baseUrl: 'https://sports.betmgm.com',
    category: 'sportsbook-us',
    accent: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    dot: 'bg-amber-400',
    signupUrl: 'https://affiliates.betmgm.com',
  },
  {
    name: 'Caesars',
    shortName: 'CZR',
    tagline: 'Your First Bet on Caesars',
    affiliateId: 'AFFILIATE_ID',
    baseUrl: 'https://sportsbook.caesars.com',
    category: 'sportsbook-us',
    accent: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    dot: 'bg-cyan-400',
    signupUrl: 'https://affiliates.caesars.com',
  },
  {
    name: 'ESPN BET',
    shortName: 'ESPN',
    tagline: 'Bet $10, Get $150',
    affiliateId: 'AFFILIATE_ID',
    baseUrl: 'https://espnbet.com',
    category: 'sportsbook-us',
    accent: 'bg-red-500/10 border-red-500/30 text-red-400',
    dot: 'bg-red-400',
    signupUrl: 'https://espnbet.com/affiliates',
  },
]

export function getAffiliatesByCategory(category: AffiliateCategory): AffiliatePartner[] {
  return AFFILIATE_PARTNERS.filter((p) => p.category === category)
}

export function buildAffiliateUrl(partner: AffiliatePartner): string {
  const url = new URL(partner.baseUrl)
  for (const [key, value] of Object.entries(AFFILIATE_UTM)) {
    url.searchParams.set(key, value)
  }
  url.searchParams.set('ref', partner.affiliateId)
  return url.toString()
}

export interface AffiliateClickEvent {
  partner: string
  affiliateId: string
  category: AffiliateCategory
  context?: string
  timestamp: number
}

export function trackAffiliateClick(
  partner: AffiliatePartner,
  context?: string,
): void {
  const event: AffiliateClickEvent = {
    partner: partner.name,
    affiliateId: partner.affiliateId,
    category: partner.category,
    context,
    timestamp: Date.now(),
  }
  // eslint-disable-next-line no-console
  console.log('[affiliate-click]', event)
}
