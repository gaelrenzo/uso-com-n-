import sys, pathlib, tempfile, os
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))
from core.executor import Executor

def test_simulation_mode():
    ex = Executor(simulation_mode=True)
    plan = [{"aprobado": "SI", "accion": "mover", "origen": "/fake/src.txt", "destino": "/fake/dst.txt", "tipo": "archivo"}]
    results = ex.execute_plan(plan, pathlib.Path("fake_log.csv"))
    assert len(results) == 1
    assert results[0]["resultado"] == "SIMULACION"
    print("  test_simulation_mode: OK")

def test_no_approved_moves():
    ex = Executor(simulation_mode=True)
    plan = [{"aprobado": "NO", "accion": "mover", "origen": "/fake/src.txt", "destino": "/fake/dst.txt", "tipo": "archivo"}]
    results = ex.execute_plan(plan, pathlib.Path("fake_log.csv"))
    assert len(results) == 0
    print("  test_no_approved_moves: OK")

if __name__ == "__main__":
    test_simulation_mode()
    test_no_approved_moves()
    print("All executor tests passed")
