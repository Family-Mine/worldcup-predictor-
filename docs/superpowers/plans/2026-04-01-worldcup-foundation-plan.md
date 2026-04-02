# World Cup 2026 Predictor — Plan 1: Foundation & Public Pages

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Next.js 14 project, connect Supabase + Vercel + GitHub, seed the 48 World Cup teams across 12 groups, and build all public-facing pages (landing, groups, team profiles, match previews) — fully deployed and visible without login.

**Architecture:** Next.js 14 App Router with `[locale]` dynamic segment for EN/ES i18n via next-intl. Supabase PostgreSQL for data. Static/ISR rendering for public pages (no server-side auth needed). Tailwind CSS with dark theme + FIFA gold accent.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase JS v2, next-intl, Jest + @testing-library/react, Vercel CLI

---

## File Structure

```
worldcup-predictor/
├── .env.local                              # Supabase + API keys (never committed)
├── .env.example                            # Template for env vars
├── next.config.ts                          # next-intl plugin config
├── tailwind.config.ts                      # Dark theme + FIFA colors
├── tsconfig.json
├── package.json
├── middleware.ts                           # next-intl locale routing
├── messages/
│   ├── en.json                             # English UI strings
│   └── es.json                             # Spanish UI strings
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql          # All 6 tables
│   └── seed/
│       └── 001_teams_and_matches.sql       # 48 teams + group fixtures
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx                  # Root layout with Navbar/Footer
│   │   │   ├── page.tsx                    # Landing page
│   │   │   ├── groups/
│   │   │   │   ├── page.tsx                # 12-group grid
│   │   │   │   └── [letter]/page.tsx       # Single group: standings + fixtures
│   │   │   ├── teams/
│   │   │   │   └── [id]/page.tsx           # Team profile: stats + news
│   │   │   └── matches/
│   │   │       └── [id]/page.tsx           # Match preview + paywall CTA
│   │   └── api/
│   │       └── health/route.ts             # Health check endpoint
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx                  # Logo + nav links + language toggle
│   │   │   └── Footer.tsx
│   │   ├── groups/
│   │   │   ├── GroupCard.tsx               # Single group card with 4 team flags
│   │   │   └── GroupsGrid.tsx              # 12-group responsive grid
│   │   ├── teams/
│   │   │   ├── TeamFlag.tsx                # Flag image + country code
│   │   │   └── FormBadge.tsx               # W/D/L recent form pills
│   │   ├── matches/
│   │   │   ├── MatchCard.tsx               # Compact match row
│   │   │   └── MatchHeader.tsx             # Large match hero (team flags + date)
│   │   ├── predictions/
│   │   │   └── PaywallCTA.tsx              # "Unlock predictions - $4.99" banner
│   │   └── ui/
│   │       ├── CountdownTimer.tsx          # Live countdown to June 11
│   │       └── LanguageToggle.tsx          # EN/ES switcher button
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                   # Browser Supabase client (singleton)
│   │   │   └── server.ts                   # Server Supabase client (cookies)
│   │   └── utils.ts                        # formatDate, cn() classnames helper
│   └── types/
│       └── database.ts                     # TypeScript types for all DB tables
└── docs/
    └── superpowers/
        ├── specs/
        │   └── 2026-04-01-worldcup-predictor-design.md
        └── plans/
            └── 2026-04-01-worldcup-foundation-plan.md
```

---

## Task 1: Bootstrap Next.js Project + GitHub + Vercel

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Create the Next.js project in the existing directory**

```bash
cd /Users/lucasjaramillo/Desktop/worldcup-predictor
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```

When prompted:
- Would you like to use Turbopack? → No (stability for production)

- [ ] **Step 2: Install additional dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr next-intl
npm install -D @types/node
```

- [ ] **Step 3: Install testing dependencies**

```bash
npm install -D jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom ts-jest
```

- [ ] **Step 4: Create jest.config.ts**

```typescript
// jest.config.ts
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
}

export default createJestConfig(config)
```

- [ ] **Step 5: Create jest.setup.ts**

```typescript
// jest.setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Create .env.example**

```bash
# .env.example
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
ANTHROPIC_API_KEY=your-claude-api-key
STRIPE_SECRET_KEY=your-stripe-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable
STRIPE_WEBHOOK_SECRET=your-webhook-secret
```

- [ ] **Step 7: Create .env.local from .env.example and fill in Supabase keys**

Go to supabase.com → New Project → copy URL and anon key into `.env.local`.
Leave Stripe + Anthropic keys blank for now (Plan 2).

- [ ] **Step 8: Push to GitHub**

```bash
# On github.com: create new repo named "worldcup-predictor" (public)
# Then:
git remote add origin https://github.com/YOUR_USERNAME/worldcup-predictor.git
git branch -M main
git add .
git commit -m "feat: bootstrap Next.js 14 project with Supabase + next-intl dependencies"
git push -u origin main
```

- [ ] **Step 9: Connect to Vercel**

```bash
npx vercel --yes
```
Follow prompts: link to existing GitHub repo, deploy to Production.
Then go to vercel.com → project settings → Environment Variables → add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.

- [ ] **Step 10: Verify deployment**

```bash
npx vercel --prod
```
Expected: Vercel URL printed. Open it — should show default Next.js page.

---

## Task 2: Tailwind Dark Theme + Design Tokens

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Write test for design token existence**

```typescript
// src/lib/__tests__/design-tokens.test.ts
describe('Tailwind config', () => {
  it('exports FIFA gold and green colors', async () => {
    const config = await import('../../../tailwind.config')
    const colors = config.default.theme?.extend?.colors as Record<string, string>
    expect(colors['fifa-gold']).toBe('#D4AF37')
    expect(colors['fifa-green']).toBe('#006847')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/lib/__tests__/design-tokens.test.ts --no-coverage
```
Expected: FAIL — `config.default.theme?.extend?.colors` is undefined.

- [ ] **Step 3: Update tailwind.config.ts**

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'fifa-gold': '#D4AF37',
        'fifa-green': '#006847',
        'surface': '#0F1117',
        'surface-card': '#1A1D27',
        'surface-border': '#2A2D3A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 4: Update globals.css**

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #0F1117;
  --foreground: #F1F5F9;
}

body {
  background-color: var(--background);
  color: var(--foreground);
  font-family: 'Inter', system-ui, sans-serif;
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx jest src/lib/__tests__/design-tokens.test.ts --no-coverage
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add tailwind.config.ts src/app/globals.css src/lib/__tests__/design-tokens.test.ts jest.config.ts jest.setup.ts
git commit -m "feat: add FIFA dark theme design tokens and testing setup"
```

---

## Task 3: TypeScript Database Types

**Files:**
- Create: `src/types/database.ts`

- [ ] **Step 1: Write test for type shape**

```typescript
// src/types/__tests__/database.test.ts
import type { Team, Match, Prediction, TeamStats, NewsItem, Subscription, UserPick } from '../database'

describe('Database types', () => {
  it('Team has required fields', () => {
    const team: Team = {
      id: 'uuid',
      name: 'Colombia',
      country_code: 'CO',
      group_letter: 'A',
      fifa_ranking: 9,
      flag_url: 'https://example.com/co.svg',
      confederation: 'CONMEBOL',
      coach: 'Néstor Lorenzo',
      current_form: 'WWDLW',
    }
    expect(team.country_code).toBe('CO')
  })

  it('Match has home and away team ids', () => {
    const match: Match = {
      id: 'uuid',
      home_team_id: 'uuid1',
      away_team_id: 'uuid2',
      group_letter: 'A',
      scheduled_at: '2026-06-11T15:00:00Z',
      venue: 'MetLife Stadium',
      status: 'scheduled',
      home_score: null,
      away_score: null,
      stage: 'group',
    }
    expect(match.status).toBe('scheduled')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/types/__tests__/database.test.ts --no-coverage
```
Expected: FAIL — module not found.

- [ ] **Step 3: Create src/types/database.ts**

```typescript
// src/types/database.ts

export type TeamForm = 'W' | 'D' | 'L'

export interface Team {
  id: string
  name: string
  country_code: string           // ISO 3166-1 alpha-2
  group_letter: string           // A through L
  fifa_ranking: number
  flag_url: string
  confederation: string
  coach: string
  current_form: string           // last 5 results e.g. "WWDLW"
}

export interface Match {
  id: string
  home_team_id: string
  away_team_id: string
  group_letter: string | null    // null for knockout stage
  scheduled_at: string           // ISO timestamptz
  venue: string
  status: 'scheduled' | 'live' | 'finished'
  home_score: number | null
  away_score: number | null
  stage: 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'final' | '3rd'
}

export interface Prediction {
  id: string
  match_id: string
  home_win_prob: number          // 0.00–1.00
  draw_prob: number
  away_win_prob: number
  predicted_home_score: number
  predicted_away_score: number
  predicted_winner: 'home' | 'draw' | 'away'
  confidence_level: 'high' | 'medium' | 'low'
  ai_narrative_en: string
  ai_narrative_es: string
  updated_at: string
}

export interface TeamStats {
  id: string
  team_id: string
  period: string                 // "2024" | "2025"
  matches_played: number
  wins: number
  draws: number
  losses: number
  goals_for: number
  goals_against: number
  clean_sheets: number
  avg_possession: number
  big_chances_created: number
}

export interface NewsItem {
  id: string
  team_id: string
  type: 'injury' | 'suspension' | 'form' | 'tactical'
  content_en: string
  content_es: string
  impact_weight: number          // -2.0 to +2.0
  source_url: string
  source_name: string
  fetched_at: string
  active: boolean
}

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string
  stripe_payment_intent_id: string
  status: 'active' | 'cancelled' | 'expired'
  expires_at: string
}

export interface UserPick {
  id: string
  user_id: string
  match_id: string
  picked_home_score: number
  picked_away_score: number
  picked_winner: 'home' | 'draw' | 'away'
  created_at: string
}

// Joined types for UI convenience
export interface MatchWithTeams extends Match {
  home_team: Team
  away_team: Team
}

export interface GroupStanding {
  team: Team
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  goal_difference: number
  points: number
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/types/__tests__/database.test.ts --no-coverage
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/
git commit -m "feat: add TypeScript database types for all Supabase tables"
```

---

## Task 4: Supabase Schema Migration + Seed Data

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `supabase/seed/001_teams_and_matches.sql`

- [ ] **Step 1: Install Supabase CLI**

```bash
npm install -D supabase
npx supabase login
npx supabase init
```

- [ ] **Step 2: Create 001_initial_schema.sql**

```sql
-- supabase/migrations/001_initial_schema.sql

-- Teams
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country_code text not null,
  group_letter char(1) not null,
  fifa_ranking integer not null default 0,
  flag_url text not null default '',
  confederation text not null default '',
  coach text not null default '',
  current_form text not null default '',
  created_at timestamptz not null default now()
);

-- Matches
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  home_team_id uuid not null references public.teams(id),
  away_team_id uuid not null references public.teams(id),
  group_letter char(1),
  scheduled_at timestamptz not null,
  venue text not null default '',
  status text not null default 'scheduled' check (status in ('scheduled','live','finished')),
  home_score integer,
  away_score integer,
  stage text not null default 'group' check (stage in ('group','r32','r16','qf','sf','final','3rd')),
  created_at timestamptz not null default now()
);

-- Predictions
create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null unique references public.matches(id),
  home_win_prob numeric(5,4) not null default 0,
  draw_prob numeric(5,4) not null default 0,
  away_win_prob numeric(5,4) not null default 0,
  predicted_home_score integer not null default 0,
  predicted_away_score integer not null default 0,
  predicted_winner text not null default 'draw' check (predicted_winner in ('home','draw','away')),
  confidence_level text not null default 'medium' check (confidence_level in ('high','medium','low')),
  ai_narrative_en text not null default '',
  ai_narrative_es text not null default '',
  updated_at timestamptz not null default now()
);

-- Team stats (historical, per year)
create table public.team_stats (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id),
  period text not null,
  matches_played integer not null default 0,
  wins integer not null default 0,
  draws integer not null default 0,
  losses integer not null default 0,
  goals_for integer not null default 0,
  goals_against integer not null default 0,
  clean_sheets integer not null default 0,
  avg_possession numeric(5,2) not null default 0,
  big_chances_created integer not null default 0,
  unique(team_id, period)
);

-- News items (auto-ingested)
create table public.news_items (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id),
  type text not null check (type in ('injury','suspension','form','tactical')),
  content_en text not null default '',
  content_es text not null default '',
  impact_weight numeric(3,1) not null default 0 check (impact_weight >= -2 and impact_weight <= 2),
  source_url text not null default '',
  source_name text not null default '',
  fetched_at timestamptz not null default now(),
  active boolean not null default true
);

-- Subscriptions (Stripe)
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id),
  stripe_customer_id text not null default '',
  stripe_payment_intent_id text not null default '',
  status text not null default 'active' check (status in ('active','cancelled','expired')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- User quiniela picks
create table public.user_picks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  match_id uuid not null references public.matches(id),
  picked_home_score integer not null,
  picked_away_score integer not null,
  picked_winner text not null check (picked_winner in ('home','draw','away')),
  created_at timestamptz not null default now(),
  unique(user_id, match_id)
);

-- RLS Policies
alter table public.teams enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;
alter table public.team_stats enable row level security;
alter table public.news_items enable row level security;
alter table public.subscriptions enable row level security;
alter table public.user_picks enable row level security;

-- Public read access for teams, matches, team_stats, news_items
create policy "Public can read teams" on public.teams for select using (true);
create policy "Public can read matches" on public.matches for select using (true);
create policy "Public can read team_stats" on public.team_stats for select using (true);
create policy "Public can read active news" on public.news_items for select using (active = true);

-- Predictions: only visible to authenticated users with active subscription
create policy "Subscribers can read predictions" on public.predictions
  for select using (
    exists (
      select 1 from public.subscriptions
      where user_id = auth.uid()
      and status = 'active'
      and expires_at > now()
    )
  );

-- Subscriptions: user can only read their own
create policy "Users read own subscription" on public.subscriptions
  for select using (auth.uid() = user_id);

-- User picks: user can read/write their own
create policy "Users manage own picks" on public.user_picks
  for all using (auth.uid() = user_id);
```

- [ ] **Step 3: Create seed data file**

```sql
-- supabase/seed/001_teams_and_matches.sql
-- NOTE: Fill in the actual 2026 World Cup group assignments from the official FIFA draw.
-- Below is a template with known qualified teams. Verify groups at fifa.com before seeding.

-- Group A (USA, Panama, Honduras, Liguilla TBD - example)
insert into public.teams (name, country_code, group_letter, fifa_ranking, confederation, coach) values
  ('United States', 'US', 'A', 13, 'CONCACAF', 'Mauricio Pochettino'),
  ('Panama', 'PA', 'A', 54, 'CONCACAF', 'Thomas Christiansen'),
  ('Honduras', 'HN', 'A', 78, 'CONCACAF', 'Reinaldo Rueda'),
  ('Bolivia', 'BO', 'A', 82, 'CONMEBOL', 'Oscar Villegas');

-- Group B (example - verify with official draw)
insert into public.teams (name, country_code, group_letter, fifa_ranking, confederation, coach) values
  ('Mexico', 'MX', 'B', 15, 'CONCACAF', 'Javier Aguirre'),
  ('Ecuador', 'EC', 'B', 44, 'CONMEBOL', 'Sebastian Beccacece'),
  ('Venezuela', 'VE', 'B', 55, 'CONMEBOL', 'Fernando Batista'),
  ('Jamaica', 'JM', 'B', 62, 'CONCACAF', 'Heimir Hallgrímsson');

-- Group C
insert into public.teams (name, country_code, group_letter, fifa_ranking, confederation, coach) values
  ('Argentina', 'AR', 'C', 1, 'CONMEBOL', 'Lionel Scaloni'),
  ('Chile', 'CL', 'C', 33, 'CONMEBOL', 'Ricardo Gareca'),
  ('Peru', 'PE', 'C', 39, 'CONMEBOL', 'Jorge Fossati'),
  ('Canada', 'CA', 'C', 41, 'CONCACAF', 'Jesse Marsch');

-- Group D
insert into public.teams (name, country_code, group_letter, fifa_ranking, confederation, coach) values
  ('Brazil', 'BR', 'D', 5, 'CONMEBOL', 'Dorival Junior'),
  ('Colombia', 'CO', 'D', 9, 'CONMEBOL', 'Néstor Lorenzo'),
  ('Paraguay', 'PY', 'D', 52, 'CONMEBOL', 'Gustavo Alfaro'),
  ('Costa Rica', 'CR', 'D', 49, 'CONCACAF', 'Miguel Herrera');

-- Group E
insert into public.teams (name, country_code, group_letter, fifa_ranking, confederation, coach) values
  ('France', 'FR', 'E', 2, 'UEFA', 'Didier Deschamps'),
  ('Germany', 'DE', 'E', 12, 'UEFA', 'Julian Nagelsmann'),
  ('Portugal', 'PT', 'E', 6, 'UEFA', 'Roberto Martínez'),
  ('Algeria', 'DZ', 'E', 34, 'CAF', 'Vladimir Petkovic');

-- Group F
insert into public.teams (name, country_code, group_letter, fifa_ranking, confederation, coach) values
  ('Spain', 'ES', 'F', 3, 'UEFA', 'Luis de la Fuente'),
  ('Netherlands', 'NL', 'F', 7, 'UEFA', 'Ronald Koeman'),
  ('Denmark', 'DK', 'F', 21, 'UEFA', 'Kasper Hjulmand'),
  ('Serbia', 'RS', 'F', 28, 'UEFA', 'Dragan Stojković');

-- Group G
insert into public.teams (name, country_code, group_letter, fifa_ranking, confederation, coach) values
  ('England', 'GB-ENG', 'G', 4, 'UEFA', 'Lee Carsley'),
  ('Belgium', 'BE', 'G', 14, 'UEFA', 'Domenico Tedesco'),
  ('Austria', 'AT', 'G', 25, 'UEFA', 'Ralf Rangnick'),
  ('Ukraine', 'UA', 'G', 24, 'UEFA', 'Serhiy Rebrov');

-- Group H
insert into public.teams (name, country_code, group_letter, fifa_ranking, confederation, coach) values
  ('Italy', 'IT', 'H', 8, 'UEFA', 'Luciano Spalletti'),
  ('Switzerland', 'CH', 'H', 19, 'UEFA', 'Murat Yakin'),
  ('Türkiye', 'TR', 'H', 26, 'UEFA', 'Vincenzo Montella'),
  ('Morocco', 'MA', 'H', 14, 'CAF', 'Walid Regragui');

-- Group I
insert into public.teams (name, country_code, group_letter, fifa_ranking, confederation, coach) values
  ('Japan', 'JP', 'I', 17, 'AFC', 'Hajime Moriyasu'),
  ('South Korea', 'KR', 'I', 22, 'AFC', 'Hong Myung-bo'),
  ('Australia', 'AU', 'I', 23, 'AFC', 'Tony Popovic'),
  ('Saudi Arabia', 'SA', 'I', 56, 'AFC', 'Roberto Mancini');

-- Group J
insert into public.teams (name, country_code, group_letter, fifa_ranking, confederation, coach) values
  ('Uruguay', 'UY', 'J', 16, 'CONMEBOL', 'Marcelo Bielsa'),
  ('Senegal', 'SN', 'J', 20, 'CAF', 'Aliou Cissé'),
  ('Cameroon', 'CM', 'J', 35, 'CAF', 'Marc Brys'),
  ('New Zealand', 'NZ', 'J', 91, 'OFC', 'Darren Bazeley');

-- Group K
insert into public.teams (name, country_code, group_letter, fifa_ranking, confederation, coach) values
  ('Croatia', 'HR', 'K', 10, 'UEFA', 'Zlatko Dalic'),
  ('Poland', 'PL', 'K', 29, 'UEFA', 'Michał Probierz'),
  ('Nigeria', 'NG', 'K', 40, 'CAF', 'Eric Chelle'),
  ('Iran', 'IR', 'K', 22, 'AFC', 'Amir Ghalenoei');

-- Group L
insert into public.teams (name, country_code, group_letter, fifa_ranking, confederation, coach) values
  ('Ghana', 'GH', 'L', 60, 'CAF', 'Otto Addo'),
  ('South Africa', 'ZA', 'L', 65, 'CAF', 'Hugo Broos'),
  ('Egypt', 'EG', 'L', 37, 'CAF', 'Hossam Hassan'),
  ('Qatar', 'QA', 'L', 58, 'AFC', 'Marquez Lopez');
```

- [ ] **Step 4: Run migration against Supabase**

```bash
npx supabase db push
```
Expected: "All migrations applied successfully"

- [ ] **Step 5: Run seed**

Go to Supabase dashboard → SQL Editor → paste contents of `001_teams_and_matches.sql` → Run.
Verify: `select count(*) from teams` returns 48.

- [ ] **Step 6: Commit**

```bash
git add supabase/
git commit -m "feat: add initial DB schema migration and World Cup 2026 team seed data"
```

---

## Task 5: Supabase Client + Utility Functions

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/utils.ts`

- [ ] **Step 1: Write test for utils**

```typescript
// src/lib/__tests__/utils.test.ts
import { formatMatchDate, cn, getFormColor } from '../utils'

describe('utils', () => {
  it('formatMatchDate returns readable date', () => {
    const result = formatMatchDate('2026-06-11T15:00:00Z')
    expect(result).toMatch(/Jun/)
    expect(result).toMatch(/2026/)
  })

  it('cn merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
    expect(cn('foo', undefined, 'bar')).toBe('foo bar')
  })

  it('getFormColor returns correct color class', () => {
    expect(getFormColor('W')).toBe('bg-green-500')
    expect(getFormColor('D')).toBe('bg-yellow-500')
    expect(getFormColor('L')).toBe('bg-red-500')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/lib/__tests__/utils.test.ts --no-coverage
```
Expected: FAIL — module not found.

- [ ] **Step 3: Create src/lib/utils.ts**

```typescript
// src/lib/utils.ts

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatMatchDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

export function formatMatchDateShort(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function getFormColor(result: string): string {
  if (result === 'W') return 'bg-green-500'
  if (result === 'D') return 'bg-yellow-500'
  return 'bg-red-500'
}

export function parseForm(form: string): string[] {
  return form.split('').filter(c => ['W', 'D', 'L'].includes(c))
}

export function calculatePoints(wins: number, draws: number): number {
  return wins * 3 + draws
}
```

- [ ] **Step 4: Create src/lib/supabase/client.ts**

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseClient() {
  if (client) return client
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return client
}
```

- [ ] **Step 5: Create src/lib/supabase/server.ts**

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function getSupabaseServerClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

- [ ] **Step 6: Run tests**

```bash
npx jest src/lib/__tests__/utils.test.ts --no-coverage
```
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/
git commit -m "feat: add Supabase browser/server clients and utility functions"
```

---

## Task 6: next-intl Setup (EN/ES i18n)

**Files:**
- Create: `middleware.ts`
- Modify: `next.config.ts`
- Create: `messages/en.json`
- Create: `messages/es.json`
- Create: `src/app/[locale]/layout.tsx`
- Create: `src/i18n.ts`

- [ ] **Step 1: Create messages/en.json**

```json
{
  "nav": {
    "home": "Home",
    "groups": "Groups",
    "predictions": "Predictions"
  },
  "landing": {
    "hero_title": "Predict Every Match.",
    "hero_subtitle": "AI-powered score predictions for every 2026 World Cup match — backed by 2 years of stats.",
    "cta_unlock": "Unlock Predictions — $4.99",
    "cta_explore": "Explore Groups",
    "countdown_label": "Until kickoff",
    "days": "Days",
    "hours": "Hours",
    "minutes": "Minutes",
    "seconds": "Seconds"
  },
  "groups": {
    "title": "World Cup Groups",
    "group": "Group",
    "ranking": "FIFA Rank"
  },
  "teams": {
    "coach": "Coach",
    "confederation": "Confederation",
    "ranking": "FIFA Ranking",
    "form": "Recent Form",
    "stats": "2-Year Stats"
  },
  "matches": {
    "vs": "vs",
    "venue": "Venue",
    "kickoff": "Kickoff",
    "unlock_prediction": "Unlock Full Prediction",
    "unlock_description": "Get win probabilities, predicted score, and AI analysis for every match."
  },
  "paywall": {
    "title": "Unlock All Predictions",
    "price": "$4.99",
    "description": "One-time purchase. Access all 104 match predictions through the tournament.",
    "cta": "Unlock Now"
  }
}
```

- [ ] **Step 2: Create messages/es.json**

```json
{
  "nav": {
    "home": "Inicio",
    "groups": "Grupos",
    "predictions": "Predicciones"
  },
  "landing": {
    "hero_title": "Predice Cada Partido.",
    "hero_subtitle": "Predicciones de marcador con IA para cada partido del Mundial 2026 — respaldadas por 2 años de estadísticas.",
    "cta_unlock": "Desbloquear Predicciones — $4.99",
    "cta_explore": "Ver Grupos",
    "countdown_label": "Hasta el pitazo inicial",
    "days": "Días",
    "hours": "Horas",
    "minutes": "Minutos",
    "seconds": "Segundos"
  },
  "groups": {
    "title": "Grupos del Mundial",
    "group": "Grupo",
    "ranking": "Ranking FIFA"
  },
  "teams": {
    "coach": "Entrenador",
    "confederation": "Confederación",
    "ranking": "Ranking FIFA",
    "form": "Forma Reciente",
    "stats": "Estadísticas 2 Años"
  },
  "matches": {
    "vs": "vs",
    "venue": "Estadio",
    "kickoff": "Hora del partido",
    "unlock_prediction": "Ver Predicción Completa",
    "unlock_description": "Obtén probabilidades de victoria, marcador predicho y análisis con IA para cada partido."
  },
  "paywall": {
    "title": "Desbloquear Predicciones",
    "price": "$4.99",
    "description": "Pago único. Accede a las 104 predicciones de partidos durante todo el torneo.",
    "cta": "Desbloquear Ahora"
  }
}
```

- [ ] **Step 3: Create src/i18n.ts**

```typescript
// src/i18n.ts
import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`../messages/${locale}.json`)).default,
}))
```

- [ ] **Step 4: Update next.config.ts**

```typescript
// next.config.ts
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n.ts')

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'flagcdn.com' },
      { hostname: '*.supabase.co' },
    ],
  },
}

export default withNextIntl(nextConfig)
```

- [ ] **Step 5: Create middleware.ts**

```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware'

export default createMiddleware({
  locales: ['en', 'es'],
  defaultLocale: 'en',
  localePrefix: 'as-needed', // /en is default, /es for Spanish
})

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
```

- [ ] **Step 6: Create src/app/[locale]/layout.tsx**

```typescript
// src/app/[locale]/layout.tsx
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { Inter } from 'next/font/google'
import '../globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'World Cup 2026 Predictor',
  description: 'AI-powered match predictions for the 2026 FIFA World Cup',
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const messages = await getMessages()

  return (
    <html lang={locale} className="dark">
      <body className={`${inter.className} bg-surface text-slate-100 min-h-screen`}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 7: Delete the default app/layout.tsx and page.tsx (replaced by [locale] versions)**

```bash
rm -f src/app/layout.tsx src/app/page.tsx
```

- [ ] **Step 8: Test dev server starts without errors**

```bash
npm run dev
```
Expected: Server starts at http://localhost:3000, no errors in terminal. Browser shows blank page (no page.tsx yet — that's Task 7).

- [ ] **Step 9: Commit**

```bash
git add messages/ middleware.ts next.config.ts src/app/\[locale\]/ src/i18n.ts
git commit -m "feat: add next-intl i18n with EN/ES support and locale routing"
```

---

## Task 7: Shared UI Components (Navbar, Footer, CountdownTimer, LanguageToggle)

**Files:**
- Create: `src/components/layout/Navbar.tsx`
- Create: `src/components/layout/Footer.tsx`
- Create: `src/components/ui/CountdownTimer.tsx`
- Create: `src/components/ui/LanguageToggle.tsx`

- [ ] **Step 1: Write test for CountdownTimer**

```typescript
// src/components/ui/__tests__/CountdownTimer.test.tsx
import { render, screen } from '@testing-library/react'
import { CountdownTimer } from '../CountdownTimer'

describe('CountdownTimer', () => {
  it('renders countdown labels', () => {
    render(
      <CountdownTimer
        targetDate="2099-06-11T15:00:00Z"
        labels={{ days: 'Days', hours: 'Hours', minutes: 'Minutes', seconds: 'Seconds' }}
      />
    )
    expect(screen.getByText('Days')).toBeInTheDocument()
    expect(screen.getByText('Hours')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/components/ui/__tests__/CountdownTimer.test.tsx --no-coverage
```
Expected: FAIL — module not found.

- [ ] **Step 3: Create src/components/ui/CountdownTimer.tsx**

```typescript
// src/components/ui/CountdownTimer.tsx
'use client'

import { useEffect, useState } from 'react'

interface CountdownTimerProps {
  targetDate: string
  labels: { days: string; hours: string; minutes: string; seconds: string }
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function calculateTimeLeft(targetDate: string): TimeLeft {
  const diff = new Date(targetDate).getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

export function CountdownTimer({ targetDate, labels }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(targetDate))

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft(targetDate)), 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  const units = [
    { value: timeLeft.days, label: labels.days },
    { value: timeLeft.hours, label: labels.hours },
    { value: timeLeft.minutes, label: labels.minutes },
    { value: timeLeft.seconds, label: labels.seconds },
  ]

  return (
    <div className="flex gap-4 justify-center">
      {units.map(({ value, label }) => (
        <div key={label} className="flex flex-col items-center bg-surface-card rounded-lg px-4 py-3 min-w-[70px]">
          <span className="text-3xl font-bold text-fifa-gold tabular-nums">
            {String(value).padStart(2, '0')}
          </span>
          <span className="text-xs text-slate-400 uppercase tracking-widest mt-1">{label}</span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Create src/components/ui/LanguageToggle.tsx**

```typescript
// src/components/ui/LanguageToggle.tsx
'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'

export function LanguageToggle() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  function toggleLanguage() {
    const newLocale = locale === 'en' ? 'es' : 'en'
    const pathWithoutLocale = pathname.replace(/^\/(en|es)/, '') || '/'
    router.push(newLocale === 'en' ? pathWithoutLocale : `/es${pathWithoutLocale}`)
  }

  return (
    <button
      onClick={toggleLanguage}
      className="text-sm font-medium text-slate-400 hover:text-fifa-gold transition-colors px-2 py-1 rounded border border-surface-border hover:border-fifa-gold"
    >
      {locale === 'en' ? 'ES' : 'EN'}
    </button>
  )
}
```

- [ ] **Step 5: Create src/components/layout/Navbar.tsx**

```typescript
// src/components/layout/Navbar.tsx
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { LanguageToggle } from '@/components/ui/LanguageToggle'

export function Navbar() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const prefix = locale === 'es' ? '/es' : ''

  return (
    <nav className="border-b border-surface-border bg-surface/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href={`${prefix}/`} className="flex items-center gap-2">
          <span className="text-2xl">⚽</span>
          <span className="font-bold text-white text-lg">WC26 <span className="text-fifa-gold">Predictor</span></span>
        </Link>

        <div className="flex items-center gap-6">
          <Link href={`${prefix}/groups`} className="text-slate-300 hover:text-white text-sm transition-colors">
            {t('groups')}
          </Link>
          <LanguageToggle />
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 6: Create src/components/layout/Footer.tsx**

```typescript
// src/components/layout/Footer.tsx
export function Footer() {
  return (
    <footer className="border-t border-surface-border mt-24 py-8">
      <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
        <p>WC26 Predictor · AI-powered match predictions for the 2026 FIFA World Cup</p>
        <p className="mt-1">Predictions are statistical estimates, not guaranteed outcomes.</p>
      </div>
    </footer>
  )
}
```

- [ ] **Step 7: Add Navbar and Footer to locale layout**

```typescript
// src/app/[locale]/layout.tsx
// Add imports after existing imports:
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

// Replace <body> contents:
<body className={`${inter.className} bg-surface text-slate-100 min-h-screen`}>
  <NextIntlClientProvider messages={messages}>
    <Navbar />
    <main>{children}</main>
    <Footer />
  </NextIntlClientProvider>
</body>
```

- [ ] **Step 8: Run tests**

```bash
npx jest src/components/ui/__tests__/CountdownTimer.test.tsx --no-coverage
```
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/components/
git commit -m "feat: add Navbar, Footer, CountdownTimer, and LanguageToggle components"
```

---

## Task 8: Landing Page

**Files:**
- Create: `src/app/[locale]/page.tsx`

- [ ] **Step 1: Create the landing page**

```typescript
// src/app/[locale]/page.tsx
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { CountdownTimer } from '@/components/ui/CountdownTimer'

const WORLD_CUP_KICKOFF = '2026-06-11T18:00:00Z' // Opening match UTC

export default function LandingPage() {
  const t = useTranslations('landing')
  const tNav = useTranslations('nav')
  const locale = useLocale()
  const prefix = locale === 'es' ? '/es' : ''

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-surface-card border border-surface-border rounded-full px-4 py-1.5 text-sm text-slate-400 mb-8">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          2026 FIFA World Cup · USA / Canada / Mexico
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
          {t('hero_title').split(' ').map((word, i) => (
            <span key={i} className={i === 1 ? 'text-fifa-gold' : ''}>{word} </span>
          ))}
        </h1>

        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12">
          {t('hero_subtitle')}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            href={`${prefix}/groups`}
            className="px-8 py-4 bg-surface-card border border-surface-border rounded-xl text-white font-semibold hover:border-slate-500 transition-colors"
          >
            {t('cta_explore')}
          </Link>
          <button className="px-8 py-4 bg-fifa-gold text-black rounded-xl font-bold hover:bg-yellow-400 transition-colors">
            {t('cta_unlock')}
          </button>
        </div>

        {/* Countdown */}
        <div className="mb-4">
          <p className="text-slate-500 text-sm uppercase tracking-widest mb-4">{t('countdown_label')}</p>
          <CountdownTimer
            targetDate={WORLD_CUP_KICKOFF}
            labels={{
              days: t('days'),
              hours: t('hours'),
              minutes: t('minutes'),
              seconds: t('seconds'),
            }}
          />
        </div>
      </section>

      {/* Groups preview teaser */}
      <section className="max-w-7xl mx-auto px-4 py-16 border-t border-surface-border">
        <h2 className="text-2xl font-bold text-white mb-2">{tNav('groups')}</h2>
        <p className="text-slate-400 mb-8">48 teams · 12 groups · 104 matches</p>
        <Link
          href={`${prefix}/groups`}
          className="inline-flex items-center gap-2 text-fifa-gold hover:underline font-medium"
        >
          View all groups →
        </Link>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Start dev server and verify landing page**

```bash
npm run dev
```
Open http://localhost:3000. Expected: dark landing page with countdown timer, hero headline, gold CTA button. No errors in console.

- [ ] **Step 3: Commit**

```bash
git add src/app/\[locale\]/page.tsx
git commit -m "feat: add landing page with countdown timer and hero section"
```

---

## Task 9: Team Flag Component

**Files:**
- Create: `src/components/teams/TeamFlag.tsx`
- Create: `src/components/teams/FormBadge.tsx`

- [ ] **Step 1: Write test for TeamFlag**

```typescript
// src/components/teams/__tests__/TeamFlag.test.tsx
import { render, screen } from '@testing-library/react'
import { TeamFlag } from '../TeamFlag'

describe('TeamFlag', () => {
  it('renders country code as fallback text', () => {
    render(<TeamFlag countryCode="CO" name="Colombia" size="md" />)
    // Flag image should be present via img alt text
    expect(screen.getByRole('img', { name: 'Colombia' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/components/teams/__tests__/TeamFlag.test.tsx --no-coverage
```
Expected: FAIL — module not found.

- [ ] **Step 3: Create src/components/teams/TeamFlag.tsx**

Using flagcdn.com for flag images (free, no API key needed):

```typescript
// src/components/teams/TeamFlag.tsx
import Image from 'next/image'

const sizes = {
  sm: { img: 24, container: 'w-6 h-4' },
  md: { img: 40, container: 'w-10 h-7' },
  lg: { img: 64, container: 'w-16 h-11' },
  xl: { img: 96, container: 'w-24 h-16' },
}

interface TeamFlagProps {
  countryCode: string     // ISO 3166-1 alpha-2, lowercase
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function TeamFlag({ countryCode, name, size = 'md', className = '' }: TeamFlagProps) {
  const { container } = sizes[size]
  const code = countryCode.toLowerCase().replace('gb-eng', 'gb-eng')
  const flagUrl = `https://flagcdn.com/w80/${code}.png`

  return (
    <div className={`${container} ${className} relative overflow-hidden rounded-sm flex-shrink-0`}>
      <Image
        src={flagUrl}
        alt={name}
        fill
        className="object-cover"
        unoptimized
      />
    </div>
  )
}
```

- [ ] **Step 4: Create src/components/teams/FormBadge.tsx**

```typescript
// src/components/teams/FormBadge.tsx
import { getFormColor, parseForm } from '@/lib/utils'

interface FormBadgeProps {
  form: string   // e.g. "WWDLW"
}

export function FormBadge({ form }: FormBadgeProps) {
  const results = parseForm(form)

  return (
    <div className="flex gap-1">
      {results.map((result, i) => (
        <span
          key={i}
          className={`${getFormColor(result)} w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold`}
        >
          {result}
        </span>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Run tests**

```bash
npx jest src/components/teams/__tests__/TeamFlag.test.tsx --no-coverage
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/teams/
git commit -m "feat: add TeamFlag and FormBadge components using flagcdn.com"
```

---

## Task 10: Groups Pages (Grid + Single Group)

**Files:**
- Create: `src/components/groups/GroupCard.tsx`
- Create: `src/components/groups/GroupsGrid.tsx`
- Create: `src/app/[locale]/groups/page.tsx`
- Create: `src/app/[locale]/groups/[letter]/page.tsx`

- [ ] **Step 1: Create src/components/groups/GroupCard.tsx**

```typescript
// src/components/groups/GroupCard.tsx
import Link from 'next/link'
import { useLocale } from 'next-intl'
import type { Team } from '@/types/database'
import { TeamFlag } from '@/components/teams/TeamFlag'

interface GroupCardProps {
  letter: string
  teams: Team[]
}

export function GroupCard({ letter, teams }: GroupCardProps) {
  const locale = useLocale()
  const prefix = locale === 'es' ? '/es' : ''

  return (
    <Link href={`${prefix}/groups/${letter}`}>
      <div className="bg-surface-card border border-surface-border rounded-xl p-4 hover:border-fifa-gold transition-colors cursor-pointer group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-black text-white group-hover:text-fifa-gold transition-colors">
            Group {letter}
          </span>
          <span className="text-xs text-slate-500">4 teams</span>
        </div>
        <div className="space-y-2">
          {teams.map(team => (
            <div key={team.id} className="flex items-center gap-2">
              <TeamFlag countryCode={team.country_code} name={team.name} size="sm" />
              <span className="text-sm text-slate-300 truncate">{team.name}</span>
              <span className="ml-auto text-xs text-slate-500">#{team.fifa_ranking}</span>
            </div>
          ))}
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Create src/app/[locale]/groups/page.tsx**

```typescript
// src/app/[locale]/groups/page.tsx
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { GroupCard } from '@/components/groups/GroupCard'
import { useTranslations } from 'next-intl'
import type { Team } from '@/types/database'

export const revalidate = 3600 // ISR: revalidate every hour

export default async function GroupsPage() {
  const supabase = getSupabaseServerClient()
  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .order('group_letter', { ascending: true })
    .order('fifa_ranking', { ascending: true })

  const groupedTeams = (teams as Team[] ?? []).reduce<Record<string, Team[]>>((acc, team) => {
    const g = team.group_letter
    if (!acc[g]) acc[g] = []
    acc[g].push(team)
    return acc
  }, {})

  const groupLetters = Object.keys(groupedTeams).sort()

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-white mb-2">World Cup Groups</h1>
      <p className="text-slate-400 mb-8">48 teams · 12 groups · Groups A through L</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {groupLetters.map(letter => (
          <GroupCard key={letter} letter={letter} teams={groupedTeams[letter]} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create src/app/[locale]/groups/[letter]/page.tsx**

```typescript
// src/app/[locale]/groups/[letter]/page.tsx
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { TeamFlag } from '@/components/teams/TeamFlag'
import { FormBadge } from '@/components/teams/FormBadge'
import { MatchCard } from '@/components/matches/MatchCard'
import type { Team, MatchWithTeams, GroupStanding } from '@/types/database'
import { calculatePoints } from '@/lib/utils'
import { notFound } from 'next/navigation'

export const revalidate = 3600

export default async function GroupPage({ params }: { params: { letter: string } }) {
  const letter = params.letter.toUpperCase()
  const supabase = getSupabaseServerClient()

  const [{ data: teams }, { data: matches }] = await Promise.all([
    supabase.from('teams').select('*').eq('group_letter', letter),
    supabase
      .from('matches')
      .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
      .eq('group_letter', letter)
      .order('scheduled_at', { ascending: true }),
  ])

  if (!teams || teams.length === 0) notFound()

  // Build standings
  const standings: GroupStanding[] = (teams as Team[]).map(team => {
    const teamMatches = (matches as MatchWithTeams[] ?? []).filter(
      m => m.status === 'finished' && (m.home_team_id === team.id || m.away_team_id === team.id)
    )
    let won = 0, drawn = 0, lost = 0, gf = 0, ga = 0
    teamMatches.forEach(m => {
      const isHome = m.home_team_id === team.id
      const teamGoals = isHome ? (m.home_score ?? 0) : (m.away_score ?? 0)
      const oppGoals = isHome ? (m.away_score ?? 0) : (m.home_score ?? 0)
      gf += teamGoals
      ga += oppGoals
      if (teamGoals > oppGoals) won++
      else if (teamGoals === oppGoals) drawn++
      else lost++
    })
    return {
      team,
      played: won + drawn + lost,
      won, drawn, lost,
      goals_for: gf,
      goals_against: ga,
      goal_difference: gf - ga,
      points: calculatePoints(won, drawn),
    }
  }).sort((a, b) => b.points - a.points || b.goal_difference - a.goal_difference)

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <span className="text-slate-400 text-sm uppercase tracking-widest">Group</span>
        <h1 className="text-4xl font-black text-white">{letter}</h1>
      </div>

      {/* Standings table */}
      <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden mb-10">
        <div className="grid grid-cols-[1fr,auto,auto,auto,auto,auto] gap-x-4 px-4 py-2 text-xs text-slate-500 uppercase tracking-wider border-b border-surface-border">
          <span>Team</span>
          <span className="text-center">P</span>
          <span className="text-center">W</span>
          <span className="text-center">D</span>
          <span className="text-center">L</span>
          <span className="text-center font-bold text-white">Pts</span>
        </div>
        {standings.map((s, i) => (
          <div key={s.team.id} className="grid grid-cols-[1fr,auto,auto,auto,auto,auto] gap-x-4 px-4 py-3 items-center border-b border-surface-border last:border-0 hover:bg-surface-border/30">
            <div className="flex items-center gap-3">
              <span className="text-slate-500 text-sm w-4">{i + 1}</span>
              <TeamFlag countryCode={s.team.country_code} name={s.team.name} size="sm" />
              <span className="text-sm text-white font-medium">{s.team.name}</span>
              <FormBadge form={s.team.current_form} />
            </div>
            <span className="text-center text-sm text-slate-300">{s.played}</span>
            <span className="text-center text-sm text-slate-300">{s.won}</span>
            <span className="text-center text-sm text-slate-300">{s.drawn}</span>
            <span className="text-center text-sm text-slate-300">{s.lost}</span>
            <span className="text-center text-sm font-bold text-white">{s.points}</span>
          </div>
        ))}
      </div>

      {/* Fixtures */}
      <h2 className="text-xl font-bold text-white mb-4">Fixtures</h2>
      <div className="space-y-3">
        {(matches as MatchWithTeams[] ?? []).map(match => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create src/components/matches/MatchCard.tsx**

```typescript
// src/components/matches/MatchCard.tsx
import Link from 'next/link'
import { useLocale } from 'next-intl'
import type { MatchWithTeams } from '@/types/database'
import { TeamFlag } from '@/components/teams/TeamFlag'
import { formatMatchDateShort } from '@/lib/utils'

interface MatchCardProps {
  match: MatchWithTeams
}

export function MatchCard({ match }: MatchCardProps) {
  const locale = useLocale()
  const prefix = locale === 'es' ? '/es' : ''

  const isFinished = match.status === 'finished'

  return (
    <Link href={`${prefix}/matches/${match.id}`}>
      <div className="bg-surface-card border border-surface-border rounded-xl px-4 py-3 hover:border-slate-500 transition-colors flex items-center gap-4">
        <span className="text-xs text-slate-500 w-16 flex-shrink-0">
          {formatMatchDateShort(match.scheduled_at)}
        </span>

        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="text-sm text-white font-medium text-right">{match.home_team.name}</span>
          <TeamFlag countryCode={match.home_team.country_code} name={match.home_team.name} size="sm" />
        </div>

        <div className="flex items-center gap-1 mx-2 min-w-[60px] justify-center">
          {isFinished ? (
            <span className="text-lg font-black text-white tabular-nums">
              {match.home_score} – {match.away_score}
            </span>
          ) : (
            <span className="text-xs text-slate-500 font-medium">vs</span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-1">
          <TeamFlag countryCode={match.away_team.country_code} name={match.away_team.name} size="sm" />
          <span className="text-sm text-white font-medium">{match.away_team.name}</span>
        </div>

        <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
          match.status === 'live' ? 'bg-green-500/20 text-green-400' :
          match.status === 'finished' ? 'bg-surface-border text-slate-500' :
          'bg-surface-border text-slate-400'
        }`}>
          {match.status === 'live' ? '● LIVE' : match.status === 'finished' ? 'FT' : 'SCH'}
        </span>
      </div>
    </Link>
  )
}
```

- [ ] **Step 5: Test in browser**

```bash
npm run dev
```
Navigate to http://localhost:3000/groups — should show 12 group cards with flags and team names.
Navigate to http://localhost:3000/groups/A — should show standings table + fixtures.

- [ ] **Step 6: Commit**

```bash
git add src/app/\[locale\]/groups/ src/components/groups/ src/components/matches/MatchCard.tsx
git commit -m "feat: add groups grid page, single group page with standings and fixtures"
```

---

## Task 11: Team Profile Page

**Files:**
- Create: `src/app/[locale]/teams/[id]/page.tsx`

- [ ] **Step 1: Create src/app/[locale]/teams/[id]/page.tsx**

```typescript
// src/app/[locale]/teams/[id]/page.tsx
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { TeamFlag } from '@/components/teams/TeamFlag'
import { FormBadge } from '@/components/teams/FormBadge'
import type { Team, TeamStats, NewsItem } from '@/types/database'
import { notFound } from 'next/navigation'

export const revalidate = 3600

export default async function TeamPage({ params }: { params: { id: string } }) {
  const supabase = getSupabaseServerClient()

  const [{ data: team }, { data: stats }, { data: news }] = await Promise.all([
    supabase.from('teams').select('*').eq('id', params.id).single(),
    supabase.from('team_stats').select('*').eq('team_id', params.id).order('period', { ascending: false }),
    supabase.from('news_items').select('*').eq('team_id', params.id).eq('active', true).order('fetched_at', { ascending: false }).limit(5),
  ])

  if (!team) notFound()

  const t = team as Team
  const s = stats as TeamStats[] ?? []
  const n = news as NewsItem[] ?? []

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Team header */}
      <div className="flex items-center gap-6 mb-10">
        <TeamFlag countryCode={t.country_code} name={t.name} size="xl" />
        <div>
          <h1 className="text-4xl font-black text-white">{t.name}</h1>
          <p className="text-slate-400 mt-1">{t.confederation} · FIFA Rank #{t.fifa_ranking}</p>
          <p className="text-slate-500 text-sm mt-1">Coach: {t.coach}</p>
          <div className="mt-3">
            <FormBadge form={t.current_form} />
          </div>
        </div>
      </div>

      {/* Stats table */}
      {s.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">Historical Stats</h2>
          <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border text-slate-500 text-xs uppercase">
                  <th className="px-4 py-3 text-left">Year</th>
                  <th className="px-4 py-3 text-center">P</th>
                  <th className="px-4 py-3 text-center">W</th>
                  <th className="px-4 py-3 text-center">D</th>
                  <th className="px-4 py-3 text-center">L</th>
                  <th className="px-4 py-3 text-center">GF</th>
                  <th className="px-4 py-3 text-center">GA</th>
                </tr>
              </thead>
              <tbody>
                {s.map(stat => (
                  <tr key={stat.id} className="border-b border-surface-border last:border-0">
                    <td className="px-4 py-3 font-medium text-white">{stat.period}</td>
                    <td className="px-4 py-3 text-center text-slate-300">{stat.matches_played}</td>
                    <td className="px-4 py-3 text-center text-green-400">{stat.wins}</td>
                    <td className="px-4 py-3 text-center text-yellow-400">{stat.draws}</td>
                    <td className="px-4 py-3 text-center text-red-400">{stat.losses}</td>
                    <td className="px-4 py-3 text-center text-slate-300">{stat.goals_for}</td>
                    <td className="px-4 py-3 text-center text-slate-300">{stat.goals_against}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* News */}
      {n.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Latest News</h2>
          <div className="space-y-3">
            {n.map(item => (
              <div key={item.id} className="bg-surface-card border border-surface-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    item.type === 'injury' ? 'bg-red-500/20 text-red-400' :
                    item.type === 'suspension' ? 'bg-orange-500/20 text-orange-400' :
                    item.type === 'form' ? 'bg-green-500/20 text-green-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {item.type}
                  </span>
                  <a href={item.source_url} target="_blank" rel="noopener noreferrer"
                     className="text-xs text-slate-500 hover:text-slate-300">{item.source_name}</a>
                </div>
                <p className="text-slate-300 text-sm">{item.content_en}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Test in browser**

Navigate to http://localhost:3000/teams/[any-team-uuid-from-supabase].
Expected: team profile with flag, stats table, news section.

- [ ] **Step 3: Commit**

```bash
git add src/app/\[locale\]/teams/
git commit -m "feat: add team profile page with stats and news"
```

---

## Task 12: Match Preview Page + Paywall CTA

**Files:**
- Create: `src/components/matches/MatchHeader.tsx`
- Create: `src/components/predictions/PaywallCTA.tsx`
- Create: `src/app/[locale]/matches/[id]/page.tsx`
- Create: `src/app/api/health/route.ts`

- [ ] **Step 1: Create src/components/matches/MatchHeader.tsx**

```typescript
// src/components/matches/MatchHeader.tsx
import type { MatchWithTeams } from '@/types/database'
import { TeamFlag } from '@/components/teams/TeamFlag'
import { formatMatchDate } from '@/lib/utils'

interface MatchHeaderProps {
  match: MatchWithTeams
}

export function MatchHeader({ match }: MatchHeaderProps) {
  const isFinished = match.status === 'finished'

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-8 text-center">
      <p className="text-slate-500 text-sm uppercase tracking-widest mb-6">
        {match.stage === 'group' ? `Group ${match.group_letter} · ` : ''}{match.venue}
      </p>

      <div className="flex items-center justify-center gap-8">
        <div className="flex flex-col items-center gap-3 flex-1">
          <TeamFlag countryCode={match.home_team.country_code} name={match.home_team.name} size="xl" />
          <span className="text-xl font-bold text-white">{match.home_team.name}</span>
          <span className="text-xs text-slate-500">#{match.home_team.fifa_ranking} FIFA</span>
        </div>

        <div className="flex flex-col items-center min-w-[100px]">
          {isFinished ? (
            <span className="text-5xl font-black text-white tabular-nums">
              {match.home_score}–{match.away_score}
            </span>
          ) : (
            <>
              <span className="text-3xl font-black text-slate-400">vs</span>
              <span className="text-xs text-slate-500 mt-2">{formatMatchDate(match.scheduled_at)}</span>
            </>
          )}
        </div>

        <div className="flex flex-col items-center gap-3 flex-1">
          <TeamFlag countryCode={match.away_team.country_code} name={match.away_team.name} size="xl" />
          <span className="text-xl font-bold text-white">{match.away_team.name}</span>
          <span className="text-xs text-slate-500">#{match.away_team.fifa_ranking} FIFA</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create src/components/predictions/PaywallCTA.tsx**

```typescript
// src/components/predictions/PaywallCTA.tsx
'use client'

import { useTranslations } from 'next-intl'

export function PaywallCTA() {
  const t = useTranslations('paywall')

  return (
    <div className="bg-gradient-to-br from-surface-card to-surface border border-fifa-gold/30 rounded-2xl p-8 text-center">
      <div className="text-4xl mb-4">🔒</div>
      <h2 className="text-2xl font-black text-white mb-2">{t('title')}</h2>
      <p className="text-slate-400 mb-6 max-w-md mx-auto">{t('description')}</p>
      <div className="flex items-center justify-center gap-4">
        <span className="text-3xl font-black text-fifa-gold">{t('price')}</span>
        <button className="px-8 py-3 bg-fifa-gold text-black rounded-xl font-bold hover:bg-yellow-400 transition-colors text-lg">
          {t('cta')}
        </button>
      </div>
      <p className="text-xs text-slate-500 mt-4">One-time purchase · Valid through July 19, 2026</p>
    </div>
  )
}
```

- [ ] **Step 3: Create src/app/[locale]/matches/[id]/page.tsx**

```typescript
// src/app/[locale]/matches/[id]/page.tsx
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { MatchHeader } from '@/components/matches/MatchHeader'
import { PaywallCTA } from '@/components/predictions/PaywallCTA'
import { TeamFlag } from '@/components/teams/TeamFlag'
import type { MatchWithTeams } from '@/types/database'
import { notFound } from 'next/navigation'

export const revalidate = 1800

export default async function MatchPage({ params }: { params: { id: string } }) {
  const supabase = getSupabaseServerClient()

  const { data: match } = await supabase
    .from('matches')
    .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
    .eq('id', params.id)
    .single()

  if (!match) notFound()

  const m = match as MatchWithTeams

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <MatchHeader match={m} />

      {/* Head to head teaser */}
      <div className="mt-8 bg-surface-card border border-surface-border rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Head to Head</h2>
        <div className="flex items-center justify-between text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <TeamFlag countryCode={m.home_team.country_code} name={m.home_team.name} size="sm" />
            <span>{m.home_team.name}</span>
          </div>
          <span className="text-slate-600 text-xs">Historical record coming soon</span>
          <div className="flex items-center gap-2">
            <span>{m.away_team.name}</span>
            <TeamFlag countryCode={m.away_team.country_code} name={m.away_team.name} size="sm" />
          </div>
        </div>
      </div>

      {/* Paywall CTA */}
      <div className="mt-8">
        <PaywallCTA />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create health check API**

```typescript
// src/app/api/health/route.ts
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() })
}
```

- [ ] **Step 5: Test in browser**

Navigate to a match page from http://localhost:3000/groups/A.
Expected: match header with team flags, kickoff time, paywall CTA with gold button.

- [ ] **Step 6: Commit**

```bash
git add src/app/\[locale\]/matches/ src/components/matches/MatchHeader.tsx src/components/predictions/PaywallCTA.tsx src/app/api/
git commit -m "feat: add match preview page with team header and paywall CTA"
```

---

## Task 13: Final Polish + Production Deploy

**Files:**
- Modify: `src/app/[locale]/layout.tsx` (meta tags)
- Create: `public/og-image.png` (placeholder)

- [ ] **Step 1: Add better metadata to layout**

```typescript
// src/app/[locale]/layout.tsx — update metadata export:
export const metadata: Metadata = {
  title: {
    default: 'WC26 Predictor — AI Match Predictions',
    template: '%s · WC26 Predictor',
  },
  description: 'AI-powered score predictions for every 2026 FIFA World Cup match. Win probabilities, exact score forecasts, and team analysis backed by 2 years of stats.',
  openGraph: {
    title: 'WC26 Predictor',
    description: 'AI-powered match predictions for the 2026 FIFA World Cup',
    type: 'website',
  },
}
```

- [ ] **Step 2: Run full test suite**

```bash
npx jest --no-coverage
```
Expected: all tests PASS, no failures.

- [ ] **Step 3: Run production build locally**

```bash
npm run build
```
Expected: Build completes with no errors. Note any warnings.

- [ ] **Step 4: Fix any TypeScript errors surfaced by build**

```bash
npx tsc --noEmit
```
Fix any type errors reported before proceeding.

- [ ] **Step 5: Push to main and deploy to Vercel**

```bash
git add -A
git commit -m "feat: production build polish — metadata, SEO, type fixes"
git push origin main
```

Vercel auto-deploys on push. Monitor at vercel.com dashboard.

- [ ] **Step 6: Verify production URL**

Open the Vercel production URL. Verify:
- Landing page loads with countdown timer
- /groups shows all 12 group cards with flags
- /groups/A shows standings + fixtures
- /es/groups shows Spanish labels
- Language toggle switches between EN and ES
- No console errors
- Lighthouse mobile score > 80 (run in Chrome DevTools)

- [ ] **Step 7: Final commit**

```bash
git tag v0.1.0 -m "Plan 1 complete: foundation and public pages"
git push origin --tags
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Next.js 14 + TypeScript + Tailwind + Supabase — Task 1
- ✅ Dark theme + FIFA gold/green colors — Task 2
- ✅ All 6 DB tables with RLS policies — Task 4
- ✅ 48 teams seeded in 12 groups — Task 4
- ✅ TypeScript types for all tables — Task 3
- ✅ Supabase browser + server clients — Task 5
- ✅ next-intl EN/ES i18n — Task 6
- ✅ Navbar + Footer + LanguageToggle — Task 7
- ✅ CountdownTimer on landing — Task 7, 8
- ✅ Landing page with CTA — Task 8
- ✅ flagcdn.com flag images — Task 9
- ✅ FormBadge (W/D/L pills) — Task 9
- ✅ /groups — 12-group grid — Task 10
- ✅ /groups/[letter] — standings + fixtures — Task 10
- ✅ /teams/[id] — team profile — Task 11
- ✅ /matches/[id] — preview + paywall CTA — Task 12
- ✅ GitHub + Vercel deploy — Task 1, 13
- ⏳ Data pipeline — Plan 2
- ⏳ Prediction engine — Plan 2
- ⏳ Auth + Stripe — Plan 2
- ⏳ Premium prediction page — Plan 2
- ⏳ Admin monitor — Plan 2
- ⏳ Quiniela dashboard — Plan 2

**Type consistency:**
- `MatchWithTeams` used consistently in MatchCard, MatchHeader, GroupPage, MatchPage ✅
- `GroupStanding` computed in GroupPage matches type in database.ts ✅
- `getFormColor` signature matches usage in FormBadge ✅
- `calculatePoints` used in GroupPage matches implementation in utils.ts ✅
