# WC26 Predictor — Handoff

## ⚡ Estado al cierre 2026-05-09 (sesión auth/security/observability — Dispatch + local)

App estable. Sesión repartida entre Dispatch (móvil) y local — al cierre se consolidaron 6 commits en `main` (todos del 2026-05-09), pendientes de push a `origin`.

### Qué quedó hecho hoy (6 commits en main, NO pusheados a origin)

**Auth + security hardening:**
- `d473474` — `/api/predictions/[matchId]` ahora exige auth + subscription activa (antes era pública). Cierra leak de predicciones IA a usuarios sin pagar.
- `75a17f1` — Supabase session refresh movido al middleware (canónico). Eliminado cookie no-op del layout que causaba refreshes redundantes.

**Error pages + SEO:**
- `0534cac` — Páginas raíz `error.tsx`, `not-found.tsx`, `global-error.tsx` (Next 14 App Router). Antes 404/500 caían a la vista default fea.
- `fe63286` — `public/robots.txt` apuntando al sitemap.

**Affiliate links centralizados (Dispatch — `claude/nostalgic-bell-fd6539`, integrado vía cherry-pick):**
- `1afb0e1` (orig `95796fd`) — Nuevo `src/config/affiliates.ts` con tracking parameters por casa de apuestas. `BettingLinksBar.tsx` refactorizado: pasa de 119 → ~50 líneas, consume el config centralizado. Prep para programa de afiliados (ver carpeta `affiliate/` untracked: CHECKLIST.md + GUIA.md + emails para Codere/Betsson/Bet365/WPlay/Rushbet).

**Observability — Sentry (Dispatch — `claude/reverent-matsumoto-c5fe36`, integrado vía cherry-pick):**
- `0a640cd` (orig `bb19d37`) — `@sentry/nextjs` instalado. Configs: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/instrumentation.ts`. `next.config.mjs` envuelto en `withSentryConfig`. `error.tsx` y `global-error.tsx` reportan a Sentry.
- **Falta agregar a env producción:** `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `NEXT_PUBLIC_SENTRY_DSN` (ver `.env.example`).

### Estado verificado al cierre
- `npx tsc --noEmit` → exit 0 ✅
- `npm install` corrido tras cherry-pick de Sentry (deps nuevas instaladas)
- `git status` → 4 commits ahead de `origin/main`, untracked: `affiliate/` (docs manuales) y `.claude/worktrees/`

### Branches Dispatch huérfanas (no integrar — son viejas/duplicadas)
- `claude/bold-cerf-6b0625`, `ecstatic-stonebraker-775d92`, `thirsty-darwin-3d6cd9` — landing redesign + OAuth Google/Apple + hamburger menu (31 behind main, sin rebase, conflictos seguros). NO integrar sin revisar — del 2026-04-XX.
- `claude/eloquent-shtern`, `romantic-chandrasekhar`, `dreamy-feistel`, `exciting-neumann`, `magical-cartwright`, `nice-zhukovsky` — ya mergeadas o stale, eliminables.

### Pendientes vivos (heredados + nuevos)
- **Push de los 6 commits de hoy a `origin/main`** (pendiente de aprobación)
- Configurar Sentry DSN + auth token en Vercel env vars (sin esto Sentry no reporta nada en prod)
- Decidir si las branches Dispatch huérfanas se eliminan o se rebasen
- Centralizar auth en middleware (deuda técnica, NO tocar pre-WC26 — riesgo a 30 días del kickoff)
- Smoke test pago end-to-end con tarjeta real
- App móvil WC26 — build EAS + submit App Store / Play Store (HANDOFF en `~/Desktop/wc26-mobile`)
- Programa afiliados: enviar emails (`affiliate/emails/*.md` listos)

---

## ⚡ Estado al cierre 2026-05-01 (sesión polish UX + recta final)

App estable en producción. Foco: UX para usuarios pagos + finalizar rediseño visual + cerrar pendientes deferred + revenue leak en mobile.

### Qué quedó hecho esta sesión (8 commits pusheados — 7 web + 1 mobile)

**Rediseño visual finalizado:**
- `028683d` — Línea dorada (gradient `from-fifa-gold to-yellow-700`) arriba de las 4 features cards y la pools teaser card en home
- `4c38b44` — Línea dorada (sólido `border-t-2 border-t-fifa-gold`) arriba de Standings table en `/groups/[letter]` y AI Prediction + Head to Head cards en `/matches/[id]`. GroupCard y MatchCard ya la tenían
- Nota: el HANDOFF previo decía "44 errores TS" — `tsc --noEmit` ya pasa limpio (exit 0)

**UX condicional según estado de pago:**
- `c040cd2` — Landing oculta sección de pricing entera para Bundle owners. Hero CTA cambia de "Ver planes" → "Ver predicciones" (linkea a `/predictions/group-phase`). Basic-only ven solo card Bundle centrada como upsell
- `be53571` — "How it works" paso 1 ("🔓 Unlock predictions — One-time $4.99 payment") se reemplaza por "✅ Predicciones desbloqueadas — Tus 104 predicciones están listas. Explóralas por grupo o partido." cuando el user tiene subscription activa
- Implementación: landing page convertida a `async` server component + `await getTranslations` + `getSupabaseServerClient().auth.getUser()` + `hasGroupBundle()` / `hasActiveSubscription()`. Marcada `dynamic = 'force-dynamic'`
- 3 keys i18n nuevas en `messages/{en,es}.json`: `cta_view_predictions`, `how_step_1_paid_title`, `how_step_1_paid_desc`

**Hardening iOS / hydration / clipboard (cierra deferreds del HANDOFF previo):**
- `98013c5` — `viewport-fit: cover` en `layout.tsx` + `pt-[env(safe-area-inset-top)]` en Navbar + `top-[calc(env(safe-area-inset-top)+4rem)]` en MobileMenu + `pb-[max(2rem,env(safe-area-inset-bottom))]` en Footer (notch + home indicator iPhone)
- `d5165cc` — `timeZone: 'UTC'` en `formatMatchDate`, `formatMatchDateShort`, y kickoff label en PicksGrid (cierra hydration mismatch server vs cliente). Clipboard fallback en `InviteCodeBanner`: prueba `navigator.clipboard.writeText` con try/catch y cae a `<textarea> + execCommand('copy')` para iOS Safari < 13.4 / contextos no-secure
- `75a89f4` — Debounce 400ms por match en PicksGrid + version counter para descartar respuestas stale (evita saves perdidos cuando el usuario tap-tap entre inputs en mobile con red lenta). Cleanup de timers en unmount

**Mobile app — revenue leak cerrado (`~/Desktop/wc26-mobile` `2f073ba`):**
- Antes: cualquier sub activa (incluido Basic $4.99) desbloqueaba la vista de fase de grupos en la pantalla "Predicciones IA" — esa vista vale $9.99 (Bundle) en la web → leak ~$5/usuario que use ambas plataformas
- Ahora: chequea `user_add_ons` con `add_on='group_bundle'` además de `subscriptions.status='active'`. 3 estados:
  - Sin sub → banner $4.99 (igual que antes)
  - Basic only → nuevo banner "🔓 Vista de grupos — Upgrade $9.99 — Ya tienes Basic"
  - Bundle → desbloqueado
- Ambos paywalls deep-linkean a wc26predictor.com

### Pendientes vivos
- Centralizar auth en middleware (deuda técnica, NO tocar pre-WC26 — riesgo de romper auth en producción a 40 días del kickoff)
- App móvil WC26 — Expo SDK 54 con 4 tabs ya implementadas, HANDOFF propio en `~/Desktop/wc26-mobile`. Pendiente: build EAS + submit a App Store / Play Store
- Smoke test del flujo de pago end-to-end con tarjeta real post-cambios de hoy
- Runbook mini de incidentes para el día del partido (Stripe dashboard, logs Vercel, queries Supabase)

---

## ⚡ Estado al cierre 2026-04-30 (sesión nocturna)

App estable en producción. Pago end-to-end verificado en desktop y móvil con cuenta real.

### Qué quedó hecho esta sesión (8 commits pusheados)

**Pago — bug raíz resuelto:**
- `session.customer` venía null en checkouts sin Customer object → upsert a `subscriptions.stripe_customer_id` (NOT NULL) devolvía 400 → webhook devolvía 200 silenciosamente → suscripción nunca se escribía
- Fix: type guards + coalesce a `''` + `customer_creation: 'always'` en checkout
- Webhook ahora devuelve 500 en errores DB → Stripe reintenta + visible en dashboard
- `STRIPE_WEBHOOK_SECRET` y `SUPABASE_SERVICE_ROLE_KEY` ahora son required (no fallback silencioso)

**Hardening adicional:**
- Open redirect en checkout: `returnUrl` validado same-origin
- CRON `/api/sync-results` fail-closed si falta `CRON_SECRET`
- `expires_at` movido a env var `SUBSCRIPTION_EXPIRES_AT` (default `2026-10-01`)
- Idempotencia: tabla `processed_webhook_events` (PRIMARY KEY en `event_id`)
- Handler `charge.refunded` → status='refunded' + delete `user_add_ons` row
- Webhook subscrito a `charge.refunded` en Stripe
- `hasGroupBundle` ahora valida subscription activa (refund revoca acceso)
- Server actions de pools (`createPool`, `joinPool`, `submitPick`, `submitSpecialPick`) requieren suscripción activa
- `next.config.mjs`: wildcard `*.supabase.co` → host exacto `hhdrvkilwtuqftabulov.supabase.co` (cierra SSRF)
- `/api/auth/recovery` reescrito con patrón inline (cookies a la response, no al request store) → reset password ya funciona

**UX nuevas:**
- Landing redesign: dual pricing $4.99 (Basic) + $9.99 (Bundle, "Best value", borde dorado, glow)
- Hero CTA "Ver planes" scrollea a `#pricing` (antes auto-cobraba $4.99)
- Página `/payment-success` con checkmark verde + 3 CTAs (Group Phase / Match-by-match / Pools)
- Página `/welcome` post-OAuth con "¡Bienvenido!" + 2 CTAs (Ver planes / Explorar grupos)
- `/predictions/group-phase/loading.tsx` skeleton con spinner "calculando predicciones" (la página tarda ~5-7s)
- `UnlockButton` muestra error si checkout falla (antes era silent)
- Login + register: Suspense boundaries (no más blank screen mobile lento) + i18n completo (en + es)

**Mobile fixes:**
- `font-size: 16px` global en inputs (no más auto-zoom iOS)
- Hamburger button `p-2` → `p-2.5` (40px → 44px tap target iOS)
- Mobile menu `absolute` → `fixed` para escapar stacking context (no más clipping iOS)
- Backdrop oscuro click-to-close en menú hamburguesa
- `SocialAuthButtons` reset loading tras 1.5s (botones no quedan disabled)

**Reset total realizado:**
- Todos los users de Supabase borrados (auth + tablas de app)
- Todos los pagos en Stripe refundeados
- "Guest" customers en Stripe son históricos inofensivos

### Pendientes deferred (no bloquean, polish para post-launch)
- `safe-area-inset-top/bottom` en `globals.css` (notch iPhone)
- Hardcoded date locale en `src/lib/utils.ts` y `PicksGrid` (causa hydration mismatch)
- Clipboard fallback en `InviteCodeBanner` (iOS Safari viejo)
- PicksGrid: debounce de saves concurrentes en mobile
- Centralizar auth check en middleware (actualmente per-page)
- App móvil React Native + Expo (10 prompts en `~/.claude/projects/.../memory/wc26_mobile_prompts.md`)

### Acceso CLI persistente
- Stripe live restricted key `claude-cli-iMac-2026` (events:read + webhooks:write)
- Para usar en futura sesión: `export STRIPE_API_KEY="rk_live_51TJ2FQDDvw3X1R0v..."` (la key completa está en sesión actual; agregarla a `~/.zshrc` cuando puedas)
- Vercel CLI autenticado como `ljaramillo-ui`
- Supabase MCP autenticado (acceso SQL completo a project `hhdrvkilwtuqftabulov`)

---

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
Migración knockout: `supabase/migrations/knockout_phase.sql` — ✅ aplicada en producción

### RLS — Puntos críticos
- `pool_members_select` usa `auth_is_pool_member(pool_id)` (SECURITY DEFINER) para evitar recursión infinita
- `get_pool_id_by_invite_code(p_code text)` (SECURITY DEFINER) — permite que no-miembros busquen pool por invite_code al hacer join
- `pool_leaderboard` tiene políticas SELECT + INSERT + UPDATE (las INSERT/UPDATE se agregaron manualmente en Supabase después del schema inicial)
- `pools_select` también usa `auth_is_pool_member` para evitar la recursión

### Funciones en Supabase (aplicadas manualmente, no en el schema SQL)
- `auth_is_pool_member(p_pool_id uuid)` — verifica membresía sin recursión RLS
- `get_pool_id_by_invite_code(p_code text)` — lookup de pool para join flow
- `calculate_pool_points(p_match_id, p_actual_home, p_actual_away)` — calcula puntos; v2 separa en `group_points` / `knockout_points` según `stage`

## Sistema de suscripciones (Stripe)
- **Base** (`subscription`): $4.99 → acceso a predicciones individuales
- **Group Bundle** (`group_bundle`): $9.99 → incluye base + vista de fase de grupos
- Al comprar `group_bundle`, el webhook otorga AMBAS: `subscriptions` + `user_add_ons`
- Webhook: `src/app/api/stripe/webhook/route.ts`
- Checkout: `src/app/api/stripe/checkout/route.ts`
- **Stripe CLI instalado** + autenticado (live mode con restricted key)
- ✅ Producción usa `sk_live_...` — Stripe live ya activo desde 2026-04-27

## Módulo de quinelas — Lógica de puntos
- Marcador exacto = 3 pts
- Ganador correcto (sin marcador exacto) = 1 pt
- Incorrecto = 0 pts
- 3 premios separados: **Fase Grupos** (`group_points`) · **Fase Knockout** (`knockout_points`) · **Goleador**
- Picks se cierran 5 min antes del partido (`isMatchLocked` en `src/lib/pools.ts`)
- Score inputs: `type="text" inputMode="numeric"`
- Auto-save en `onBlur` — solo guarda si AMBOS campos tienen valor

### Fase knockout — TBD teams
- `matches.home_team_id` / `away_team_id` son nullable; slots `home_slot`/`away_slot` muestran "1A", "W49", etc.
- PicksGrid bloquea inputs cuando `home_team_id IS NULL`
- Cron `sync-results` rellena team IDs cuando football-data.org los confirma (matching por kickoff ±5 min)

## Archivos clave
| Archivo | Qué hace |
|---------|----------|
| `src/app/actions/pools.ts` | Server actions: createPool, joinPool, submitPick, submitSpecialPick |
| `src/lib/pools.ts` | isMatchLocked, computePoints, inviteUrl |
| `src/types/pools.ts` | Tipos del módulo quinelas — incl. `TournamentTopScorer`, `PoolLeaderboardEntry` |
| `src/types/database.ts` | Tipos DB — `Match` con `home_team_id: string \| null`, `home_slot`, `away_slot` |
| `src/components/pools/PicksGrid.tsx` | Grid de predicciones — maneja TBD teams con slot labels |
| `src/components/pools/PoolLeaderboard.tsx` | Tabla de posiciones — tabs General/Grupos/Knockout + sección Goleador |
| `src/components/layout/LogoMark.tsx` | Logo SVG diana dorada + wordmark (nuevo — rediseño 2026-04-08) |
| `src/app/api/sync-results/route.ts` | Cron diario: sync resultados + knockout teams + goleador |
| `supabase/migrations/knockout_phase.sql` | Migración completa de fase knockout (✅ en producción) |

---

## ✅ Completado — Rediseño visual (2026-04-08 → 2026-05-01)

1. **Tipografía** — Inter → Space Grotesk
2. **Token fifa-green** — `#006847` → `#16A34A`
3. **Logo** — emoji ⚽ → diana SVG dorada (`LogoMark.tsx`)
4. **Botones CTA** — dorado → verde FIFA en 13 archivos
5. **Leaderboard fila "tú"** — highlight dorado → verde
6. **Línea dorada en cards** — 2026-05-01: home (features + pools teaser, gradient) + groups/matches (Standings, AI Prediction, Head to Head, sólido)
7. **Fixes Next.js 16 parciales** — `await params` / `await cookies()` en pools/page, poolId/page, special/page, layout (otras pages siguen con params sync — proyecto sigue en Next 14.2)

---

## Próximos pasos sugeridos

### Pendientes deferred — polish iOS / hardening
- `safe-area-inset-top/bottom` en `globals.css` (notch iPhone)
- Hydration mismatch por `toLocaleDateString` con locale hardcodeado en `src/lib/utils.ts` y `PicksGrid`
- Clipboard fallback en `InviteCodeBanner` (iOS Safari viejo)
- PicksGrid: debounce de saves concurrentes en mobile

### Refactors opcionales
- Centralizar auth check en middleware (actualmente per-page)
- Diferenciar Bundle vs Basic en mobile app

### App mobile WC26
- Expo SDK 54 ya scaffolded en `~/Desktop/wc26-mobile`
- HANDOFF propio en ese repo
- 4 tabs (Grupos, Predicciones, Quinelas, Perfil) implementados ✅
- 10 prompts de arquitectura guardados en `~/.claude/projects/.../memory/wc26_mobile_prompts.md`

---

## Problemas resueltos (histórico)
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

## Comandos útiles
```bash
# Dev server
npm run dev

# Si el servidor no responde en puerto 3000
lsof -ti:3000 | xargs kill -9 && rm -rf .next && npm run dev

# Stripe webhook local
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Variables de entorno necesarias
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY                  ⚠️ cambiar a sk_live_...
STRIPE_WEBHOOK_SECRET              ⚠️ actualizar con signing secret live
NEXT_PUBLIC_APP_URL
FOOTBALL_DATA_API_KEY
CRON_SECRET
```
