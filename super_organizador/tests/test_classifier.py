import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))
from core.classifier import Classifier

DATA = pathlib.Path(__file__).parent.parent / "data"

def test_classify():
    clf = Classifier(DATA / "keywords.yaml", DATA / "categories.yaml")
    r = clf.classify("Informe de turbomaquinas")
    assert r["categoria"] != "00_REVISAR_MANUALMENTE"
    assert r["confianza"] > 0
    print(f"  categoria: {r['categoria']}, confianza: {r['confianza']}")

def test_classify_generic():
    clf = Classifier(DATA / "keywords.yaml", DATA / "categories.yaml")
    r = clf.classify("archivo_suelto.pdf")
    assert r["categoria"] == "00_REVISAR_MANUALMENTE"
    print(f"  categoria: {r['categoria']} (esperado: revisar)")

if __name__ == "__main__":
    test_classify()
    test_classify_generic()
    print("All classifier tests passed")
