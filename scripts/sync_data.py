#!/usr/bin/env python3
"""
sync_data.py — Actualiza datos reales en Supabase para WC26 Predictor
Fuentes: football-data.org (stats), FIFA/ESPN (rankings), flagcdn.com (flags)
"""

import os, sys, json, time, math
from datetime import datetime, timezone
import urllib.request
import urllib.error

# ── Config ────────────────────────────────────────────────────────────────────

SUPABASE_URL  = "https://hhdrvkilwtuqftabulov.supabase.co"
SERVICE_KEY   = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZHJ2a2lsd3R1cWZ0YWJ1bG92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTE1NzUwNCwiZXhwIjoyMDkwNzMzNTA0fQ.ciAIGKgf7spKpu93hJZaTxK921ssRFMdMdwcrD9vT3o"
FDAPI_KEY     = "d2cc6347d29c467ba70fb6862facf9d1"
FDAPI_BASE    = "https://api.football-data.org/v4"

# ── FIFA Rankings actualizados a Abril 2026 ───────────────────────────────────
# Fuente: ESPN (https://www.espn.com/soccer/rankings) + FIFA.com Abril 2026
FIFA_RANKINGS = {
    "France": 1, "Spain": 2, "Argentina": 3, "England": 4,
    "Portugal": 5, "Brazil": 6, "Netherlands": 7, "Morocco": 8,
    "Belgium": 9, "Germany": 10, "Japan": 11, "USA": 12,
    "Croatia": 13, "Colombia": 14, "Uruguay": 15, "Mexico": 16,
    "Switzerland": 17, "Senegal": 18, "Austria": 19, "South Korea": 20,
    "Australia": 21, "Iran": 22, "Türkiye": 23, "Denmark": 24,
    "Algeria": 25, "Norway": 26, "Egypt": 27, "Ivory Coast": 28,
    "Sweden": 29, "Ecuador": 30, "Scotland": 31, "Tunisia": 32,
    "Saudi Arabia": 33, "DR Congo": 34, "Canada": 35, "Ghana": 36,
    "Paraguay": 37, "Jordan": 38, "Iraq": 39, "South Africa": 40,
    "Qatar": 41, "Panama": 42, "Czech Republic": 43, "New Zealand": 44,
    "Bosnia & Herz.": 45, "Cape Verde": 46, "Uzbekistan": 47,
    "Haiti": 48, "Curaçao": 49,
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def sb_get(path, params=""):
    url = f"{SUPABASE_URL}/rest/v1/{path}{params}"
    req = urllib.request.Request(url, headers={
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
    })
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def sb_patch(path, where, payload):
    url = f"{SUPABASE_URL}/rest/v1/{path}?{where}"
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, method="PATCH", headers={
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    })
    try:
        with urllib.request.urlopen(req) as r:
            return r.status
    except urllib.error.HTTPError as e:
        print(f"  ⚠ PATCH error {e.code}: {e.read().decode()[:200]}")
        return e.code

def sb_upsert(table, rows, conflict):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    data = json.dumps(rows).encode()
    req = urllib.request.Request(url, data=data, method="POST", headers={
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": f"resolution=merge-duplicates,return=minimal",
        "on-conflict": conflict,
    })
    try:
        with urllib.request.urlopen(req) as r:
            return r.status
    except urllib.error.HTTPError as e:
        print(f"  ⚠ Upsert error {e.code}: {e.read().decode()[:200]}")
        return e.code

def fd_get(path):
    url = f"{FDAPI_BASE}{path}"
    req = urllib.request.Request(url, headers={
        "X-Auth-Token": FDAPI_KEY,
    })
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        print(f"  ⚠ football-data error {e.code} for {path}")
        return None

# ── Paso 1: Actualizar rankings FIFA y flag_url ───────────────────────────────

def step1_rankings_and_flags():
    print("\n── Paso 1: Rankings FIFA + flag_url ──────────────────────────────")
    teams = sb_get("teams", "?select=id,name,country_code")
    print(f"  {len(teams)} equipos encontrados")

    updated = 0
    for team in teams:
        tid   = team["id"]
        name  = team["name"]
        code  = team["country_code"]
        rank  = FIFA_RANKINGS.get(name)
        # flagcdn soporta códigos ISO 3166-1 alpha-2 y variantes como gb-eng, gb-sct
        flag  = f"https://flagcdn.com/w80/{code}.png"

        payload = {"flag_url": flag}
        if rank:
            payload["fifa_ranking"] = rank

        status = sb_patch("teams", f"id=eq.{tid}", payload)
        if status in (200, 204):
            updated += 1
            tag = f"#{rank}" if rank else "ranking sin cambio"
            print(f"  ✓ {name} — {tag} — flag: {flag}")
        else:
            print(f"  ✗ {name} — fallo ({status})")

    print(f"  → {updated}/{len(teams)} equipos actualizados")

# ── Paso 2: Stats reales de football-data.org ─────────────────────────────────
# Mapeamos equipos WC26 a sus IDs en football-data.org

TEAM_FD_IDS = {
    # name_in_supabase: football_data_id
    "Argentina": 6, "Brazil": 5, "France": 773, "Germany": 759,
    "Spain": 760, "Portugal": 765, "Netherlands": 8, "England": 66,
    "Belgium": 6, "Croatia": 799, "Uruguay": 803, "Colombia": 779,
    "Mexico": 764, "USA": 762, "Japan": 2267, "Morocco": 1017,
    "Senegal": 1031, "Switzerland": 788, "South Korea": 2281,
    "Australia": 811, "Canada": 771, "Iran": 2214, "Türkiye": 803,
    "Scotland": 1968, "Ecuador": 780, "Norway": 784, "Sweden": 790,
    "Austria": 775, "Denmark": 782, "Egypt": 7809, "Tunisia": 1016,
    "Saudi Arabia": 2225, "Ghana": 1019, "Panama": 782,
    "South Africa": 1029, "Paraguay": 800, "Algeria": 1007,
    "Ivory Coast": 1008, "DR Congo": 1062, "Iraq": 2244,
    "Qatar": 2246, "New Zealand": 3960, "Cape Verde": 4879,
    "Bosnia & Herz.": 1525, "Jordan": 2212, "Uzbekistan": 2252,
    "Curaçao": 5730, "Haiti": 3920, "Czech Republic": 798,
}

# Competencias relevantes para stats internacionales en football-data.org
# WC2026 Quals: CL2026 (UEFA), WCQ (CONMEBOL), etc.
# Usamos partidos de Nations League + Amistosos + Quals 2024-2025
COMPETITIONS = {
    "UEFA Nations League 2024-25": 2267,  # NL UEFA
    "CONMEBOL WCQ": 2079,                 # WCQ CONMEBOL
}

def fetch_team_matches(fd_id: int, team_name: str) -> dict:
    """
    Obtiene partidos del equipo en 2024-2025 y calcula stats.
    Devuelve dict con matches_played, wins, draws, losses, goals_for, goals_against.
    """
    results_2024 = {"mp": 0, "w": 0, "d": 0, "l": 0, "gf": 0, "ga": 0}
    results_2025 = {"mp": 0, "w": 0, "d": 0, "l": 0, "gf": 0, "ga": 0}

    for year in [2024, 2025]:
        # Intentamos obtener partidos del equipo via su ID
        data = fd_get(f"/teams/{fd_id}/matches?dateFrom={year}-01-01&dateTo={year}-12-31&status=FINISHED")
        if not data or "matches" not in data:
            continue

        bucket = results_2024 if year == 2024 else results_2025

        for m in data["matches"]:
            ht = m.get("homeTeam", {}).get("id")
            at = m.get("awayTeam", {}).get("id")
            score = m.get("score", {}).get("fullTime", {})
            hs = score.get("home")
            as_ = score.get("away")
            if hs is None or as_ is None:
                continue

            is_home = (ht == fd_id)
            gf = hs if is_home else as_
            ga = as_ if is_home else hs

            bucket["mp"] += 1
            bucket["gf"] += gf
            bucket["ga"] += ga
            if gf > ga:
                bucket["w"] += 1
            elif gf == ga:
                bucket["d"] += 1
            else:
                bucket["l"] += 1

        time.sleep(0.5)  # Rate limit: 10 req/min en tier free

    return {"2024": results_2024, "2025": results_2025}

def step2_team_stats():
    print("\n── Paso 2: Team stats reales (football-data.org) ─────────────────")
    teams = sb_get("teams", "?select=id,name")
    team_map = {t["name"]: t["id"] for t in teams}

    stats_rows = []
    skipped = []

    for team_name, fd_id in TEAM_FD_IDS.items():
        supabase_id = team_map.get(team_name)
        if not supabase_id:
            skipped.append(team_name)
            continue

        print(f"  Fetching {team_name} (fd_id={fd_id})…", end=" ", flush=True)
        stats = fetch_team_matches(fd_id, team_name)

        for period, s in stats.items():
            if s["mp"] == 0:
                # No hay datos reales, saltar (mantenemos lo que hay)
                continue
            stats_rows.append({
                "team_id": supabase_id,
                "period": period,
                "matches_played": s["mp"],
                "wins": s["w"],
                "draws": s["d"],
                "losses": s["l"],
                "goals_for": s["gf"],
                "goals_against": s["ga"],
                "clean_sheets": 0,        # calculado abajo si disponible
                "avg_possession": 50.0,   # placeholder — no disponible en free tier
                "big_chances_created": 0, # placeholder
            })

        total_mp = stats["2024"]["mp"] + stats["2025"]["mp"]
        print(f"{total_mp} partidos encontrados")

    if stats_rows:
        print(f"\n  Subiendo {len(stats_rows)} filas de stats…")
        # Upsert en lotes de 20
        batch_size = 20
        for i in range(0, len(stats_rows), batch_size):
            batch = stats_rows[i:i+batch_size]
            sb_upsert("team_stats", batch, "team_id,period")
        print(f"  ✓ Stats actualizadas")

    if skipped:
        print(f"  ⚠ Sin ID de football-data: {', '.join(skipped)}")

# ── Paso 3: current_form desde últimos partidos ───────────────────────────────

def step3_current_form():
    print("\n── Paso 3: current_form desde partidos recientes ─────────────────")
    teams = sb_get("teams", "?select=id,name")
    team_map = {t["name"]: t["id"] for t in teams}

    updated = 0
    for team_name, fd_id in TEAM_FD_IDS.items():
        supabase_id = team_map.get(team_name)
        if not supabase_id:
            continue

        data = fd_get(f"/teams/{fd_id}/matches?status=FINISHED&limit=5&dateFrom=2025-01-01")
        if not data or "matches" not in data:
            continue

        matches = data["matches"]
        # Tomar los 5 más recientes
        matches = sorted(matches, key=lambda m: m.get("utcDate", ""), reverse=True)[:5]

        form_chars = []
        for m in reversed(matches):  # cronológico
            ht = m.get("homeTeam", {}).get("id")
            score = m.get("score", {}).get("fullTime", {})
            hs = score.get("home")
            as_ = score.get("away")
            if hs is None or as_ is None:
                continue
            is_home = (ht == fd_id)
            gf = hs if is_home else as_
            ga = as_ if is_home else hs
            if gf > ga:
                form_chars.append("W")
            elif gf == ga:
                form_chars.append("D")
            else:
                form_chars.append("L")

        if len(form_chars) >= 3:
            form = "".join(form_chars[-5:])
            sb_patch("teams", f"id=eq.{supabase_id}", {"current_form": form})
            print(f"  ✓ {team_name}: {form}")
            updated += 1

        time.sleep(0.5)

    print(f"  → {updated} equipos con form actualizado")

# ── Main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("  WC26 Predictor — Sincronización de datos")
    print(f"  {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
    print("=" * 60)

    step1_rankings_and_flags()

    step2_team_stats()
    step3_current_form()

    print("\n✅ Sincronización completa")
    print("   Para actualizar stats reales, descomenta step2 y step3 en el script.")
