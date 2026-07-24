import logging
from pathlib import Path
from typing import Optional
import yaml

from .scanner import ScannedItem
from .normalizer import normalize_text

logger = logging.getLogger(__name__)


class ProblemDetector:
    def __init__(self, ignored_patterns_path: Path):
        self.patterns = self._load_patterns(ignored_patterns_path)

    def _load_patterns(self, path: Path) -> dict:
        try:
            with open(path, "r", encoding="utf-8") as f:
                return yaml.safe_load(f) or {}
        except Exception as e:
            logger.warning(f"Error loading patterns: {e}")
            return {}

    def detect(self, items: list, root_path: Path) -> list[dict]:
        problems = []
        root_name = root_path.name
        for item in items:
            problems.extend(self._check_item(item, root_path))
        problems.extend(self._check_global(items, root_path))
        return problems

    def _check_item(self, item, root_path) -> list[dict]:
        problems = []
        rel = self._get_rel(item, root_path)
        if not rel:
            return problems
        parts = rel.parts
        if len(parts) == 1 and not item.is_dir:
            problems.append(self._make_problem(item, "ARCHIVO_EN_RAIZ",
                f"Archivo '{item.name}' está directamente en la raíz"))
        if item.is_dir and item.depth == 0:
            pass
        if item.is_dir:
            pass
        name_lower = item.name.lower()
        generic = ["prueba", "test", "nuevo", "documento", "sin titulo", "sin título",
                    "untitled", "new file"]
        for g in generic:
            if g in name_lower:
                problems.append(self._make_problem(item, "NOMBRE_GENERICO",
                    f"Nombre genérico: '{item.name}'"))
                break
        draft = ["final final", "definitivo definitivo", "ahora si", "ahora sí",
                 "ultima version", "última versión", "version final", "versión final"]
        for d in draft:
            if d in name_lower:
                problems.append(self._make_problem(item, "NOMBRE_BORRADOR",
                    f"Posible borrador: '{item.name}'"))
                break
        copy = ["copia", "copy"]
        for c in copy:
            if c in name_lower:
                problems.append(self._make_problem(item, "POSIBLE_COPIA",
                    f"Posible copia: '{item.name}'"))
                break
        if item.is_dir and item.depth == 0:
            pass
        return problems

    def _get_rel(self, item, root_path):
        try:
            return item.path.relative_to(root_path)
        except ValueError:
            return None

    def _make_problem(self, item, problem_type: str, description: str) -> dict:
        return {
            "ruta": str(item.path),
            "nombre": item.name,
            "tipo": problem_type,
            "descripcion": description,
        }
