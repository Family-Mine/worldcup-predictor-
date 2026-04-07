#!/usr/bin/env python3
"""
sync_data_v2.py — Stats reales para WC26 desde Wikipedia (clasificatorias + NL)
Fuentes: Wikipedia API (standings de clasificatorias por confederación)
"""

import urllib.request, urllib.error, json, re, sys, time

SUPABASE_URL = "https://hhdrvkilwtuqftabulov.supabase.co"
SERVICE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZHJ2a2lsd3R1cWZ0YWJ1bG92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTE1NzUwNCwiZXhwIjoyMDkwNzMzNTA0fQ.ciAIGKgf7spKpu93hJZaTxK921ssRFMdMdwcrD9vT3o"

# ── Helpers ───────────────────────────────────────────────────────────────────

def wiki_html(page):
    url = f"https://en.wikipedia.org/w/api.php?action=parse&page={urllib.parse.quote(page)}&prop=text&format=json&redirects=1"
    req = urllib.request.Request(url, headers={"User-Agent": "WC26Predictor/1.0"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())["parse"]["text"]["*"]

import urllib.parse

def extract_tables(html):
    """Extrae todas las wikitables como listas de filas."""
    tables_html = re.findall(r'<table[^>]*class="[^"]*wikitable[^"]*"[^>]*>(.*?)</table>', html, re.DOTALL)
    result = []
    for t in tables_html:
        rows = re.findall(r'<tr[^>]*>(.*?)</tr>', t, re.DOTALL)
        table_rows = []
        for row in rows:
            cells = re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', row, re.DOTALL)
            import html as html_mod
            clean = [re.sub(r'<[^>]+>','', c) for c in cells]
            clean = [html_mod.unescape(c) for c in clean]
            clean = [re.sub(r'\[+[a-z]+\]+', '', c).strip().replace('\xa0','').strip() for c in clean]
            if any(clean):
                table_rows.append(clean)
        if table_rows:
            result.append(table_rows)
    return result

def find_standings_table(tables):
    """Encuentra la primera tabla con columnas Pld/MP, W, D, L, GF, GA."""
    for t in find_all_standings_tables(tables):
        return t
    return None

def find_all_standings_tables(tables):
    """Devuelve TODAS las tablas con columnas Pld/MP, W, D, L, GF, GA."""
    result = []
    for t in tables:
        if not t:
            continue
        header = [c.lower() for c in t[0]]
        if ('pld' in header or 'mp' in header or 'pl' in header) and 'w' in header and 'gf' in header:
            result.append(t)
    return result

def parse_standings(table):
    """Convierte una tabla de standings en dict {team_name: {pld,w,d,l,gf,ga}}."""
    if not table or len(table) < 2:
        return {}
    header = [c.lower().strip() for c in table[0]]

    def col(name, aliases=[]):
        for a in [name] + aliases:
            # Exact match
            if a in header:
                return header.index(a)
            # Prefix match for multi-char names (handles "team.mw-parser-output..." CSS blobs)
            if len(a) > 2:
                for i, h in enumerate(header):
                    if h.startswith(a):
                        return i
        return None

    i_team = col('team', ['teamvte','club'])
    i_pld  = col('pld', ['mp','pl','played'])
    i_w    = col('w', ['won'])
    i_d    = col('d', ['drawn'])
    i_l    = col('l', ['lost'])
    i_gf   = col('gf', ['f','for'])
    i_ga   = col('ga', ['a','against'])

    if None in (i_team, i_pld, i_w, i_d, i_l, i_gf, i_ga):
        return {}

    result = {}
    for row in table[1:]:
        if len(row) <= max(i_team, i_pld, i_w, i_d, i_l, i_gf, i_ga):
            continue
        try:
            name = row[i_team].strip().lstrip('0123456789. ')
            # Limpiar nombre: remover ranking número al inicio
            name = re.sub(r'^\d+\s*', '', name).strip()
            if not name or name.lower() in ('pos','team',''):
                continue
            result[name] = {
                "matches_played": int(row[i_pld]),
                "wins":   int(row[i_w]),
                "draws":  int(row[i_d]),
                "losses": int(row[i_l]),
                "goals_for":     int(row[i_gf].replace('+','').replace('−','').replace('–','') or 0),
                "goals_against": int(row[i_ga].replace('+','').replace('−','').replace('–','') or 0),
            }
        except (ValueError, IndexError):
            continue
    return result

def sb_get(path):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    req = urllib.request.Request(url, headers={
        "apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"
    })
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def sb_patch(path, where, payload):
    url = f"{SUPABASE_URL}/rest/v1/{path}?{where}"
    req = urllib.request.Request(url, data=json.dumps(payload).encode(), method="PATCH", headers={
        "apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json", "Prefer": "return=minimal",
    })
    try:
        with urllib.request.urlopen(req) as r: return r.status
    except urllib.error.HTTPError as e:
        print(f"    PATCH error {e.code}: {e.read().decode()[:100]}")
        return e.code

# ── Fuentes de datos por confederación ───────────────────────────────────────
# Cada entrada: (wiki_page, period, descripción)
SOURCES = [
    # CONMEBOL — clasificatorias completas 2023-2025
    ("2026 FIFA World Cup qualification (CONMEBOL)", "2024", "CONMEBOL Qualification 2023–2025"),

    # UEFA WC Qualification 2025 (em-dash –)
    ("2026 FIFA World Cup qualification – UEFA Group A", "2025", "UEFA WCQ Group A"),
    ("2026 FIFA World Cup qualification – UEFA Group B", "2025", "UEFA WCQ Group B"),
    ("2026 FIFA World Cup qualification – UEFA Group C", "2025", "UEFA WCQ Group C"),
    ("2026 FIFA World Cup qualification – UEFA Group D", "2025", "UEFA WCQ Group D"),
    ("2026 FIFA World Cup qualification – UEFA Group E", "2025", "UEFA WCQ Group E"),
    ("2026 FIFA World Cup qualification – UEFA Group F", "2025", "UEFA WCQ Group F"),
    ("2026 FIFA World Cup qualification – UEFA Group G", "2025", "UEFA WCQ Group G"),
    ("2026 FIFA World Cup qualification – UEFA Group H", "2025", "UEFA WCQ Group H"),
    ("2026 FIFA World Cup qualification – UEFA Group I", "2025", "UEFA WCQ Group I"),
    ("2026 FIFA World Cup qualification – UEFA Group J", "2025", "UEFA WCQ Group J"),
    ("2026 FIFA World Cup qualification – UEFA Group K", "2025", "UEFA WCQ Group K"),
    ("2026 FIFA World Cup qualification – UEFA Group L", "2025", "UEFA WCQ Group L"),

    # AFC — clasificatorias Asia (em-dash)
    ("2026 FIFA World Cup qualification – AFC third round", "2024", "AFC WCQ Round 3"),
    ("2026 FIFA World Cup qualification – AFC second round", "2024", "AFC WCQ Round 2"),

    # CAF — clasificatorias África (todas las rondas)
    ("2026 FIFA World Cup qualification (CAF)", "2024", "CAF Qualification"),
    ("2026 FIFA World Cup qualification – CAF second round", "2024", "CAF Round 2"),

    # CONCACAF
    ("2026 FIFA World Cup qualification – CONCACAF third round", "2024", "CONCACAF Round 3"),
    ("2026 FIFA World Cup qualification (CONCACAF)", "2024", "CONCACAF Qualification"),
    ("2026 FIFA World Cup qualification – CONCACAF second round", "2024", "CONCACAF Round 2"),

    # OFC
    ("2026 FIFA World Cup qualification – OFC second round", "2024", "OFC Round 2"),
    ("2026 FIFA World Cup qualification – OFC first round", "2024", "OFC Round 1"),
]

# Mapeo de nombres en Wikipedia → nombres exactos en Supabase
NAME_MAP = {
    # CONMEBOL
    "Argentina":  "Argentina",
    "Brazil":     "Brazil",
    "Colombia":   "Colombia",
    "Uruguay":    "Uruguay",
    "Ecuador":    "Ecuador",
    "Paraguay":   "Paraguay",
    # UEFA
    "France":     "France",
    "Spain":      "Spain",
    "Germany":    "Germany",
    "Portugal":   "Portugal",
    "Netherlands":"Netherlands",
    "England":    "England",
    "Belgium":    "Belgium",
    "Croatia":    "Croatia",
    "Switzerland":"Switzerland",
    "Austria":    "Austria",
    "Sweden":     "Sweden",
    "Scotland":   "Scotland",
    "Czech Republic": "Czech Republic",
    "Czechia":    "Czech Republic",
    # AFC
    "Japan":      "Japan",
    "South Korea":"South Korea",
    "Korea Republic": "South Korea",
    "Iran":       "Iran",
    "IR Iran":    "Iran",
    "Saudi Arabia":"Saudi Arabia",
    "Australia":  "Australia",
    "Iraq":       "Iraq",
    "Uzbekistan": "Uzbekistan",
    "Qatar":      "Qatar",
    "Japan":      "Japan",
    "South Korea":"South Korea",
    "Korea Republic": "South Korea",
    # CAF
    "Morocco":    "Morocco",
    "Senegal":    "Senegal",
    "Ivory Coast":"Ivory Coast",
    "Côte d'Ivoire": "Ivory Coast",
    "Cote d'Ivoire": "Ivory Coast",
    "DR Congo":   "DR Congo",
    "Congo DR":   "DR Congo",
    "Ghana":      "Ghana",
    "South Africa":"South Africa",
    "Tunisia":    "Tunisia",
    "Egypt":      "Egypt",
    "Algeria":    "Algeria",
    # CONCACAF
    "United States": "USA",
    "United States of America": "USA",
    "Mexico":     "Mexico",
    "Canada":     "Canada",
    "Panama":     "Panama",
    # OFC
    "New Zealand":"New Zealand",
    # Otros
    "Bosnia and Herzegovina": "Bosnia & Herz.",
    "Bosnia & Herzegovina":   "Bosnia & Herz.",
    "Türkiye":    "Türkiye",
    "Turkey":     "Türkiye",
    "Norway":     "Norway",
    "Jordan":     "Jordan",
    "Cape Verde": "Cape Verde",
    "Cabo Verde": "Cape Verde",
    "Haiti":      "Haiti",
    "Curaçao":    "Curaçao",
    "Curacao":    "Curaçao",
}

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  WC26 — Stats reales desde Wikipedia")
    print("=" * 60)

    # Cargar equipos de Supabase
    teams = sb_get("teams?select=id,name")
    team_by_name = {t["name"]: t["id"] for t in teams}
    print(f"\n{len(teams)} equipos en Supabase\n")

    # Acumular stats por equipo (sumamos todas las fuentes)
    # {team_id: {"2024": {...}, "2025": {...}}}
    accumulated = {}

    def add_stats(team_name, period, stats):
        # Resolver nombre
        canonical = NAME_MAP.get(team_name, team_name)
        team_id = team_by_name.get(canonical)
        if not team_id:
            return False
        if team_id not in accumulated:
            accumulated[team_id] = {"name": canonical}
        if period not in accumulated[team_id]:
            accumulated[team_id][period] = {
                "matches_played":0,"wins":0,"draws":0,"losses":0,
                "goals_for":0,"goals_against":0
            }
        for k, v in stats.items():
            if k in accumulated[team_id][period]:
                accumulated[team_id][period][k] += v
        return True

    # Scraping de cada fuente
    for wiki_page, period, desc in SOURCES:
        print(f"  Scraping: {desc}…", end=" ", flush=True)
        try:
            html = wiki_html(wiki_page)
            tables = extract_tables(html)
            all_standings = find_all_standings_tables(tables)
            if not all_standings:
                print("sin tabla de standings")
                time.sleep(0.3)
                continue

            found = 0
            for standings in all_standings:
                for wiki_name, stats in parse_standings(standings).items():
                    if add_stats(wiki_name, period, stats):
                        found += 1

            print(f"{found} equipos")
            time.sleep(0.5)  # cortesía con Wikipedia

        except Exception as e:
            print(f"error: {e}")
            time.sleep(1)

    # Escribir en Supabase
    print(f"\n── Actualizando Supabase ─────────────────────────────────")
    updated = 0
    for team_id, data in accumulated.items():
        name = data.get("name", team_id)
        for period in ["2024", "2025"]:
            if period not in data:
                continue
            s = data[period]
            if s["matches_played"] == 0:
                continue

            payload = {
                "team_id": team_id,
                "period": period,
                "matches_played": s["matches_played"],
                "wins":   s["wins"],
                "draws":  s["draws"],
                "losses": s["losses"],
                "goals_for":     s["goals_for"],
                "goals_against": s["goals_against"],
                "clean_sheets": 0,
                "avg_possession": 50.0,
                "big_chances_created": 0,
            }

            # PATCH si ya existe, POST si no
            status = sb_patch("team_stats", f"team_id=eq.{team_id}&period=eq.{period}", payload)
            if status in (200, 204):
                updated += 1
                print(f"  ✓ {name} {period}: {s['matches_played']}MP {s['wins']}W {s['draws']}D {s['losses']}L {s['goals_for']}GF {s['goals_against']}GA")
            else:
                # Intentar crear la fila
                url = f"{SUPABASE_URL}/rest/v1/team_stats"
                req = urllib.request.Request(url, data=json.dumps(payload).encode(), method="POST", headers={
                    "apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}",
                    "Content-Type": "application/json", "Prefer": "return=minimal",
                })
                try:
                    with urllib.request.urlopen(req) as r:
                        updated += 1
                        print(f"  + {name} {period}: {s['matches_played']}MP (nuevo)")
                except urllib.error.HTTPError as e:
                    print(f"  ✗ {name} {period}: {e.code} {e.read().decode()[:80]}")

    print(f"\n✅ {updated} filas actualizadas con datos reales de Wikipedia")

if __name__ == "__main__":
    main()
