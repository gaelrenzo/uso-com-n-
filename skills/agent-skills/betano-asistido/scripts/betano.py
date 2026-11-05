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
    a = ap.parse_args()
    a.f(a)


if __name__ == "__main__":
    main()
