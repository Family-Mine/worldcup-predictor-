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
- **Stripe CLI instalado** para testing local de webhooks
- ⚠️ Actualmente usando `sk_test_...` — pendiente cambiar a `sk_live_...` en producción

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

## ✅ Completado — Rediseño visual (2026-04-08/10)

Todos los cambios mergeados a `main` pero **pendientes de commit y deploy**:

### Cambios implementados
1. **Tipografía** — Inter → Space Grotesk (`tailwind.config.ts` + `layout.tsx` + `globals.css`)
2. **Token fifa-green** — `#006847` → `#16A34A` (verde FIFA más vivo)
3. **Logo** — emoji ⚽ → diana SVG dorada (`LogoMark.tsx`); actualizado en Navbar, login, register
4. **Botones CTA** — dorado → verde FIFA en 13 archivos (Navbar, home, pools, login, register, join, new, picks, special, PaywallCTA, PaywallGate, GroupBundleGate, SpecialPicksForm)
5. **Leaderboard fila "tú"** — highlight dorado → verde (5 ocurrencias en PoolLeaderboard + special/page)
6. **Fixes Next.js 16** — `await params` y `await cookies()` en pools/page, poolId/page, special/page, layout

### Pendiente del rediseño
- Línea dorada 2px arriba de cards en home hero y páginas de grupos/partidos (spec sección 4)
  - Home hero → fácil, 1 div wrapper
  - Groups/matches pages → esperar a limpiar los 44 errores TS primero

---

## Próximos pasos (en orden)

### 1. Commit + deploy del rediseño (inmediato)
```bash
git add -p   # revisar cambios
git commit -m "feat: visual redesign — Space Grotesk, green CTA buttons, SVG logo, leaderboard green highlight"
git push
# Vercel despliega automáticamente desde main
```

### 2. Stripe en producción
- Cambiar `STRIPE_SECRET_KEY` de `sk_test_...` a `sk_live_...` en Vercel env vars
- Configurar webhook en Stripe Dashboard: `https://worldcup-predictor-lovat.vercel.app/api/stripe/webhook`
- Actualizar `STRIPE_WEBHOOK_SECRET` con el signing secret del webhook live
- Probar flujo completo con tarjeta real

### 3. Línea dorada en cards (diseño)
- Home hero: agregar `<div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-fifa-gold to-yellow-700" />` al panel principal
- Groups/matches: resolver 44 errores TS primero

### 4. Cleanup TypeScript (44 errores preexistentes)
- Principalmente en `matches/[id]/page.tsx` y páginas relacionadas
- Causa: `home_team_id` / `away_team_id` nullable después de migración knockout
- No bloquean la app pero sí bloquean `npm run build` limpio

### 5. App mobile WC26
- 10 prompts de arquitectura guardados en `~/.claude/projects/.../memory/wc26_mobile_prompts.md`
- Stack confirmado: React Native + Expo
- Ejecutar prompts en orden: 10 → 1 → 4 → 8 → 2 → 5 → 3 → 6 → 7 → 9

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
