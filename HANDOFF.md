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

Schema de quinelas: `supabase/pools_schema.sql`

### RLS — Puntos críticos
- `pool_members_select` usa `auth_is_pool_member(pool_id)` (SECURITY DEFINER) para evitar recursión infinita
- `get_pool_id_by_invite_code(p_code text)` (SECURITY DEFINER) — permite que no-miembros busquen pool por invite_code al hacer join
- `pool_leaderboard` tiene políticas SELECT + INSERT + UPDATE (las INSERT/UPDATE se agregaron manualmente en Supabase después del schema inicial)
- `pools_select` también usa `auth_is_pool_member` para evitar la recursión

### Funciones en Supabase (aplicadas manualmente, no en el schema SQL)
- `auth_is_pool_member(p_pool_id uuid)` — verifica membresía sin recursión RLS
- `get_pool_id_by_invite_code(p_code text)` — lookup de pool para join flow
- `calculate_pool_points(p_match_id, p_actual_home, p_actual_away)` — calcula puntos tras resultado real

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
- Picks se cierran 5 min antes del partido (`isMatchLocked` en `src/lib/pools.ts`)
- Score inputs: `type="text" inputMode="numeric"` (no `type="number"` — evita flechas que descentran texto)
- Auto-save en `onBlur` — solo guarda si AMBOS campos tienen valor
- `joinPool` usa RPC `get_pool_id_by_invite_code` para bypasear RLS
- Locale se pasa como hidden form field en createPool y joinPool

## Archivos clave
| Archivo | Qué hace |
|---------|----------|
| `src/app/actions/pools.ts` | Server actions: createPool, joinPool, submitPick, submitSpecialPick |
| `src/lib/pools.ts` | isMatchLocked, computePoints, inviteUrl |
| `src/types/pools.ts` | Tipos TypeScript del módulo quinelas |
| `src/components/pools/PicksGrid.tsx` | Grid de predicciones por partido |
| `src/components/pools/PoolLeaderboard.tsx` | Tabla de posiciones |
| `src/components/pools/InviteCodeBanner.tsx` | Banner con código + botones copiar independientes |
| `src/components/pools/SpecialPicksForm.tsx` | Formulario goleador |
| `scripts/sync_data_v2.py` | Scraping Wikipedia para stats de equipos (45/48 teams — USA/MX/CA son hosts) |

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
- [ ] Fase knockout — segunda ronda de quinelas (reset de picks, nueva etapa)
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
```
