#!/usr/bin/env python3
"""
seed_knockout_matches.py — Inserta partidos de fase eliminatoria WC26 en la DB.
Los equipos se dejan NULL (TBD). El cron los llena cuando avanzan.

Uso: SUPABASE_SERVICE_ROLE_KEY=<key> python3 scripts/seed_knockout_matches.py
"""

import urllib.request, urllib.error, json, os, sys

SUPABASE_URL = "https://hhdrvkilwtuqftabulov.supabase.co"
SERVICE_KEY  = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not SERVICE_KEY:
    print("ERROR: Set SUPABASE_SERVICE_ROLE_KEY env var")
    sys.exit(1)

def supabase_post(table: str, rows: list[dict]) -> list:
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    body = json.dumps(rows).encode()
    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("apikey", SERVICE_KEY)
    req.add_header("Authorization", f"Bearer {SERVICE_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=representation")
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

# Partidos eliminatorios WC26 con equipos TBD
# stage: r32=Ronda32, r16=Octavos, qf=Cuartos, sf=Semis, 3rd=3erLugar, final=Final
# Fechas en UTC — ajustar si FIFA confirma horarios diferentes
KNOCKOUT_MATCHES = [
    # ── Ronda de 32 (4–11 Jul 2026) ──
    {"stage": "r32", "scheduled_at": "2026-07-04T20:00:00Z", "venue": "SoFi Stadium, Los Angeles",        "status": "scheduled", "home_slot": "1A",     "away_slot": "2B"},
    {"stage": "r32", "scheduled_at": "2026-07-04T23:30:00Z", "venue": "AT&T Stadium, Dallas",              "status": "scheduled", "home_slot": "1C",     "away_slot": "2D"},
    {"stage": "r32", "scheduled_at": "2026-07-05T20:00:00Z", "venue": "MetLife Stadium, New York",         "status": "scheduled", "home_slot": "1B",     "away_slot": "2A"},
    {"stage": "r32", "scheduled_at": "2026-07-05T23:30:00Z", "venue": "Levi's Stadium, San Francisco",     "status": "scheduled", "home_slot": "1D",     "away_slot": "2C"},
    {"stage": "r32", "scheduled_at": "2026-07-06T20:00:00Z", "venue": "Hard Rock Stadium, Miami",          "status": "scheduled", "home_slot": "1E",     "away_slot": "2F"},
    {"stage": "r32", "scheduled_at": "2026-07-06T23:30:00Z", "venue": "Gillette Stadium, Boston",          "status": "scheduled", "home_slot": "1G",     "away_slot": "2H"},
    {"stage": "r32", "scheduled_at": "2026-07-07T20:00:00Z", "venue": "Estadio Azteca, Ciudad de México",  "status": "scheduled", "home_slot": "1F",     "away_slot": "2E"},
    {"stage": "r32", "scheduled_at": "2026-07-07T23:30:00Z", "venue": "BC Place, Vancouver",               "status": "scheduled", "home_slot": "1H",     "away_slot": "2G"},
    {"stage": "r32", "scheduled_at": "2026-07-08T20:00:00Z", "venue": "Arrowhead Stadium, Kansas City",    "status": "scheduled", "home_slot": "1I",     "away_slot": "2J"},
    {"stage": "r32", "scheduled_at": "2026-07-08T23:30:00Z", "venue": "Allegiant Stadium, Las Vegas",      "status": "scheduled", "home_slot": "1K",     "away_slot": "2L"},
    {"stage": "r32", "scheduled_at": "2026-07-09T20:00:00Z", "venue": "Lincoln Financial Field, Filadelfia","status": "scheduled","home_slot": "1J",     "away_slot": "2I"},
    {"stage": "r32", "scheduled_at": "2026-07-09T23:30:00Z", "venue": "Empower Field, Denver",             "status": "scheduled", "home_slot": "1L",     "away_slot": "2K"},
    {"stage": "r32", "scheduled_at": "2026-07-10T20:00:00Z", "venue": "Estadio BBVA, Monterrey",           "status": "scheduled", "home_slot": "3A/B/C", "away_slot": "W49"},
    {"stage": "r32", "scheduled_at": "2026-07-10T23:30:00Z", "venue": "NRG Stadium, Houston",              "status": "scheduled", "home_slot": "3D/E/F", "away_slot": "W50"},
    {"stage": "r32", "scheduled_at": "2026-07-11T20:00:00Z", "venue": "BMO Field, Toronto",                "status": "scheduled", "home_slot": "3G/H/I", "away_slot": "W51"},
    {"stage": "r32", "scheduled_at": "2026-07-11T23:30:00Z", "venue": "Estadio Akron, Guadalajara",        "status": "scheduled", "home_slot": "3J/K/L", "away_slot": "W52"},
    # ── Octavos de Final (13–18 Jul 2026) ──
    {"stage": "r16", "scheduled_at": "2026-07-13T20:00:00Z", "venue": "SoFi Stadium, Los Angeles",        "status": "scheduled", "home_slot": "W49",    "away_slot": "W50"},
    {"stage": "r16", "scheduled_at": "2026-07-13T23:30:00Z", "venue": "MetLife Stadium, New York",         "status": "scheduled", "home_slot": "W51",    "away_slot": "W52"},
    {"stage": "r16", "scheduled_at": "2026-07-14T20:00:00Z", "venue": "AT&T Stadium, Dallas",              "status": "scheduled", "home_slot": "W53",    "away_slot": "W54"},
    {"stage": "r16", "scheduled_at": "2026-07-14T23:30:00Z", "venue": "Hard Rock Stadium, Miami",          "status": "scheduled", "home_slot": "W55",    "away_slot": "W56"},
    {"stage": "r16", "scheduled_at": "2026-07-16T20:00:00Z", "venue": "Estadio Azteca, Ciudad de México",  "status": "scheduled", "home_slot": "W57",    "away_slot": "W58"},
    {"stage": "r16", "scheduled_at": "2026-07-16T23:30:00Z", "venue": "Levi's Stadium, San Francisco",     "status": "scheduled", "home_slot": "W59",    "away_slot": "W60"},
    {"stage": "r16", "scheduled_at": "2026-07-17T20:00:00Z", "venue": "Arrowhead Stadium, Kansas City",    "status": "scheduled", "home_slot": "W61",    "away_slot": "W62"},
    {"stage": "r16", "scheduled_at": "2026-07-17T23:30:00Z", "venue": "Gillette Stadium, Boston",          "status": "scheduled", "home_slot": "W63",    "away_slot": "W64"},
    # ── Cuartos de Final (21–24 Jul 2026) ──
    {"stage": "qf",  "scheduled_at": "2026-07-21T20:00:00Z", "venue": "MetLife Stadium, New York",         "status": "scheduled", "home_slot": "W65",    "away_slot": "W66"},
    {"stage": "qf",  "scheduled_at": "2026-07-21T23:30:00Z", "venue": "SoFi Stadium, Los Angeles",        "status": "scheduled", "home_slot": "W67",    "away_slot": "W68"},
    {"stage": "qf",  "scheduled_at": "2026-07-23T20:00:00Z", "venue": "AT&T Stadium, Dallas",              "status": "scheduled", "home_slot": "W69",    "away_slot": "W70"},
    {"stage": "qf",  "scheduled_at": "2026-07-23T23:30:00Z", "venue": "Hard Rock Stadium, Miami",          "status": "scheduled", "home_slot": "W71",    "away_slot": "W72"},
    # ── Semifinales (29–30 Jul 2026) ──
    {"stage": "sf",  "scheduled_at": "2026-07-29T20:00:00Z", "venue": "AT&T Stadium, Dallas",              "status": "scheduled", "home_slot": "W73",    "away_slot": "W74"},
    {"stage": "sf",  "scheduled_at": "2026-07-30T20:00:00Z", "venue": "MetLife Stadium, New York",         "status": "scheduled", "home_slot": "W75",    "away_slot": "W76"},
    # ── Tercer Lugar ──
    {"stage": "3rd", "scheduled_at": "2026-08-01T20:00:00Z", "venue": "Hard Rock Stadium, Miami",          "status": "scheduled", "home_slot": "L77",    "away_slot": "L78"},
    # ── Final ──
    {"stage": "final","scheduled_at": "2026-08-02T20:00:00Z", "venue": "MetLife Stadium, New York",        "status": "scheduled", "home_slot": "W77",    "away_slot": "W78"},
]

def main():
    print(f"Insertando {len(KNOCKOUT_MATCHES)} partidos eliminatorios...")
    result = supabase_post("matches", KNOCKOUT_MATCHES)
    print(f"OK — {len(result)} partidos insertados")
    for r in result:
        print(f"  {r.get('stage','?')} | {r.get('home_slot','?')} vs {r.get('away_slot','?')} | {r.get('scheduled_at','?')[:10]}")

if __name__ == "__main__":
    main()
