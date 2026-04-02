# World Cup 2026 Predictor — Design Spec
**Date:** 2026-04-01  
**Author:** Lucas Jaramillo  
**Status:** Approved

---

## Overview

A commercial web application (web-first, mobile later) that provides AI-powered match predictions and score forecasts for the 2026 FIFA World Cup (USA/Canada/Mexico). Users can view group standings, team stats, and match schedules publicly. Advanced predictions — including win probabilities, exact score predictions, and AI-generated narratives — are locked behind a one-time $4.99 paywall. Users can also save their own quiniela (bracket predictions).

**Business model:** $4.99 one-time unlock per user. Marketed via Google Ads, YouTube, and Instagram during the tournament window (June 11 – July 19, 2026).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend + API routes | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Database + Auth | Supabase (PostgreSQL + Auth + Edge Functions + Storage) |
| Payments | Stripe ($4.99 one-time charge) |
| AI Narratives | Claude API (Anthropic) |
| Internationalization | next-intl (English + Spanish) |
| Deploy | Vercel (auto-deploy on push to main) |
| Repository | GitHub (monorepo) |

**Free tiers used:**
- Supabase free: 500MB DB, 2GB storage, 500K Edge Function invocations/month
- Vercel free: unlimited personal projects
- football-data.org free tier: World Cup fixtures and results
- API-Football free tier (RapidAPI): 100 req/day — historical stats
- TheSportsDB free: team profiles, player data
- SofaScore unofficial API: injuries, suspensions, player ratings
- NewsAPI.org free tier: 100 req/day news aggregation
- Claude API: ~$0.002/prediction, pay-per-use

---

## Architecture

```
GitHub (monorepo)
├── Next.js 14 App Router
│   ├── Public pages (groups, teams, matches preview)
│   ├── Premium pages (predictions, quiniela dashboard)
│   └── Admin monitor (pipeline status, flag news)
│
├── Supabase
│   ├── PostgreSQL — primary database
│   ├── Auth — user registration and login
│   ├── Edge Functions — prediction engine + data sync
│   └── Storage — team flag images
│
└── Vercel — CI/CD, edge deployment
```

**Data flow:**
1. Supabase Edge Function `sync-data` runs every 6 hours via cron
2. Pulls fixtures/results from football-data.org and TheSportsDB
3. Scrapes injury/suspension data from SofaScore unofficial API
4. Fetches news from NewsAPI.org RSS feeds (BBC Sport, ESPN, Goal.com, Marca)
5. Raw news text sent to Claude API → extracts team, type, impact weight
6. Structured data saved to `news_items`
7. Affected match predictions recalculated automatically
8. When user opens a prediction page: Edge Function `calculate-prediction` runs Poisson model + calls Claude for narrative (result cached in DB)

---

## Database Schema

```sql
-- 48 teams, 12 groups (A–L)
teams
  id uuid PK
  name text
  country_code text          -- ISO 3166-1 alpha-2 (e.g. "CO", "PT")
  group_letter char(1)       -- A through L
  fifa_ranking int
  flag_url text              -- Supabase Storage URL
  confederation text
  coach text
  current_form text          -- last 5: e.g. "WWDLW"

-- All matches: group stage + knockouts
matches
  id uuid PK
  home_team_id uuid FK → teams
  away_team_id uuid FK → teams
  group_letter char(1)       -- null for knockout stage
  scheduled_at timestamptz
  venue text
  status text                -- scheduled | live | finished
  home_score int
  away_score int
  stage text                 -- group | r16 | qf | sf | final

-- One prediction per match, auto-generated and cached
predictions
  id uuid PK
  match_id uuid FK → matches (unique)
  home_win_prob numeric       -- 0.00–1.00
  draw_prob numeric
  away_win_prob numeric
  predicted_home_score int
  predicted_away_score int
  predicted_winner text       -- home | draw | away
  confidence_level text       -- high | medium | low
  ai_narrative_en text        -- Claude-generated English narrative
  ai_narrative_es text        -- Claude-generated Spanish narrative
  updated_at timestamptz

-- Historical stats per team (last 2 years)
team_stats
  id uuid PK
  team_id uuid FK → teams
  period text                 -- "2024" | "2025"
  matches_played int
  wins int
  draws int
  losses int
  goals_for int
  goals_against int
  clean_sheets int
  avg_possession numeric
  big_chances_created int

-- Auto-ingested news and contextual factors
news_items
  id uuid PK
  team_id uuid FK → teams
  type text                   -- injury | suspension | form | tactical
  content_en text
  content_es text
  impact_weight numeric       -- -2.0 to +2.0 (computed by Claude)
  source_url text
  source_name text
  fetched_at timestamptz
  active boolean default true -- admin can deactivate if irrelevant

-- Stripe subscriptions
subscriptions
  id uuid PK
  user_id uuid FK → auth.users
  stripe_customer_id text
  stripe_payment_intent_id text
  status text                 -- active | cancelled | expired
  expires_at timestamptz      -- set to 2026-08-01 (post-tournament)

-- User quiniela picks
user_picks
  id uuid PK
  user_id uuid FK → auth.users
  match_id uuid FK → matches
  picked_home_score int
  picked_away_score int
  picked_winner text
  created_at timestamptz
```

---

## Pages Structure

### Public (no login required)
| Route | Description |
|---|---|
| `/` | Landing: countdown to June 11, group preview, CTA to unlock |
| `/groups` | Grid of all 12 groups (A–L) with flags and team names |
| `/groups/[letter]` | Group standings, match schedule, recent form per team |
| `/teams/[id]` | Team profile: flag, coach, FIFA ranking, 2-year stats, news |
| `/matches/[id]` | Match preview: head-to-head history, teaser + paywall CTA |

### Premium (requires $4.99 unlock)
| Route | Description |
|---|---|
| `/matches/[id]/prediction` | Full prediction: probabilities, predicted score, AI narrative, personal quiniela |
| `/dashboard` | User's saved picks, accuracy score as matches complete |

### Admin (role-protected)
| Route | Description |
|---|---|
| `/admin` | Pipeline monitor: last sync time, news ingested per team, flag irrelevant items |

---

## Prediction Engine

### Layer 1 — Bivariate Poisson Model
Standard approach for football score prediction. Calculates probability distribution over all possible scores (0-0 through 5-5+) for each match.

**Inputs per team:**
- Win/draw/loss rate last 2 years (recency-weighted: last 6 months count 2x)
- Goals scored and conceded per match
- Performance vs teams of similar FIFA ranking bracket
- Recent form score (W=3, D=1, L=0, last 5 matches)
- Clean sheet percentage
- International tournament performance (weighted higher than friendlies)

**Automatic adjustments from `news_items`:**
- Each active news item's `impact_weight` modifies the team's attack/defense parameter
- e.g., injury to starting striker → attack parameter -0.3

**Output:**
- `home_win_prob`, `draw_prob`, `away_win_prob`
- `predicted_home_score`, `predicted_away_score` (most probable score)
- `confidence_level`: high (top score prob > 20%), medium (12–20%), low (< 12%)

### Layer 2 — Claude API Narrative
Claude receives the statistical output + recent news context and generates a 3-sentence analytical explanation in both English and Spanish.

**Prompt structure:**
```
Team A stats summary + Team B stats summary
Recent news affecting each team
Predicted score: X–Y, winner: Z (confidence: high/medium/low)
Task: Write 3 sentences of match analysis explaining this prediction.
Tone: analytical, confident. Language: [EN/ES]
```

**Cost:** ~$0.002 per prediction. 104 matches total (72 group + 32 knockout) = ~$0.21 total for the entire tournament.

---

## Payment Flow (Stripe)

1. User lands on `/matches/[id]/prediction` → sees paywall modal
2. Clicks "Unlock All Predictions — $4.99"
3. Stripe Checkout session created via Next.js API route
4. User completes payment
5. Stripe webhook → Supabase Edge Function `stripe-webhook` → creates `subscriptions` row with `status: active`, `expires_at: 2026-08-01`
6. User redirected back to prediction page, now unlocked
7. All future prediction pages unlocked for this user (single purchase, no recurring)

---

## Internationalization (i18n)

Using `next-intl`. Language toggle in the navbar (EN/ES).

- UI strings: translation files in `/messages/en.json` and `/messages/es.json`
- AI narratives: both `ai_narrative_en` and `ai_narrative_es` generated and stored at prediction time
- News items: Claude translates `content_en` → `content_es` during ingestion
- Default language: English (wider audience for advertising)

---

## Automated Data Pipeline

**Supabase Edge Function: `sync-data` (cron: every 6 hours)**
1. Fetch World Cup fixtures + results from football-data.org
2. Fetch team historical stats from API-Football (free tier)
3. Fetch injury/suspension data from SofaScore unofficial API
4. Fetch news from NewsAPI.org + RSS (BBC Sport, ESPN, Goal.com, Marca)
5. Send raw news to Claude: extract `{team_id, type, impact_weight, content_en, content_es, source_url}`
6. Upsert all data to Supabase
7. Trigger prediction recalculation for matches affected by new news

**Supabase Edge Function: `calculate-prediction` (on-demand + cached)**
1. Check if `predictions` row exists and `updated_at` < 6 hours ago → return cached
2. If stale or missing: fetch team stats + active news_items for both teams
3. Run Poisson model → get probabilities and predicted score
4. Call Claude API → get `ai_narrative_en` and `ai_narrative_es`
5. Upsert to `predictions` table
6. Return result

---

## UI Design Direction

- **Theme:** Dark mode by default, gold/green FIFA accent colors
- **Flags:** Prominent on every team card and match header (Supabase Storage)
- **Typography:** Modern sans-serif, bold match headlines
- **Probability bars:** Animated horizontal bars (home % | draw % | away %)
- **Confidence badge:** Color-coded pill (green=high, yellow=medium, red=low)
- **Score prediction:** Large display: "2 – 1" with team flags flanking
- **Countdown timer:** Live countdown to tournament start on landing page
- **Mobile-first responsive:** Optimized for mobile web before Expo migration

---

## Timeline

| Week | Milestone |
|---|---|
| Week 1 (Apr 1–7) | GitHub repo + Vercel setup, Supabase schema, Next.js scaffold, i18n |
| Week 2 (Apr 8–14) | Public pages: landing, groups, team profiles |
| Week 3 (Apr 15–21) | Data pipeline: sync-data Edge Function, API integrations |
| Week 4 (Apr 22–28) | Prediction engine: Poisson model + Claude API narratives |
| Week 5 (Apr 29–May 5) | Stripe paywall, auth flow, premium prediction pages |
| Week 6 (May 6–12) | Admin monitor, quiniela dashboard, i18n complete |
| Week 7 (May 13–19) | Polish UI, performance, SEO, load testing |
| Week 8 (May 20–26) | Beta testing, bug fixes, App Store prep (Expo) |
| Week 9 (May 27–Jun 3) | Marketing assets, Google Ads setup |
| **Launch** | **June 10, 2026 — one day before the World Cup** |

---

## Success Criteria

- All 12 groups and 104 matches rendered correctly
- Prediction engine returns result in < 2 seconds
- Data pipeline syncs without errors every 6 hours
- Stripe payment completes and unlocks predictions correctly
- EN/ES toggle works across all pages
- Lighthouse score > 90 on mobile
