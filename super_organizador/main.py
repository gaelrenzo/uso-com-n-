import sys
import pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import argparse
import yaml
import logging
import csv
import os
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

from core.scanner import Scanner
from core.tree_generator import build_tree, save_tree_txt, save_tree_markdown, save_tree_json
from core.inventory import generate_inventory, save_inventory_csv, save_inventory_json
from core.problem_detector import ProblemDetector
from core.duplicate_detector import DuplicateDetector
from core.classifier import Classifier
from core.ai_classifier import AIClassifier
from core.planner import Planner
from core.category_suggester import CategorySuggester
from core.executor import Executor
from core.rollback import Rollback

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).parent
CFG_PATH = BASE_DIR / "config.yaml"
REPORTS_DIR = BASE_DIR / "reports"
LOGS_DIR = BASE_DIR / "logs"
DATA_DIR = BASE_DIR / "data"


def load_config():
    with open(CFG_PATH, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def get_root_path(cfg):
    env_root = os.getenv("ROOT_PATH")
    if env_root:
        return Path(env_root)
    return Path(cfg.get("root_path", "."))


def parse_args():
    parser = argparse.ArgumentParser(description="Super Organizador Inteligente - analiza y organiza cualquier unidad/directorio")
    parser.add_argument("--path", "-p", type=str, help="Ruta a analizar (sobreescribe config.yaml y .env)")
    return parser.parse_args()


def ensure_dirs():
    REPORTS_DIR.mkdir(exist_ok=True)
    LOGS_DIR.mkdir(exist_ok=True)


def menu():
    cfg = load_config()
    args = parse_args()
    root = Path(args.path) if args.path else get_root_path(cfg)
    root = root.resolve()
    sim = cfg.get("simulation_mode", True)
    target_name = f"{root.name}_ORGANIZADO"
    ensure_dirs()
    scanned = []
    inventory = []
    dynamic_categories = []
    provider = cfg.get("ai_provider", "none")

    while True:
        print()
        print("=" * 58)
        print("  SUPER ORGANIZADOR INTELIGENTE DE ARCHIVOS")
        print("=" * 58)
        print(f"  Ruta: {root}")
        print(f"  Destino: {root / target_name}")
        print(f"  Modo: {'SIMULACION' if sim else 'REAL'}")
        print(f"  IA: {provider}")
        print("-" * 58)
        print("  [1]  Analizar directorio")
        print("  [2]  Generar arbol")
        print("  [3]  Crear inventario")
        print("  [4]  Detectar problemas")
        print("  [5]  Analizar con IA")
        print("  [6]  Generar plan de organizacion")
        print("  [7]  Revisar plan")
        print("  [8]  Ejecutar movimientos aprobados")
        print("  [9]  Deshacer ultima organizacion")
        print("  [10] Crear estructura propuesta")
        print("  [11] Analizar y sugerir estructura con IA")
        print("  [12] Salir")
        print("-" * 58)
        op = input("  Opcion: ").strip()

        if op == "1":
            max_depth = cfg.get("max_depth", 10)
            max_items = cfg.get("max_items", 50000)
            include_hidden = cfg.get("include_hidden", False)
            print(f"\nEscaneando {root}...")
            s = Scanner(root, max_depth, max_items, include_hidden)
            scanned = s.scan()
            inventory = generate_inventory(scanned, root)
            print(f"Encontrados: {len(scanned)} elementos")

        elif op == "2":
            if not scanned:
                print("Primero ejecute opcion 1")
                continue
            tree = build_tree(scanned, root)
            save_tree_txt(tree, REPORTS_DIR / "arbol.txt")
            save_tree_markdown(tree, REPORTS_DIR / "arbol.md")
            save_tree_json(tree, REPORTS_DIR / "arbol.json")
            print("Arbol generado en reports/")

        elif op == "3":
            if not inventory:
                print("Primero ejecute opcion 1")
                continue
            save_inventory_csv(inventory, REPORTS_DIR / "inventario_archivos.csv")
            save_inventory_json(inventory, REPORTS_DIR / "inventario_archivos.json")
            print(f"Inventario: {len(inventory)} elementos")

        elif op == "4":
            if not scanned:
                print("Primero ejecute opcion 1")
                continue
            detector = ProblemDetector(DATA_DIR / "ignored_patterns.yaml")
            problems = detector.detect(scanned, root)
            dup = DuplicateDetector()
            exact = dup.find_exact_duplicates(scanned)
            possible = dup.find_possible_duplicates(scanned)
            print(f"\nProblemas: {len(problems)}")
            for p in problems[:20]:
                print(f"  [{p['tipo']}] {p['nombre']}")
            if exact:
                print(f"\nDuplicados exactos: {len(exact)}")
            if possible:
                print(f"Posibles duplicados: {len(possible)}")
            if problems:
                with open(REPORTS_DIR / "problemas.csv", "w", newline="", encoding="utf-8") as f:
                    w = csv.DictWriter(f, fieldnames=["ruta", "nombre", "tipo", "descripcion"])
                    w.writeheader(); w.writerows(problems)
            if exact:
                with open(REPORTS_DIR / "duplicados_exactos.csv", "w", newline="", encoding="utf-8") as f:
                    w = csv.DictWriter(f, fieldnames=["archivo_1", "archivo_2", "hash", "tamano"])
                    w.writeheader(); w.writerows(exact)
            if possible:
                with open(REPORTS_DIR / "posibles_duplicados.csv", "w", newline="", encoding="utf-8") as f:
                    w = csv.DictWriter(f, fieldnames=["archivo_1", "archivo_2", "similitud", "diferencia_tamano"])
                    w.writeheader(); w.writerows(possible)

        elif op == "5":
            provider = cfg.get("ai_provider", "none")
            if provider == "none":
                print("IA no configurada. Edite config.yaml o .env")
                continue
            ai = AIClassifier(provider=provider)
            if not inventory:
                print("Primero ejecute opcion 1")
                continue
            count = 0
            for entry in inventory:
                if entry.get("confianza", 0) < 0.75:
                    r = ai.classify(entry["nombre"], entry["ruta_relativa"], entry["extension"])
                    if r.get("categoria"):
                        entry["categoria_sugerida"] = r["categoria"]
                        entry["confianza"] = r["confianza"]
                        count += 1
            print(f"IA clasifico {count} elementos")

        elif op == "6":
            if not inventory:
                print("Primero ejecute opcion 1")
                continue
            clf = Classifier(DATA_DIR / "keywords.yaml", DATA_DIR / "categories.yaml")
            threshold = cfg.get("confidence_threshold", 0.90)
            target = root / target_name
            planner = Planner(clf, target, threshold, dynamic_categories or None)
            entries = planner.generate_plan(scanned, inventory)
            planner.save_plan_csv(entries, REPORTS_DIR / "plan_movimientos.csv")
            planner.save_plan_md(entries, REPORTS_DIR / "PLAN_ORGANIZACION.md")
            auto = sum(1 for e in entries if e["accion"] == "mover")
            rev = sum(1 for e in entries if e["accion"] == "revisar")
            print(f"Plan: {auto} movimientos, {rev} revision manual")
            print("Edite reports/plan_movimientos.csv columna 'aprobado' a SI")

        elif op == "7":
            plan_path = REPORTS_DIR / "plan_movimientos.csv"
            if not plan_path.exists():
                print("Primero ejecute opcion 6")
                continue
            with open(plan_path, "r", encoding="utf-8") as f:
                reader = list(csv.DictReader(f))
            approved = sum(1 for r in reader if r["aprobado"].strip().upper() == "SI")
            print(f"Total: {len(reader)} | Aprobados: {approved} | Pendientes: {len(reader)-approved}")

        elif op == "8":
            plan_path = REPORTS_DIR / "plan_movimientos.csv"
            if not plan_path.exists():
                print("Primero ejecute opcion 6")
                continue
            with open(plan_path, "r", encoding="utf-8") as f:
                plan = list(csv.DictReader(f))
            approved = [p for p in plan if p["aprobado"].strip().upper() == "SI" and p["accion"] == "mover"]
            if not approved:
                print("No hay movimientos aprobados")
                continue
            if not sim:
                print(f"\nADVERTENCIA: {len(approved)} movimientos REALES")
                confirm = input("Frase de seguridad: ").strip()
                expected = cfg.get("confirmation_phrase", "CONFIRMO ORGANIZAR MIS ARCHIVOS")
                if confirm != expected:
                    print("Cancelado")
                    continue
            ts = datetime.now().strftime("%Y%m%d_%H%M%S")
            log_path = LOGS_DIR / f"movimientos_{ts}.csv"
            ex = Executor(simulation_mode=sim, max_moves=cfg.get("max_moves_per_run", 50))
            results = ex.execute_plan(plan, log_path)
            ok = sum(1 for r in results if r["resultado"] == "OK")
            sim_c = sum(1 for r in results if r["resultado"] == "SIMULACION")
            err = sum(1 for r in results if r["resultado"] == "ERROR")
            print(f"OK={ok} Sim={sim_c} Err={err}")

        elif op == "9":
            logs = sorted(LOGS_DIR.glob("movimientos_*.csv"))
            if not logs:
                print("No hay logs")
                continue
            print("Logs:")
            for i, l in enumerate(logs, 1):
                print(f"  [{i}] {l.name}")
            sel = input("Numero (default=1): ").strip()
            idx = int(sel) - 1 if sel.isdigit() else 0
            idx = max(0, min(idx, len(logs) - 1))
            rb = Rollback(simulation_mode=sim)
            results = rb.rollback(logs[idx])
            print(f"Procesados: {len(results)}")

        elif op == "10":
            target = root / target_name
            if dynamic_categories:
                base = [c["name"] for c in dynamic_categories]
            else:
                cats = cfg.get("categories", [])
                if not cats:
                    base = ["00_INBOX", "01_UNIVERSIDAD", "02_PROYECTOS_TECNICOS",
                            "03_SOFTWARE_Y_HERRAMIENTAS", "04_CARRERA_PROFESIONAL",
                            "05_EVENTOS_Y_ORGANIZACIONES", "06_RECURSOS_Y_BIBLIOTECA",
                            "07_PERSONAL", "90_COMPARTIDOS", "98_COPIAS_DE_SEGURIDAD",
                            "99_ARCHIVO_HISTORICO", "00_REVISAR_MANUALMENTE"]
                else:
                    base = [c["path"].split("/")[1] for c in cats if "/" in c.get("path", "")]
            if sim:
                print("Estructura propuesta:")
                for s in base:
                    print(f"  {target / s}")
            else:
                for s in base:
                    (target / s).mkdir(parents=True, exist_ok=True)
                print("Estructura creada")

        elif op == "11":
            if not scanned:
                print("Primero ejecute opcion 1")
                continue
            if provider == "none":
                print("IA no configurada. Configure ai_provider en config.yaml y .env")
                continue
            print("\nAnalizando estructura con IA para sugerir organizacion...")
            suggester = CategorySuggester(provider=provider)
            dynamic_categories = suggester.suggest_categories(scanned, root, inventory)
            if not dynamic_categories:
                print("No se pudieron generar categorias. Usando defaults.")
                continue
            print(f"\nCategorias sugeridas ({len(dynamic_categories)}):")
            for c in dynamic_categories:
                print(f"  - {c['name']}/  ({c.get('desc', '')})")
            save = input("\nGuardar estructura propuesta? (s/N): ").strip().lower()
            if save == "s":
                target = root / target_name
                for c in dynamic_categories:
                    (target / c["name"]).mkdir(parents=True, exist_ok=True)
                print(f"Estructura creada en {target}")

        elif op == "12":
            print("Hasta luego!")
            break


if __name__ == "__main__":
    menu()