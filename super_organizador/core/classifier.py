import logging
from pathlib import Path
from typing import Optional
import yaml

from .normalizer import normalize_text

logger = logging.getLogger(__name__)


class Classifier:
    def __init__(self, keywords_path: Path, categories_path: Path):
        self.keywords = self._load_keywords(keywords_path)
        self.categories = self._load_categories(categories_path)
        self.course_keywords = self._load_course_keywords(categories_path)

    def _load_keywords(self, path: Path) -> dict:
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)
            return data.get("keywords", {})
        except Exception as e:
            logger.warning(f"Error loading keywords: {e}")
            return {}

    def _load_categories(self, path: Path) -> list[dict]:
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)
            return data.get("categories", [])
        except Exception as e:
            logger.warning(f"Error loading categories: {e}")
            return []

    def _load_course_keywords(self, path: Path) -> list[dict]:
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)
            return data.get("course_keywords", [])
        except Exception as e:
            logger.warning(f"Error loading course keywords: {e}")
            return []

    def classify(self, name: str, rel_path: str = "", extension: str = "",
                 parent_folder: str = "", nearby_files: list[str] = None,
                 year: int = 0, semester: str = "") -> dict:
        from .normalizer import normalize_text
        normalized = normalize_text(name)
        full_text = normalize_text(f"{name} {rel_path} {parent_folder}")
        scores = {}
        reasons = []
        for keyword, mappings in self.keywords.items():
            if keyword in normalized or keyword in full_text:
                for cat, weight in mappings:
                    scores[cat] = scores.get(cat, 0) + weight
                    reasons.append(f"Contiene la palabra '{keyword}'")
        if not scores:
            return {
                "categoria": "00_REVISAR_MANUALMENTE",
                "confianza": 0.0,
                "motivos": ["No se encontraron palabras clave"],
            }
        best_cat = max(scores, key=scores.get)
        best_score = scores[best_cat]
        max_possible = max(scores.values()) if scores else 1
        confidence = min(best_score / 10.0, 1.0)
        return {
            "categoria": best_cat,
            "confianza": round(confidence, 2),
            "motivos": [f"Puntuación: {best_score} pts para '{best_cat}'"],
        }
