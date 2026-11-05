#!/usr/bin/env python3
"""Clasifica archivos universitarios por curso (Sxx/Curso) y los sube a Google Drive con rclone.
Funciona en Android (Termux/proot), Linux y Windows: detecta rutas solo.

Por defecto es prueba en seco: genera plan.tsv y plan.md, no sube nada.
  --subir          ejecuta la subida (rclone copyto --ignore-existing: nunca sobrescribe ni borra)
  --refrescar      vuelve a listar Drive (carpetas y MD5) aunque haya cache
  --solo RUTA      clasifica solo esa carpeta/archivo local (p.ej. un trabajo nuevo)
  --local RUTA     carpeta local raíz (con Sxx_Semestre/, 98_Por_Clasificar/…)  [env DRIVE_CURSOS_LOCAL]
  --remoto R:RUTA  carpeta de Drive en rclone                                  [env DRIVE_CURSOS_REMOTO]
  --trabajo RUTA   dónde guardar cache, plan y log                              [env DRIVE_CURSOS_TRABAJO]
  --diagnostico    muestra rutas detectadas y herramientas disponibles, y sale
Nunca borra ni mueve nada en local.
"""
import argparse, datetime as dt, hashlib, os, platform, re, shutil, subprocess, sys, unicodedata, zipfile
from collections import defaultdict

CARPETA = "Universidad_FIME"
HOME = os.path.expanduser("~")

def detectar_local():
    cands = ["/storage/emulated/0/Documents", "/sdcard/Documents"]               # Android
    cands += [os.path.join(HOME, d) for d in ("Documents", "Documentos", "OneDrive/Documents",
                                              "OneDrive/Documentos", "storage/shared/Documents")]
    if os.environ.get("USERPROFILE"):                                            # Windows
        cands += [os.path.join(os.environ["USERPROFILE"], d) for d in ("Documents", "Documentos", "OneDrive\\Documents")]
    for c in cands:
        if os.path.isdir(os.path.join(c, CARPETA)):
            return os.path.join(c, CARPETA)
    return None

def detectar_remoto():
    if not shutil.which("rclone"):
        return None
    remotos = subprocess.run(["rclone", "listremotes"], capture_output=True, text=True).stdout.split()
    r = "gdrive:" if "gdrive:" in remotos else next((x for x in remotos if "drive" in x.lower()), None)
    return r and r + "01_Universidad_FIME"

def detectar_trabajo():
    viejo = os.path.join(HOME, "reorg_cel", "drive_cursos")                      # compatibilidad celular
    return viejo if os.path.isdir(viejo) else os.path.join(HOME, ".drive-cursos")

LOCAL = REMOTE = WORK = None
HAY_PDFTOTEXT = bool(shutil.which("pdftotext"))
SIN = "98_Por_Clasificar/Desde_celular_" + dt.date.today().strftime("%Y-%m")
BASURA = re.compile(r"\.(aux|log|out|toc|fls|fdb_latexmk|synctex\.gz|bbl|bcf|blg|run\.xml|nav|snm)$|^~\$|^\.", re.I)

# Semestre por fecha de modificación (S09 = 2026-II). Solo desempata.
SEM = [("S06", "2025-03", "2025-07"), ("S07", "2025-08", "2026-01"),
       ("S08", "2026-03", "2026-07"), ("S09", "2026-08", "2027-01")]

# Frases clave por curso (clave = nombre normalizado de la carpeta en Drive). +2 pts por frase.
KW = {
 "centrales termoelectricas": ["termoelectrica", "caldero", "calderos", "acuotubular", "pirotubular", "geotermica", "ciclo rankine", "ciclo brayton", "ciclo combinado", "turbina de vapor"],
 "centrales hidroelectricas": ["hidroelectrica", "microcentral", "central hidraulica", "bocatoma", "camara de carga", "tuberia forzada"],
 "analisis de sistemas de potencia": ["sistemas de potencia", "flujo de potencia", "cortocircuito", "por unidad", "barra slack"],
 "ingenieria de mantenimiento": ["mantenimiento preventivo", "mantenimiento predictivo", "mantenimiento correctivo", "confiabilidad", "mtbf"],
 "instalaciones electricas ii": ["instalaciones electricas", "puesta a tierra", "metrado", "baja tension", "codigo nacional de electricidad", "tablero de distribucion"],
 "instalaciones electricas i": ["instalaciones electricas", "puesta a tierra", "metrado", "baja tension", "codigo nacional de electricidad", "tablero de distribucion"],
 "metodologia de la investigacion": ["metodologia de la investigacion", "marco teorico", "hipotesis", "anova", "estadistica"],
 "sistemas de refrigeracion y calefaccion": ["refrigeracion", "refrigerante", "calefaccion", "compresion de vapor", "evaporador"],
 "electronica de potencia": ["electronica de potencia", "inversor", "convertidor", "rectificador", "tiristor", "igbt", "pwm"],
 "maquinas electricas ii": ["maquina sincrona", "motor de induccion", "generador sincrono"],
 "maquinas electricas i": ["transformador", "chapman", "circuito magnetico"],
 "maquinas termicas ii": ["turbina de gas", "compresor axial"],
 "maquinas termicas i": ["motor de combustion interna", "ciclo otto", "ciclo diesel"],
 "turbomaquinas": ["turbomaquina", "pelton", "francis", "kaplan", "bomba centrifuga", "bombas centrifugas"],
 "transferencia de calor": ["transferencia de calor", "conduccion", "conveccion", "aleta"],
 "dinamica de gases": ["dinamica de gases", "flujo compresible", "numero de mach", "tobera"],
 "control de procesos ii": ["control de procesos", "controlador pid", "lugar de las raices"],
 "control de procesos i": ["control de procesos", "funcion de transferencia"],
 "medidas electricas": ["medidas electricas", "vatimetro"],
 "analisis de circuitos electricos ii": ["fasores", "circuitos trifasicos"],
 "teoria de maquinas y mecanismos": ["mecanismo", "eslabon", "levas", "engranajes"],
 "mecanica de fluidos": ["mecanica de fluidos", "bernoulli"],
}
SUB = [(r"examen|parcial|solucionario|recuperacion|evaluacion", "06_Examenes_y_Evaluaciones"),
       (r"laboratorio|practica de lab|guia de lab", "04_Practicas_y_Laboratorios"),
       (r"silabo|planificacion", "01_Silabo_y_Planificacion"),
       (r"informe|trabajo|tarea|proyecto|sustentacion|temario|monografia", "05_Tareas_y_Proyectos")]

def norm(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", " ", s).strip()

def rclone(*a):
    return subprocess.run(["rclone", *a], capture_output=True, text=True).stdout

def md5(p):
    h = hashlib.md5()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()

def texto(p):
    ext = p.lower().rsplit(".", 1)[-1]
    try:
        if ext == "pdf":
            if not HAY_PDFTOTEXT:
                return ""
            return subprocess.run(["pdftotext", "-l", "3", p, "-"], capture_output=True, text=True, timeout=60).stdout
        if ext in ("docx", "pptx", "xlsx"):
            with zipfile.ZipFile(p) as z:
                xs = [n for n in z.namelist() if re.match(r"(word/document|ppt/slides/slide\d+|xl/sharedStrings)\.xml$", n)]
                return re.sub(r"<[^>]+>", " ", " ".join(z.read(n).decode("utf8", "ignore") for n in xs[:10]))
        if ext in ("tex", "md", "txt", "csv"):
            return open(p, errors="ignore").read(20000)
    except Exception:
        pass
    return ""

def semestre(p):
    m = dt.datetime.fromtimestamp(os.path.getmtime(p)).strftime("%Y-%m")
    return next((s for s, a, b in SEM if a <= m <= b), None)

def cargar_drive(refrescar):
    os.makedirs(WORK, exist_ok=True)
    fd, fm = os.path.join(WORK, "drive_dirs.txt"), os.path.join(WORK, "drive_md5.txt")
    if refrescar or not os.path.exists(fd):
        print("Listando carpetas de Drive…", file=sys.stderr)
        open(fd, "w").write(rclone("lsf", "--dirs-only", "-R", "--max-depth", "3", REMOTE))
    if refrescar or not os.path.exists(fm):
        print("Calculando MD5 de Drive (puede tardar)…", file=sys.stderr)
        open(fm, "w").write(rclone("md5sum", REMOTE))
    dirs = [l.strip().rstrip("/") for l in open(fd) if l.strip()]
    cursos = {}   # nombre normalizado -> "Sxx_Semestre/Curso"
    subdirs = defaultdict(set)
    for d in dirs:
        parts = d.split("/")
        if re.match(r"S\d\d_Semestre$", parts[0]) and len(parts) == 2:
            cursos[norm(parts[1])] = d
        if len(parts) == 3:
            subdirs["/".join(parts[:2])].add(parts[2])
    hashes = {l[:32] for l in open(fm) if re.match(r"[0-9a-f]{32}  ", l)}
    return cursos, subdirs, hashes

def clasificar(p, cursos):
    nombre = norm(os.path.basename(p))
    t = norm(texto(p))[:15000]
    score = {}
    for c in cursos:
        s = 0
        pat = r"\b" + re.escape(c) + r"\b"
        if re.search(pat, nombre): s += 10
        # Nombre del curso en el texto: solo cursos de 2+ palabras y solo al inicio (carátula/encabezado).
        if " " in c and re.search(pat, t[:3000]): s += 8
        for kw in KW.get(c, []):
            if re.search(r"\b" + re.escape(kw) + r"\b", t + " " + nombre): s += 2
        if s: score[c] = s
    if not score:
        return None, 0, t
    sem = semestre(p)
    orden = sorted(score.items(), key=lambda x: (-x[1], not (sem and cursos[x[0]].startswith(sem))))
    (c1, s1), s2 = orden[0], (orden[1][1] if len(orden) > 1 else 0)
    if s1 < 4:
        return None, s1, t
    if s1 == s2 and not (sem and cursos[c1].startswith(sem)):
        return None, s1, t
    return cursos[c1], s1, t

def subcarpeta(dest_curso, nombre_texto, subdirs):
    for pat, sd in SUB:
        if re.search(pat, nombre_texto) and sd in subdirs.get(dest_curso, ()):
            return sd
    return "02_Teoria_y_Diapositivas" if "02_Teoria_y_Diapositivas" in subdirs.get(dest_curso, ()) else ""

def plan(raiz, cursos, subdirs, hashes):
    # excepciones.tsv: "ruta_local<TAB>destino_en_drive" (destino vacío = 98_Por_Clasificar)
    fe = os.path.join(WORK, "excepciones.tsv")
    excep = dict((l.rstrip("\n").split("\t") + [""])[:2] for l in open(fe) if l.strip()) if os.path.exists(fe) else {}
    filas = []
    for dp, dns, fns in os.walk(raiz):
        dns[:] = [d for d in dns if not d.startswith(".")]
        for f in sorted(fns):
            p = os.path.join(dp, f)
            rel = os.path.relpath(p, LOCAL).replace(os.sep, "/")
            parts = rel.split("/")
            if BASURA.search(f):
                filas.append((rel, "", "OMITIR_TEMPORAL", "")); continue
            h = md5(p)
            if h in hashes:
                filas.append((rel, "", "YA_EN_DRIVE", "")); continue
            top = parts[0]
            if re.match(r"S\d\d_Semestre$", top) and len(parts) >= 3:
                curso = next((v for k, v in cursos.items() if v.startswith(top + "/") and k == norm(parts[1])), None)
                if curso:
                    filas.append((rel, curso + "/" + "/".join(parts[2:]), "SUBIR", "carpeta local")); continue
            if top in ("00_Admin", "00_Plantillas_LaTeX", "99_Personal"):
                filas.append((rel, rel, "SUBIR", "misma ruta")); continue
            # 98_Por_Clasificar o curso sin carpeta: clasificar por contenido.
            # Proyectos dentro de subcarpetas (Download_*, comprimidos) van juntos a 98.
            if top == "98_Por_Clasificar" and len(parts) > 3:
                filas.append((rel, SIN + "/" + "/".join(parts[1:]), "SUBIR", "proyecto agrupado")); continue
            if rel in excep:
                filas.append((rel, excep[rel] or SIN + "/" + "/".join(parts[1:]), "SUBIR", "excepcion manual")); continue
            curso, s, t = clasificar(p, cursos)
            if curso:
                sd = subcarpeta(curso, norm(f) + " " + t[:600], subdirs)
                filas.append((rel, "/".join(x for x in (curso, sd, f) if x), "SUBIR", f"contenido ({s} pts)"))
            else:
                filas.append((rel, SIN + "/" + "/".join(parts[1:] if top == "98_Por_Clasificar" else parts), "SUBIR", "sin curso claro"))
    return filas

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--subir", action="store_true")
    ap.add_argument("--refrescar", action="store_true")
    ap.add_argument("--solo")
    ap.add_argument("--local")
    ap.add_argument("--remoto")
    ap.add_argument("--trabajo")
    ap.add_argument("--diagnostico", action="store_true")
    a = ap.parse_args()
    global LOCAL, REMOTE, WORK
    LOCAL = a.local or os.environ.get("DRIVE_CURSOS_LOCAL") or detectar_local()
    REMOTE = a.remoto or os.environ.get("DRIVE_CURSOS_REMOTO") or detectar_remoto()
    WORK = a.trabajo or os.environ.get("DRIVE_CURSOS_TRABAJO") or detectar_trabajo()
    if a.diagnostico or not LOCAL or not REMOTE:
        print(f"Sistema:    {platform.system()} {platform.machine()}")
        print(f"Local:      {LOCAL or 'NO ENCONTRADO -> usa --local RUTA (carpeta que contiene Sxx_Semestre/)'}")
        print(f"Remoto:     {REMOTE or 'NO ENCONTRADO -> instala/configura rclone (rclone config) o usa --remoto'}")
        print(f"Trabajo:    {WORK}")
        print(f"pdftotext:  {'sí' if HAY_PDFTOTEXT else 'no (los PDF se clasifican solo por nombre; instala poppler-utils)'}")
        sys.exit(0 if (LOCAL and REMOTE) else 1)
    if not HAY_PDFTOTEXT:
        print("Aviso: sin pdftotext, los PDF se clasifican solo por nombre.", file=sys.stderr)
    cursos, subdirs, hashes = cargar_drive(a.refrescar)
    filas = plan(os.path.abspath(a.solo) if a.solo else LOCAL, cursos, subdirs, hashes)
    with open(os.path.join(WORK, "plan.tsv"), "w") as f:
        for r in filas: f.write("\t".join(r) + "\n")
    cnt = defaultdict(int)
    for r in filas: cnt[r[2]] += 1
    with open(os.path.join(WORK, "plan.md"), "w") as f:
        f.write("| Local | Destino en Drive | Estado | Motivo |\n|---|---|---|---|\n")
        for r in filas: f.write("| " + " | ".join(r) + " |\n")
    print(dict(cnt))
    print("Plan:", os.path.join(WORK, "plan.md"))
    if not a.subir:
        print("Prueba en seco. Usa --subir para ejecutar."); return
    sub = [r for r in filas if r[2] == "SUBIR"]
    log = os.path.join(WORK, "subida.log")
    for i, (rel, dest, _, _) in enumerate(sub, 1):
        # Si ya hay otro archivo con ese nombre (contenido distinto: el MD5 no coincidió), renombrar con sufijo
        base, ext = os.path.splitext(dest)
        n = 1
        while subprocess.run(["rclone", "lsf", REMOTE + "/" + dest], capture_output=True, text=True).stdout.strip():
            n += 1
            dest = f"{base}_celular{'' if n == 2 else n - 1}{ext}"
        print(f"[{i}/{len(sub)}] {rel} -> {dest}", flush=True)
        subprocess.run(["rclone", "copyto", "--ignore-existing", "--tpslimit", "8", "--retries", "3",
                        "--log-file", log, "-v", os.path.join(LOCAL, *rel.split("/")), REMOTE + "/" + dest])
    print("FIN SUBIDA")

if __name__ == "__main__":
    main()
