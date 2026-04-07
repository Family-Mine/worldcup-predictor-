# Knockout Phase — Design Spec
**Date:** 2026-04-07  
**Feature:** Fase eliminatoria de quinelas + sistema de 3 premios  
**Status:** Approved

---

## Resumen

Extender el módulo de quinelas para soportar la fase eliminatoria del WC26, introducir un sistema de 3 premios separados (Fase de Grupos, Fase Knockout, Goleador), y automatizar la resolución del goleador via football-data.org.

---

## Decisiones de diseño

| Pregunta | Decisión |
|----------|----------|
| Navegación entre fases | Tabs (Grupos / Knockout) en `/pools/[id]/picks` |
| Equipos no definidos (TBD) | Mostrar slot ("1A", "2B") con inputs bloqueados |
| Premios | 3 separados: Grupos · Knockout · Goleador |
| Leaderboard UI | Tabs General · Grupos · Knockout + sección Goleador fija |
| Top scorer | Automático vía football-data.org |
| Sistema de puntos knockout | Idéntico a grupos: exacto = 3 pts, ganador = 1 pt, incorrecto = 0 |

---

## 1. Schema de base de datos

### 1.1 `pool_leaderboard` — nuevas columnas

```sql
ALTER TABLE pool_leaderboard
  ADD COLUMN group_points    int NOT NULL DEFAULT 0,
  ADD COLUMN knockout_points int NOT NULL DEFAULT 0;
-- total_points = group_points + knockout_points (se mantiene para compatibilidad)
```

### 1.2 `matches` — soporte para equipos TBD

```sql
-- Hacer nullable los FK de equipos (knockout empieza sin equipos)
ALTER TABLE matches
  ALTER COLUMN home_team_id DROP NOT NULL,
  ALTER COLUMN away_team_id DROP NOT NULL,
  ADD COLUMN home_slot text,  -- ej: "1A", "2B", "W49" 
  ADD COLUMN away_slot text;
```

Regla: cuando `home_team_id IS NULL`, la UI muestra `home_slot`. Cuando el cron llena el FK, los inputs se desbloquean automáticamente.

### 1.3 `tournament_top_scorer` — tabla global nueva

```sql
CREATE TABLE tournament_top_scorer (
  id          serial PRIMARY KEY,
  player_name text NOT NULL,
  team_name   text NOT NULL,
  goals       int  NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);
-- 1 fila activa, se hace upsert en cada sync
```

### 1.4 Función `calculate_pool_points` — actualización

La función existente recibe `(p_match_id, p_actual_home, p_actual_away)`. Se actualiza para:
1. Leer el `stage` del partido
2. Sumar al bucket correcto: si `stage = 'group'` → incrementar `group_points`; si `stage IN ('r32','r16','qf','sf','final','3rd')` → incrementar `knockout_points`
3. Recalcular `total_points = group_points + knockout_points`

---

## 2. Sincronización automática

### Restricción: Vercel Hobby — máximo 2 crons
El proyecto tiene 1 cron activo (`/api/sync-results`). Hobby permite 2. Toda la nueva lógica de sync se incorpora al cron existente en lugar de crear rutas separadas.

### 2.1 Cron extendido: `sync-results` (`/api/sync-results`)
El cron diario existente se extiende para ejecutar 3 tareas en secuencia:
1. **Sync de resultados** (comportamiento actual) — llama `calculate_pool_points` al detectar partidos terminados
2. **Sync de equipos knockout** — para partidos `stage != 'group'` con `home_team_id IS NULL`, consulta football-data.org fixtures y llena los `team_id` cuando la API ya los confirma
3. **Sync de goleador** — consulta `/competitions/WC/scorers`, hace upsert del líder en `tournament_top_scorer`

La función SQL `calculate_pool_points` se actualiza para detectar el `stage` del partido y acumular en `group_points` o `knockout_points`.

**Resolución del premio goleador:** la UI compara `tournament_top_scorer.player_name` (normalizado: lowercase + trim) contra `pool_special_picks.top_scorer_tournament` de cada miembro.

### 2.2 Segundo cron disponible (reservado)
El segundo slot de cron en Hobby queda libre para uso futuro. No se usa en este feature.

---

## 3. UI / Componentes

### 3.1 `/pools/[id]/picks/page.tsx`

- Agregar tabs: **Grupos** | **Knockout**
- Tab activo por defecto: Grupos (mientras no hay partidos knockout con equipos confirmados)
- Cargar partidos de ambas fases; pasarlos al componente apropiado según tab activo
- El tab Knockout muestra banner "Disponible pronto" si todos los partidos knockout tienen `home_team_id IS NULL`

### 3.2 `PicksGrid` — manejo de TBD teams

- Cuando `match.home_team_id` es null: renderizar `match.home_slot` como texto plano en lugar de nombre/bandera del equipo
- Inputs deshabilitados + mensaje "Disponible cuando avancen los equipos" en el slot de estado
- Cuando `home_team_id` se llena (después del cron), la UI muestra equipo real e inputs activos (requiere `force-dynamic` para no cachear)

### 3.3 `PoolLeaderboard` — tabs de premios

El componente existente se extiende con 3 tabs:
- **General** — ranking por `total_points` (comportamiento actual)
- **Grupos** — ranking por `group_points`
- **Knockout** — ranking por `knockout_points`; muestra "Fase no iniciada" si todos tienen 0

Sección fija debajo de los tabs:
- **🥅 Goleador del torneo** — lista los miembros que escribieron el nombre correcto vs el resultado real de `tournament_top_scorer`. Muestra "En espera..." si `tournament_top_scorer` está vacía.

### 3.4 Tipos TypeScript

Actualizar `MatchWithTeams` para campos nullable:
```typescript
export interface Match {
  // ...
  home_team_id: string | null  // era string
  away_team_id: string | null  // era string
  home_slot: string | null
  away_slot: string | null
}

export interface MatchWithTeams extends Match {
  home_team: Team | null  // null cuando TBD
  away_team: Team | null
}
```

---

## 4. Flujo de vida completo

1. **Pre-torneo:** partidos knockout insertados en DB con `home_team_id = NULL`, `home_slot = "1A"`, etc. Tab Knockout visible con banner.
2. **Fase de grupos activa:** `sync-knockout-teams` corre diario, no encuentra cambios. Tab Knockout bloqueado.
3. **Octavos confirmados:** cron detecta equipos en la API → llena `team_id`. Inputs del tab Knockout se desbloquean. Usuarios hacen picks antes del kick-off (mismo lock de 5 min).
4. **Resultado de cada partido knockout:** `sync-results` → `calculate_pool_points` → suma a `knockout_points`.
5. **Final del torneo:** `sync-top-scorer` escribe goleador real → sección Goleador muestra ganadores.

---

## 5. Archivos a crear / modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/migrations/knockout_phase.sql` | Schema changes: pool_leaderboard, matches, tournament_top_scorer, update calculate_pool_points |
| `src/types/database.ts` | Match, MatchWithTeams con campos nullable + slots |
| `src/app/[locale]/pools/[poolId]/picks/page.tsx` | Agregar tabs, cargar ambas fases |
| `src/components/pools/PicksGrid.tsx` | Manejar TBD teams, banner de fase no iniciada |
| `src/components/pools/PoolLeaderboard.tsx` | Tabs General/Grupos/Knockout + sección Goleador |
| `src/app/api/sync-results/route.ts` | Extender con sync de equipos knockout + goleador |

---

## 6. Lo que NO cambia

- Sistema de puntos: exacto = 3, ganador = 1, incorrecto = 0 (idéntico en ambas fases)
- Lock de picks: 5 minutos antes del kick-off (mismo `isMatchLocked`)
- RLS policies: sin cambios, los nuevos datos usan las policies existentes de `pool_picks` y `pool_leaderboard`
- Stripe / suscripciones: sin cambios
- Módulo de picks especiales (`pool_special_picks`): sin cambios en schema, solo se agrega lógica de comparación en UI
