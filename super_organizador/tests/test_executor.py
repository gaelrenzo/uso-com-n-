import sys, pathlib, tempfile
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))
from core.executor import Executor

def test_simulation_mode():
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        src = tmp / "src.txt"
        src.write_text("x")
        ex = Executor(simulation_mode=True)
        plan = [{"aprobado": "SI", "accion": "mover", "origen": str(src), "destino": str(tmp / "dst.txt"), "tipo": "archivo"}]
        results = ex.execute_plan(plan, tmp / "log.csv")
        assert len(results) == 1
        assert results[0]["resultado"] == "SIMULACION"
        assert src.exists()
    print("  test_simulation_mode: OK")

def test_missing_source_reports_error():
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        ex = Executor(simulation_mode=True)
        plan = [{"aprobado": "SI", "accion": "mover", "origen": str(tmp / "no.txt"), "destino": str(tmp / "dst.txt"), "tipo": "archivo"}]
        results = ex.execute_plan(plan, tmp / "log.csv")
        assert results[0]["resultado"] == "ERROR"
    print("  test_missing_source_reports_error: OK")

def test_no_approved_moves():
    with tempfile.TemporaryDirectory() as tmp:
        ex = Executor(simulation_mode=True)
        plan = [{"aprobado": "NO", "accion": "mover", "origen": "/fake/src.txt", "destino": "/fake/dst.txt", "tipo": "archivo"}]
        results = ex.execute_plan(plan, pathlib.Path(tmp) / "log.csv")
        assert len(results) == 0
    print("  test_no_approved_moves: OK")

if __name__ == "__main__":
    test_simulation_mode()
    test_missing_source_reports_error()
    test_no_approved_moves()
    print("All executor tests passed")
