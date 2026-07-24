import unicodedata
import re
from pathlib import Path


def normalize_text(text: str) -> str:
    if not isinstance(text, str):
        return ""
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = text.lower().strip()
    text = re.sub(r"[_\-]+", " ", text)
    text = re.sub(r"\s+", " ", text)
    text = text.strip()
    return text


def normalize_filename(name: str) -> str:
    stem = Path(name).stem
    ext = Path(name).suffix
    normalized_stem = normalize_text(stem)
    return f"{normalized_stem}{ext}"


def safe_filename(name: str, max_length: int = 200) -> str:
    name = name.strip()
    name = re.sub(r'[<>:"/\\|?*]', "_", name)
    if len(name) > max_length:
        stem = Path(name).stem[:max_length - 10]
        ext = Path(name).suffix
        name = f"{stem}{ext}"
    return name
