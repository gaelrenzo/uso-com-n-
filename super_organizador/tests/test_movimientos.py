import csv, errno, os, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))
import pytest
import main
from core import ai_classifier, category_suggester, executor as executor_mod
from core.ai_classifier import AIClassifier
from core.category_suggester import CategorySuggester
from core.classifier import Classifier
from core.executor import Executor, sha256_file
from core.inventory import generate_inventory
from core.planner import Planner
from core.rollback import Rollback
from core.scanner import Scanner
from core.storage import archive_reports, storage_dir

DATA = pathlib.Path(__file__).parent.parent / "data"


def mover(origen, destino):
    return {"aprobado": "SI", "accion": "mover", "origen": str(origen), "destino": str(destino), "tipo": "archivo"}


def filas(log):
    with open(log, encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def test_movimiento_real_y_rollback(tmp_path):
    src = tmp_path / "a.txt"
    src.write_text("contenido")
    dst = tmp_path / "dst" / "a.txt"
    log = tmp_path / "log.csv"
    result = Executor(simulation_mode=False).execute_plan([mover(src, dst)], log)[0]
    assert result["resultado"] == "OK"
    assert not src.exists() and dst.read_text() == "contenido"
    assert result["hash_antes"] == result["hash_despues"] == sha256_file(dst)
    assert Rollback(simulation_mode=False).rollback(log)[0]["resultado"] == "OK"
    assert src.exists() and not dst.exists()


def test_colision_conserva_ambos_y_rollback_usa_destino_real(tmp_path):
    src = tmp_path / "a.txt"
    src.write_text("nuevo")
    dst = tmp_path / "dst" / "a.txt"
    dst.parent.mkdir()
    dst.write_text("viejo")
    log = tmp_path / "log.csv"
    Executor(simulation_mode=False).execute_plan([mover(src, dst)], log)
    assert dst.read_text() == "viejo"
    assert (dst.parent / "a_001.txt").read_text() == "nuevo"
    Rollback(simulation_mode=False).rollback(log)
    assert src.read_text() == "nuevo" and dst.read_text() == "viejo"


def test_interrupcion_deja_log_para_deshacer(tmp_path, monkeypatch):
    srcs = [tmp_path / f"{n}.txt" for n in "123"]
    for s in srcs:
        s.write_text(s.name)
    real = os.rename
    llamadas = []

    def rename(a, b):
        llamadas.append(a)
        if len(llamadas) == 3:
            raise KeyboardInterrupt
        real(a, b)

    monkeypatch.setattr(executor_mod.os, "rename", rename)
    log = tmp_path / "log.csv"
    plan = [mover(s, tmp_path / "dst" / s.name) for s in srcs]
    with pytest.raises(KeyboardInterrupt):
        Executor(simulation_mode=False).execute_plan(plan, log)
    monkeypatch.undo()
    assert len(filas(log)) == 2
    Rollback(simulation_mode=False).rollback(log)
    assert all(s.exists() for s in srcs)


def test_origen_igual_destino_no_renombra(tmp_path):
    f = tmp_path / "x.txt"
    f.write_text("x")
    result = Executor(simulation_mode=False).execute_plan([mover(f, f)], tmp_path / "log.csv")[0]
    assert result["resultado"] == "OMITIDO"
    assert [p.name for p in tmp_path.glob("x*")] == ["x.txt"]


def exdev(*args):
    raise OSError(errno.EXDEV, "cross-device")


def test_entre_discos_copia_verificada(tmp_path, monkeypatch):
    src = tmp_path / "a.txt"
    src.write_text("x")
    dst = tmp_path / "b.txt"
    monkeypatch.setattr(executor_mod.os, "rename", exdev)
    result = Executor(simulation_mode=False).execute_plan([mover(src, dst)], tmp_path / "log.csv")[0]
    assert result["resultado"] == "OK" and not src.exists() and dst.exists()


def test_copia_corrupta_conserva_origen(tmp_path, monkeypatch):
    src = tmp_path / "a.txt"
    src.write_text("x")
    dst = tmp_path / "b.txt"
    monkeypatch.setattr(executor_mod.os, "rename", exdev)
    monkeypatch.setattr(executor_mod.shutil, "copy2", lambda a, b: pathlib.Path(b).write_text("corrupto"))
    result = Executor(simulation_mode=False).execute_plan([mover(src, dst)], tmp_path / "log.csv")[0]
    assert result["resultado"] == "ERROR"
    assert src.read_text() == "x" and not dst.exists()


def test_rollback_ignora_simulados_y_omitidos(tmp_path):
    src = tmp_path / "a.txt"
    src.write_text("x")
    log = tmp_path / "log.csv"
    Executor(simulation_mode=True).execute_plan([mover(src, tmp_path / "b.txt")], log)
    assert Rollback(simulation_mode=False).rollback(log) == []


def test_logs_mas_reciente_primero(tmp_path):
    for n in ("movimientos_20260101_000000.csv", "movimientos_20261030_000000.csv", "simulacion_20261231_000000.csv"):
        (tmp_path / n).write_text("")
    assert [p.name for p in Rollback.list_logs(tmp_path)] == [
        "movimientos_20261030_000000.csv", "movimientos_20260101_000000.csv",
    ]


def test_scanner_no_sigue_symlinks(tmp_path):
    raiz = tmp_path / "raiz"
    fuera = tmp_path / "fuera"
    raiz.mkdir(); fuera.mkdir()
    (fuera / "secreto.txt").write_text("s")
    (raiz / "enlace").symlink_to(fuera)
    (raiz / "real.txt").write_text("r")
    assert [i.name for i in Scanner(raiz).scan()] == ["real.txt"]


def test_scanner_excluye_destino(tmp_path):
    (tmp_path / "x_ORGANIZADO" / "cat").mkdir(parents=True)
    (tmp_path / "x_ORGANIZADO" / "cat" / "ya.txt").write_text("y")
    (tmp_path / "nuevo.txt").write_text("n")
    items = Scanner(tmp_path, exclude=[tmp_path / "x_ORGANIZADO"]).scan()
    assert [i.name for i in items] == ["nuevo.txt"]


def test_planner_no_planifica_carpetas(tmp_path):
    carpeta = tmp_path / "Turbomaquinas"
    carpeta.mkdir()
    (carpeta / "informe_turbomaquinas.pdf").write_text("x")
    items = Scanner(tmp_path).scan()
    clf = Classifier(DATA / "keywords.yaml", DATA / "categories.yaml")
    plan = Planner(clf, tmp_path / "dst", 0.5).generate_plan(items, generate_inventory(items, tmp_path))
    assert [p["tipo"] for p in plan] == ["archivo"]
    assert plan[0]["accion"] == "mover"


def test_planner_usa_sugerencia_de_ia():
    clf = Classifier(DATA / "keywords.yaml", DATA / "categories.yaml")
    entry = {
        "nombre": "z.bin", "ruta_relativa": "z.bin", "extension": ".bin", "carpeta_padre": "",
        "tipo": "archivo", "ruta_absoluta": "/o/z.bin", "categoria_sugerida": "07_PERSONAL",
        "confianza": 0.95, "motivos": ["por IA"],
    }
    plan = Planner(clf, pathlib.Path("/dst"), 0.9).generate_plan([], [entry])
    assert plan[0]["categoria"] == "07_PERSONAL" and plan[0]["accion"] == "mover"


class Respuesta:
    def __init__(self):
        self.url = None

    def raise_for_status(self):
        pass

    def json(self):
        return {"candidates": [{"content": {"parts": [{"text": '{"categoria": "A", "confianza": 2, "motivos": "m"}'}]}}]}


def captura_post(monkeypatch):
    llamadas = []

    def post(url, **kwargs):
        llamadas.append((url, kwargs))
        return Respuesta()

    monkeypatch.setattr("requests.post", post)
    monkeypatch.setenv("GEMINI_API_KEY", "CLAVE")
    return llamadas


def test_gemini_no_pone_clave_en_url(monkeypatch):
    llamadas = captura_post(monkeypatch)
    AIClassifier(provider="gemini", model="m").classify("a.txt")
    CategorySuggester(provider="gemini", model="m")._query_gemini("p")
    for url, kwargs in llamadas:
        assert "CLAVE" not in url
        assert kwargs["headers"]["x-goog-api-key"] == "CLAVE"
    assert "/models/m:" in llamadas[0][0]


def test_ia_valida_respuesta(monkeypatch):
    captura_post(monkeypatch)
    ia = AIClassifier(provider="gemini", model="m")
    r = ia.classify("a.txt", categories=["A"])
    assert r == {"categoria": "A", "confianza": 1.0, "motivos": ["m"]}
    assert ia.classify("a.txt", categories=["B"])["categoria"] == ""


def test_ajustes_ia_desde_entorno_y_config(monkeypatch):
    monkeypatch.delenv("AI_PROVIDER", raising=False)
    monkeypatch.delenv("AI_MODEL", raising=False)
    cfg = {"ai_provider": "ollama", "ai_model": "m", "ai_api_url": "http://x"}
    assert main.get_ai_settings(cfg) == ("ollama", "m", "http://x")
    monkeypatch.setenv("AI_PROVIDER", "gemini")
    assert main.get_ai_settings(cfg)[0] == "gemini"


def test_reportes_fuera_del_repo(tmp_path, monkeypatch):
    monkeypatch.delenv("ORGANIZADOR_DIR", raising=False)
    monkeypatch.delenv("UCN_DATA_DIR", raising=False)
    assert storage_dir(tmp_path) == tmp_path
    monkeypatch.setenv("UCN_DATA_DIR", "/datos")
    assert storage_dir(tmp_path) == pathlib.Path("/datos/organizador")
    monkeypatch.setenv("ORGANIZADOR_DIR", "/privado")
    assert storage_dir(tmp_path) == pathlib.Path("/privado")


def test_historial_conserva_reportes(tmp_path):
    reporte = tmp_path / "plan.csv"
    reporte.write_text("v1")
    destino = archive_reports([reporte, tmp_path / "no_existe.csv"], tmp_path / "historial")
    reporte.write_text("v2")
    assert (destino / "plan.csv").read_text() == "v1"
    assert not (destino / "no_existe.csv").exists()


def test_gemini_sin_modelo_no_llama(monkeypatch):
    llamadas = captura_post(monkeypatch)
    assert AIClassifier(provider="gemini").classify("a.txt")["categoria"] == ""
    assert llamadas == []
