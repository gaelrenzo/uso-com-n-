import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))
from core.normalizer import normalize_text, normalize_filename

def test_normalize_text():
    assert normalize_text("Física") == "fisica"
    assert normalize_text("FISICA") == "fisica"
    assert normalize_text("  Hello_World  ") == "hello world"
    assert normalize_text("TRANSFERENCIA DE CALOR") == "transferencia de calor"
    print("  test_normalize_text: OK")

def test_normalize_filename():
    assert normalize_filename("Informe Final.pdf") == "informe final.pdf"
    assert normalize_filename("Trabajo Corregido v2.DOCX").endswith(".docx")
    print("  test_normalize_filename: OK")

if __name__ == "__main__":
    test_normalize_text()
    test_normalize_filename()
    print("All normalizer tests passed")
