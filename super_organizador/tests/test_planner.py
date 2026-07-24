import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))
from core.planner import Planner
from core.classifier import Classifier
from core.scanner import ScannedItem

DATA = pathlib.Path(__file__).parent.parent / "data"

def test_generate_plan():
    clf = Classifier(DATA / "keywords.yaml", DATA / "categories.yaml")
    plan = Planner(clf, pathlib.Path("/test"), 0.9)
    items = [
        {"nombre": "test.pdf", "ruta_relativa": "test.pdf", "extension": ".pdf", "carpeta_padre": "", "tipo": "archivo", "ruta_absoluta": "/test/test.pdf"},
    ]
    result = plan.generate_plan([], items)
    assert len(result) == 1
    assert result[0]["accion"] == "revisar"
    print("  test_generate_plan: OK")

if __name__ == "__main__":
    test_generate_plan()
    print("All planner tests passed")
