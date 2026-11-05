#!/usr/bin/env python3
"""Asistente de apuestas para betano.pe (solo stdlib).

No hace login ni coloca apuestas: calcula, arma el boleto, abre el navegador
y el usuario confirma el clic final. Ver SKILL.md.
"""
import argparse, json, os, platform, shutil, subprocess, sys, urllib.parse, urllib.request
from datetime import datetime, date
from pathlib import Path

BASE = Path(os.environ.get("BETANO_DIR", Path.home() / ".betano-asistido"))
CONF, BOLETOS, REG = BASE / "config.json", BASE / "boletos", BASE / "registro.jsonl"
DEF = {"bankroll": 100.0, "kelly_frac": 0.25, "stake_max_pct": 2.0, "perdida_dia_max": 10.0,
       "edge_min_pct": 2.0, "moneda": "PEN"}


def cfg():
    c = dict(DEF)
    if CONF.exists():
        c.update(json.loads(CONF.read_text()))
    return c


def registro():
    if not REG.exists():
        return []
    return [json.loads(l) for l in REG.read_text().splitlines() if l.strip()]


def guardar_reg(rows):
    REG.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rows))


def perdida_hoy(rows):
    hoy = date.today().isoformat()
    p = 0.0
    for r in rows:
        if r["fecha"][:10] != hoy:
            continue
        p += r["stake"] if r["estado"] in ("pendiente", "perdida") else 0
        p -= r["stake"] * (r["cuota"] - 1) if r["estado"] == "ganada" else 0
    return max(p, 0.0)


def analisis(cuotas, probs=None):
    imp = [1 / c for c in cuotas]
    s = sum(imp)
    out = {"margen_pct": round((s - 1) * 100, 2), "lineas": []}
    for i, c in enumerate(cuotas):
        justa = imp[i] / s
        p = probs[i] if probs else justa
        out["lineas"].append({"cuota": c, "p_implicita": round(imp[i], 4), "p_sin_margen": round(justa, 4),
                              "cuota_justa": round(1 / justa, 3), "p_usada": round(p, 4),
                              "edge_pct": round((p * c - 1) * 100, 2)})
    return out


def stake_kelly(p, cuota, c, rows):
    b = cuota - 1
    k = max((b * p - (1 - p)) / b, 0.0) if b > 0 else 0.0
    st = c["bankroll"] * k * c["kelly_frac"]
    st = min(st, c["bankroll"] * c["stake_max_pct"] / 100)
    disponible = c["perdida_dia_max"] - perdida_hoy(rows)
    return round(max(min(st, disponible), 0.0), 2), round(k * 100, 2), round(disponible, 2)


def abrir(url):
    sis = platform.system()
    for cmd in (["termux-open-url", url], ["xdg-open", url]) if sis != "Windows" else ():
        if shutil.which(cmd[0]):
            subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return True
    if sis == "Windows":
        os.startfile(url)  # noqa
        return True
    if sis == "Darwin":
        subprocess.Popen(["open", url])
        return True
    print("Abre manualmente:", url)
    return False


# ---------------- comandos ----------------
def c_config(a):
    BASE.mkdir(parents=True, exist_ok=True)
    c = cfg()
    for k in DEF:
        v = getattr(a, k, None)
        if v is not None:
            c[k] = v
    CONF.write_text(json.dumps(c, indent=2))
    print(json.dumps(c, indent=2))


def c_analizar(a):
    probs = [x / 100 if x > 1 else x for x in a.prob] if a.prob else None
    if probs and len(probs) != len(a.cuotas):
        sys.exit("--prob debe tener tantos valores como --cuotas")
    r = analisis(a.cuotas, probs)
    c, rows = cfg(), registro()
    for l in r["lineas"]:
        l["stake_sugerido"], l["kelly_pct"], _ = stake_kelly(l["p_usada"], l["cuota"], c, rows)
        l["value"] = probs is not None and l["edge_pct"] >= c["edge_min_pct"]
    print(json.dumps(r, indent=2, ensure_ascii=False))
    if not probs:
        print("\nSin --prob solo se ve el margen: sin estimación propia no hay value (edge ≤ 0).")


def c_boleto(a):
    c, rows = cfg(), registro()
    p = a.prob / 100 if a.prob > 1 else a.prob
    st, k, disp = stake_kelly(p, a.cuota, c, rows)
    if a.stake is not None:
        st = a.stake
    edge = (p * a.cuota - 1) * 100
    avisos = []
    if edge < c["edge_min_pct"]:
        avisos.append(f"edge {edge:.2f}% < mínimo {c['edge_min_pct']}%: no hay value")
    if st > c["bankroll"] * c["stake_max_pct"] / 100:
        avisos.append("stake supera el % máximo por apuesta")
    if st > disp:
        avisos.append(f"supera el límite de pérdida diaria (disponible {disp})")
    if st <= 0:
        avisos.append("stake 0: no apostar")
    url = a.url or "https://www.betano.pe/" + ("buscar/?q=" + urllib.parse.quote(a.evento) if a.evento else "")
    b = {"id": datetime.now().strftime("%Y%m%d-%H%M%S"), "fecha": datetime.now().isoformat(timespec="seconds"),
         "evento": a.evento, "mercado": a.mercado, "seleccion": a.seleccion, "cuota": a.cuota,
         "p_estimada": round(p, 4), "edge_pct": round(edge, 2), "kelly_pct": k, "stake": st,
         "moneda": c["moneda"], "url": url, "avisos": avisos, "estado": "borrador"}
    BOLETOS.mkdir(parents=True, exist_ok=True)
    (BOLETOS / f"{b['id']}.json").write_text(json.dumps(b, indent=2, ensure_ascii=False))
    print(json.dumps(b, indent=2, ensure_ascii=False))
    print(f"\nBoleto guardado: {BOLETOS / (b['id'] + '.json')}")
    if a.abrir:
        if avisos and not a.forzar:
            print("Hay avisos; no abro el navegador (usa --forzar si igual quieres).")
        else:
            abrir(url)
            print("Navegador abierto. Elige la selección, revisa que la cuota no haya bajado y confirma TÚ el clic.")
            print(f"Luego: betano.py confirmar {b['id']} [--cuota-real X]")


def c_confirmar(a):
    f = BOLETOS / f"{a.id}.json"
    if not f.exists():
        sys.exit(f"No existe {f}")
    b = json.loads(f.read_text())
    if a.cuota_real:
        b["cuota"] = a.cuota_real
    if a.stake is not None:
        b["stake"] = a.stake
    b["estado"] = "pendiente"
    f.write_text(json.dumps(b, indent=2, ensure_ascii=False))
    rows = registro()
    rows.append({k: b[k] for k in ("id", "fecha", "evento", "mercado", "seleccion", "cuota", "stake", "p_estimada", "estado")})
    guardar_reg(rows)
    print("Registrada como pendiente:", a.id)


def c_resultado(a):
    rows = registro()
    for r in rows:
        if r["id"] == a.id:
            r["estado"] = a.estado
            guardar_reg(rows)
            c = cfg()
            delta = {"ganada": r["stake"] * (r["cuota"] - 1), "perdida": -r["stake"], "nula": 0}[a.estado]
            c["bankroll"] = round(c["bankroll"] + delta, 2)
            CONF.write_text(json.dumps(c, indent=2))
            print(f"{a.id}: {a.estado} ({delta:+.2f}). Bankroll: {c['bankroll']}")
            return
    sys.exit("id no encontrado en el registro")


def c_resumen(a):
    rows, c = registro(), cfg()
    cerradas = [r for r in rows if r["estado"] in ("ganada", "perdida", "nula")]
    st = sum(r["stake"] for r in cerradas)
    pl = sum(r["stake"] * (r["cuota"] - 1) if r["estado"] == "ganada" else -r["stake"] if r["estado"] == "perdida" else 0
             for r in cerradas)
    print(json.dumps({"bankroll": c["bankroll"], "apuestas": len(rows), "cerradas": len(cerradas),
                      "pendientes": sum(r["estado"] == "pendiente" for r in rows),
                      "ganadas": sum(r["estado"] == "ganada" for r in rows), "apostado": round(st, 2),
                      "ganancia": round(pl, 2), "roi_pct": round(pl / st * 100, 2) if st else 0,
                      "perdida_hoy": round(perdida_hoy(rows), 2), "limite_dia": c["perdida_dia_max"]},
                     indent=2))


def c_odds_api(a):
    key = os.environ.get("ODDS_API_KEY")
    if not key:
        sys.exit("Falta ODDS_API_KEY (https://the-odds-api.com, plan gratis 500 req/mes).")
    q = urllib.parse.urlencode({"apiKey": key, "regions": a.region, "markets": a.mercado, "oddsFormat": "decimal"})
    url = f"https://api.the-odds-api.com/v4/sports/{a.deporte}/odds?{q}"
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "betano-asistido/1.0"}), timeout=20) as r:
        data = json.load(r)
    for ev in data[: a.max]:
        print(f"\n{ev['commence_time'][:16]}  {ev['home_team']} vs {ev['away_team']}")
        mejores = {}
        for bk in ev.get("bookmakers", []):
            for m in bk["markets"]:
                for o in m["outcomes"]:
                    if o["price"] > mejores.get(o["name"], (0,))[0]:
                        mejores[o["name"]] = (o["price"], bk["title"])
        if mejores:
            r = analisis([v[0] for v in mejores.values()])
            for (n, (pr, bk)), l in zip(mejores.items(), r["lineas"]):
                print(f"  {n:28s} {pr:6.2f} ({bk})  p_justa={l['p_sin_margen']:.3f}")
            print(f"  margen mejor-cuota: {r['margen_pct']}%  (negativo = posible surebet)")


# ---------------- importación masiva ----------------
import re, difflib, unicodedata

RE_CUOTA = re.compile(r"^\d{1,3}[.,]\d{1,2}$")
RE_RUIDO = re.compile(r"^(1|X|2|1X|12|X2|\+\d+|EN VIVO|LIVE|Hoy|Mañana|Más|Menos|Sí|No|"
                      r"\d{1,2}:\d{2}|\d{1,2}[/.]\d{1,2}([/.]\d{2,4})?|.*\d{1,2}:\d{2}.*|\d+'?)$", re.I)


def es_cuota(s):
    if not RE_CUOTA.match(s):
        return False
    v = float(s.replace(",", "."))
    return 1.01 <= v <= 1000


def parsear_texto(texto):
    """Heurística sobre el innerText de una lista de partidos: [nombre, nombre, (etiquetas), cuotas...]."""
    lineas = [l.strip() for l in texto.splitlines() if l.strip()]
    eventos, nombres, i = [], [], 0
    while i < len(lineas):
        l = lineas[i]
        if es_cuota(l):
            run = []
            while i < len(lineas) and (es_cuota(lineas[i]) or re.match(r"^(1|X|2)$", lineas[i], re.I)):
                if es_cuota(lineas[i]):
                    run.append(float(lineas[i].replace(",", ".")))
                i += 1
            if len(run) >= 2 and len(nombres) >= 2:
                eventos.append({"local": nombres[-2], "visita": nombres[-1],
                                "mercado": "1X2" if len(run) >= 3 else "2-vias",
                                "cuotas": run[:3] if len(run) >= 3 else run[:2], "extra": run[3:]})
            nombres = []
            continue
        if not RE_RUIDO.match(l) and re.search(r"[A-Za-zÁÉÍÓÚÑáéíóúñ]{2}", l) and len(l) <= 40:
            nombres.append(l)
        i += 1
    return eventos


def norm(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    s = re.sub(r"\b(fc|cf|cd|club|sc|ac|de|the|united|utd|deportivo|atletico)\b", " ", s)
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def sim(a, b):
    return difflib.SequenceMatcher(None, norm(a), norm(b)).ratio()


def mercado_api(deporte, region="eu"):
    key = os.environ.get("ODDS_API_KEY")
    if not key:
        sys.exit("Falta ODDS_API_KEY para --comparar (gratis en https://the-odds-api.com).")
    q = urllib.parse.urlencode({"apiKey": key, "regions": region, "markets": "h2h", "oddsFormat": "decimal"})
    req = urllib.request.Request(f"https://api.the-odds-api.com/v4/sports/{deporte}/odds?{q}",
                                 headers={"User-Agent": "betano-asistido/1.0"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)


def prob_mercado(ev):
    """Probabilidad de consenso sin margen (promedio de casas, excluye Betano) en orden local, empate, visita."""
    acc, n = [0.0, 0.0, 0.0], 0
    for bk in ev.get("bookmakers", []):
        if "betano" in bk["key"]:
            continue
        for m in bk["markets"]:
            pr = {o["name"]: o["price"] for o in m["outcomes"]}
            orden = [pr.get(ev["home_team"]), pr.get("Draw"), pr.get(ev["away_team"])]
            if None in orden:
                continue
            inv = [1 / x for x in orden]
            s = sum(inv)
            acc = [a + x / s for a, x in zip(acc, inv)]
            n += 1
    return ([a / n for a in acc], n) if n else (None, 0)


def ultimo_export():
    dirs = [Path("/storage/emulated/0/Download"), Path.home() / "Downloads", Path.home() / "Descargas",
            Path(os.environ.get("USERPROFILE", "~")).expanduser() / "Downloads"]
    fs = [f for d in dirs if d.is_dir() for f in d.glob("betano-*.json")]
    return max(fs, key=lambda f: f.stat().st_mtime) if fs else None


def c_bookmarklet(a):
    js = (Path(__file__).with_name("bookmarklet.js")).read_text()
    js = "\n".join(l for l in js.splitlines() if not l.strip().startswith("//"))
    js = re.sub(r"\s*\n\s*", " ", js).strip()
    print("javascript:" + urllib.parse.quote(js, safe="(){}[];:,.=+!'\"/*?&|<>-_ "))


def c_importar(a):
    if a.archivo == "-":
        texto, meta = sys.stdin.read(), {}
    else:
        f = Path(a.archivo) if a.archivo else ultimo_export()
        if not f or not f.exists():
            sys.exit("No hay betano-*.json en Descargas. Usa el bookmarklet o --archivo.")
        raw = f.read_text(encoding="utf-8")
        try:
            meta = json.loads(raw)
            texto = meta.get("texto", "")
        except json.JSONDecodeError:
            texto, meta = raw, {}
        print(f"Archivo: {f}")
    evs = parsear_texto(texto)
    if not evs:
        sys.exit("No reconocí partidos. Pásale el archivo al asistente para calibrar el parser.")
    c, rows = cfg(), registro()
    mercado = mercado_api(a.comparar) if a.comparar else []
    for e in evs:
        r = analisis(e["cuotas"])
        e["margen_pct"] = r["margen_pct"]
        e["cuota_justa"] = [l["cuota_justa"] for l in r["lineas"]]
        e["value"] = []
        if mercado and e["mercado"] == "1X2":
            best = max(mercado, key=lambda m: sim(e["local"], m["home_team"]) + sim(e["visita"], m["away_team"]))
            if sim(e["local"], best["home_team"]) >= 0.6 and sim(e["visita"], best["away_team"]) >= 0.6:
                p, n = prob_mercado(best)
                e["match_api"] = f"{best['home_team']} vs {best['away_team']} ({n} casas)"
                if p:
                    for sel, pi, ci in zip(("Local", "Empate", "Visita"), p, e["cuotas"]):
                        edge = (pi * ci - 1) * 100
                        if edge >= c["edge_min_pct"]:
                            st, k, _ = stake_kelly(pi, ci, c, rows)
                            e["value"].append({"seleccion": sel, "cuota": ci, "p_mercado": round(pi, 4),
                                               "edge_pct": round(edge, 2), "stake": st})
    BASE.mkdir(parents=True, exist_ok=True)
    out = BASE / "importes" / f"{datetime.now():%Y%m%d-%H%M%S}.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps({"url": meta.get("url"), "eventos": evs}, indent=2, ensure_ascii=False))
    print(f"{len(evs)} partidos  (guardado {out})\n")
    for e in sorted(evs, key=lambda e: (-len(e["value"]), e["margen_pct"])):
        cu = " ".join(f"{x:5.2f}" for x in e["cuotas"])
        print(f"{e['local'][:22]:22s} vs {e['visita'][:22]:22s} {cu}  margen {e['margen_pct']:4.1f}%")
        for v in e["value"]:
            print(f"   VALUE {v['seleccion']} @ {v['cuota']}  p_mercado={v['p_mercado']}  "
                  f"edge={v['edge_pct']}%  stake={v['stake']}")
    if a.comparar and not any(e["value"] for e in evs):
        print("\nNingún partido con value contra el consenso del mercado.")


def main():
    ap = argparse.ArgumentParser(description="Asistente betano.pe (sin login, clic final manual)")
    sp = ap.add_subparsers(dest="cmd", required=True)
    s = sp.add_parser("config");  [s.add_argument("--" + k, type=float if k != "moneda" else str) for k in DEF]
    s.set_defaults(f=c_config)
    s = sp.add_parser("analizar"); s.add_argument("--cuotas", type=float, nargs="+", required=True)
    s.add_argument("--prob", type=float, nargs="+", help="tus probabilidades (0-1 o %%), mismo orden"); s.set_defaults(f=c_analizar)
    s = sp.add_parser("boleto")
    for n in ("evento", "mercado", "seleccion"):
        s.add_argument("--" + n, required=True)
    s.add_argument("--cuota", type=float, required=True); s.add_argument("--prob", type=float, required=True)
    s.add_argument("--stake", type=float); s.add_argument("--url")
    s.add_argument("--abrir", action="store_true"); s.add_argument("--forzar", action="store_true"); s.set_defaults(f=c_boleto)
    s = sp.add_parser("confirmar"); s.add_argument("id"); s.add_argument("--cuota-real", type=float)
    s.add_argument("--stake", type=float); s.set_defaults(f=c_confirmar)
    s = sp.add_parser("resultado"); s.add_argument("id"); s.add_argument("estado", choices=["ganada", "perdida", "nula"])
    s.set_defaults(f=c_resultado)
    s = sp.add_parser("resumen"); s.set_defaults(f=c_resumen)
    s = sp.add_parser("odds"); s.add_argument("--deporte", default="soccer_conmebol_copa_libertadores")
    s.add_argument("--region", default="eu"); s.add_argument("--mercado", default="h2h"); s.add_argument("--max", type=int, default=10)
    s.set_defaults(f=c_odds_api)
    s = sp.add_parser("bookmarklet", help="imprime el javascript: para guardar como marcador"); s.set_defaults(f=c_bookmarklet)
    s = sp.add_parser("importar", help="analiza el export del bookmarklet (último en Descargas) o texto pegado")
    s.add_argument("--archivo", help="ruta .json/.txt, o - para stdin")
    s.add_argument("--comparar", metavar="DEPORTE", help="clave de The Odds API, p.ej. soccer_epl")
    s.set_defaults(f=c_importar)
    a = ap.parse_args()
    a.f(a)


if __name__ == "__main__":
    main()
