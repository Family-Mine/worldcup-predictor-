# WC26 Predictor — Handoff

## Stack
Next.js 14.2 · TypeScript · Tailwind CSS · Supabase (PostgreSQL + RLS) · Stripe · next-intl

## Estructura de rutas
```
/[locale]/                        → Home (predicciones del día)
/[locale]/groups/                 → Grupos del mundial
/[locale]/groups/[letter]/        → Detalle de grupo
/[locale]/matches/[id]/           → Detalle de partido
/[locale]/teams/[id]/             → Detalle de equipo
/[locale]/predictions/group-phase → Predicciones fase de grupos (requiere group_bundle)
/[locale]/pools/                  → Mis quinelas
/[locale]/pools/new/              → Crear quinela
/[locale]/pools/join/             → Unirse con código
/[locale]/pools/[poolId]/         → Home de quinela (leaderboard + invite)
/[locale]/pools/[poolId]/picks/   → Predicciones de la quinela
/[locale]/pools/[poolId]/special/ → Picks especiales (goleador)
/[locale]/login/                  → Login (client-side con createBrowserClient)
/[locale]/register/               → Registro
```

## Base de datos (Supabase)
**Project ID:** `hhdrvkilwtuqftabulov` · Región: us-east-1

Tablas principales: `teams`, `matches`, `predictions`, `subscriptions`, `user_add_ons`

Tablas de quinelas: `profiles`, `pools`, `pool_members`, `pool_picks`, `pool_special_picks`, `pool_leaderboard`

**Nueva (knockout phase):** `tournament_top_scorer` — singleton (id=1, CHECK), se upsertea en cada cron con el goleador actual

Schema de quinelas: `supabase/pools_schema.sql`  
**Migración knockout:** `supabase/migrations/knockout_phase.sql` — ⚠️ pendiente de aplicar en producción

### RLS — Puntos críticos
- `pool_members_select` usa `auth_is_pool_member(pool_id)` (SECURITY DEFINER) para evitar recursión infinita
- `get_pool_id_by_invite_code(p_code text)` (SECURITY DEFINER) — permite que no-miembros busquen pool por invite_code al hacer join
- `pool_leaderboard` tiene políticas SELECT + INSERT + UPDATE (las INSERT/UPDATE se agregaron manualmente en Supabase después del schema inicial)
- `pools_select` también usa `auth_is_pool_member` para evitar la recursión

### Funciones en Supabase (aplicadas manualmente, no en el schema SQL)
- `auth_is_pool_member(p_pool_id uuid)` — verifica membresía sin recursión RLS
- `get_pool_id_by_invite_code(p_code text)` — lookup de pool para join flow
- `calculate_pool_points(p_match_id, p_actual_home, p_actual_away)` — calcula puntos tras resultado real; v2 (knockout_phase.sql) separa en `group_points` / `knockout_points` según `stage` del partido

## Sistema de suscripciones (Stripe)
- **Base** (`subscription`): $4.99 → acceso a predicciones individuales
- **Group Bundle** (`group_bundle`): $9.99 → incluye base + vista de fase de grupos
- Al comprar `group_bundle`, el webhook otorga AMBAS: `subscriptions` + `user_add_ons`
- Webhook: `src/app/api/stripe/webhook/route.ts`
- Checkout: `src/app/api/stripe/checkout/route.ts`
- **Stripe CLI instalado** para testing local de webhooks

## Módulo de quinelas — Lógica de puntos
- Marcador exacto = 3 pts
- Ganador correcto (sin marcador exacto) = 1 pt
- Incorrecto = 0 pts
- Misma lógica en fase de grupos y fase knockout
- 3 premios separados: **Fase Grupos** (`group_points`) · **Fase Knockout** (`knockout_points`) · **Goleador** (comparación de nombre normalizado contra `tournament_top_scorer`)
- Picks se cierran 5 min antes del partido (`isMatchLocked` en `src/lib/pools.ts`)
- Score inputs: `type="text" inputMode="numeric"` (no `type="number"` — evita flechas que descentran texto)
- Auto-save en `onBlur` — solo guarda si AMBOS campos tienen valor
- `joinPool` usa RPC `get_pool_id_by_invite_code` para bypasear RLS
- Locale se pasa como hidden form field en createPool y joinPool

### Fase knockout — TBD teams
- `matches.home_team_id` / `away_team_id` son nullable; slots `home_slot`/`away_slot` muestran "1A", "W49", etc.
- PicksGrid bloquea inputs cuando `home_team_id IS NULL`
- Cron `sync-results` rellena team IDs cuando football-data.org los confirma (matching por kickoff ±5 min)
- Tab Knockout en picks page muestra banner hasta que haya al menos un equipo confirmado

## Archivos clave
| Archivo | Qué hace |
|---------|----------|
| `src/app/actions/pools.ts` | Server actions: createPool, joinPool, submitPick, submitSpecialPick |
| `src/lib/pools.ts` | isMatchLocked, computePoints, inviteUrl |
| `src/types/pools.ts` | Tipos del módulo quinelas — incl. `TournamentTopScorer`, `PoolLeaderboardEntry` con `group_points`/`knockout_points` |
| `src/types/database.ts` | Tipos DB — `Match` con `home_team_id: string \| null`, `home_slot`, `away_slot`; `MatchWithTeams` con teams nullable |
| `src/components/pools/PicksGrid.tsx` | Grid de predicciones — maneja TBD teams con slot labels, stages knockout con orden correcto |
| `src/components/pools/PoolLeaderboard.tsx` | Tabla de posiciones — tabs General/Grupos/Knockout + sección Goleador fija |
| `src/components/pools/InviteCodeBanner.tsx` | Banner con código + botones copiar independientes |
| `src/components/pools/SpecialPicksForm.tsx` | Formulario goleador |
| `src/app/api/sync-results/route.ts` | Cron diario: sync resultados + knockout teams + goleador (en ese orden) |
| `supabase/migrations/knockout_phase.sql` | Migración completa de fase knockout (⚠️ aplicar en producción) |
| `scripts/seed_knockout_matches.py` | Seed one-time de 32 partidos knockout con slots TBD (requiere SUPABASE_SERVICE_ROLE_KEY) |
| `scripts/sync_data_v2.py` | Scraping Wikipedia para stats de equipos (45/48 teams — USA/MX/CA son hosts) |

## Fase knockout — Estado del PR
**PR:** Family-Mine/worldcup-predictor-#1 — `feat/knockout-phase` → `main`

**Antes de mergear (checklist):**
1. Aplicar `supabase/migrations/knockout_phase.sql` en Supabase producción (`hhdrvkilwtuqftabulov`)
2. Verificar preview deployment de Vercel — tabs, leaderboard, Goleador
3. Correr `python scripts/seed_knockout_matches.py` contra producción (one-time, inserta 32 partidos TBD)
4. Confirmar que `FOOTBALL_DATA_API_KEY` está seteada en Vercel env vars

**TypeScript errors pendientes (44):** en páginas fuera del scope de quinelas (`matches/[id]/page.tsx`, etc.) — nullable team types. No bloquean la app pero se deben resolver en una sesión separada.

## Problemas resueltos
1. **RLS recursión infinita** en `pool_members` → fix con `auth_is_pool_member` SECURITY DEFINER
2. **joinPool fallaba** para usuarios no-miembros → fix con `get_pool_id_by_invite_code` RPC
3. **pool_leaderboard sin INSERT/UPDATE policy** → filas nunca se creaban al unirse
4. **Locale hardcodeado `/en/`** en server actions → fix con hidden form field
5. **Copy buttons compartían estado** → fix con `copiedLink`/`copiedCode` independientes
6. **useSearchParams sin Suspense** en join page → fix con `<Suspense>` boundary
7. **Score inputs descentrados** → cambio de `type=number` a `type=text inputMode=numeric`
8. **onBlur guardaba con campo vacío** → skip si algún campo está vacío
9. **.next cache corrupto** → `lsof -ti:3000 | xargs kill -9 && rm -rf .next`
10. **Login roto** (campos se limpiaban) → causa raíz era el cache corrupto de Next.js
11. **Group Bundle mostraba $4.99** → ahora $9.99 all-inclusive

## Setup de Claude (MCPs activos)
Configurados en `~/.claude/mcp.json`:
- **Supabase** — autenticado via OAuth (plugin)
- **Vercel** — autenticado via OAuth (plugin), project ID: `prj_z8vA8DH0rrorpycLVS3NrHxZUQTn`
- **Playwright** — control de browser para testing
- **GitHub** — token en mcp.json (PAT: `claude-code-mcp`)
- **Stripe** — sk_test en mcp.json (cambiar a sk_live en producción)

## Pendientes
- [ ] Configurar Stripe webhook en producción (URL: `https://worldcup-predictor-lovat.vercel.app/api/stripe/webhook`)
- [ ] Probar flujo completo con 2 usuarios reales en producción
- [ ] Traducciones ES para páginas de quinelas (actualmente hardcodeadas en español)
- [ ] Fecha de cierre para picks especiales (goleador siempre visible actualmente)
- [ ] Fase knockout — PR abierto (#1), ver checklist arriba antes de mergear
- [ ] Cambiar Stripe key a `sk_live_...` en producción

## Comandos útiles
```bash
# Dev server
npm run dev

# Si el servidor no responde en puerto 3000
lsof -ti:3000 | xargs kill -9 && rm -rf .next && npm run dev

# Sync de datos de equipos desde Wikipedia
python3 scripts/sync_data_v2.py

# Stripe webhook local
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Variables de entorno necesarias
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_APP_URL
FOOTBALL_DATA_API_KEY     # football-data.org — sync resultados, teams knockout, goleador
CRON_SECRET               # opcional — protege /api/sync-results con Bearer token
```
