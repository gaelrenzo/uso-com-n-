import sys, pathlib, tempfile, os, csv
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))
from core.rollback import Rollback

def test_rollback_missing_log():
    rb = Rollback(simulation_mode=True)
    result = rb.rollback(pathlib.Path("/nonexistent.csv"))
    assert result == []
    print("  test_rollback_missing_log: OK")

def test_rollback_simulation():
    rb = Rollback(simulation_mode=True)
    with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False, newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["timestamp", "origen", "destino", "tipo", "resultado", "error", "hash_antes", "hash_despues"])
        w.writerow(["2024-01-01", "/src/a.txt", "/dst/a.txt", "archivo", "OK", "", "", ""])
        log_path = pathlib.Path(f.name)
    result = rb.rollback(log_path)
    assert len(result) == 1
    os.unlink(log_path)
    print("  test_rollback_simulation: OK")

if __name__ == "__main__":
    test_rollback_missing_log()
    test_rollback_simulation()
    print("All rollback tests passed")
