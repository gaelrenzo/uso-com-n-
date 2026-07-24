import hashlib
import logging
from pathlib import Path
from typing import Optional

from .scanner import ScannedItem
from .normalizer import normalize_text

logger = logging.getLogger(__name__)


class DuplicateDetector:
    def __init__(self):
        self._hash_cache = {}

    def find_exact_duplicates(self, items: list) -> list[dict]:
        size_groups = {}
        for item in items:
            if item.is_dir:
                continue
            size_groups.setdefault(item.size_bytes, []).append(item)
        duplicates = []
        for size, group in size_groups.items():
            if len(group) < 2:
                continue
            ext_groups = {}
            for item in group:
                ext_groups.setdefault(item.extension, []).append(item)
            for ext, ext_group in ext_groups.items():
                if len(ext_group) < 2:
                    continue
                hash_groups = {}
                for item in ext_group:
                    h = self._get_hash(item)
                    if h:
                        hash_groups.setdefault(h, []).append(item)
                for h, hash_group in hash_groups.items():
                    if len(hash_group) >= 2:
                        for i in range(len(hash_group)):
                            for j in range(i + 1, len(hash_group)):
                                duplicates.append({
                                    "archivo_1": str(hash_group[i].path),
                                    "archivo_2": str(hash_group[j].path),
                                    "hash": h,
                                    "tamano": hash_group[i].size_bytes,
                                })
        return duplicates

    def find_possible_duplicates(self, items: list) -> list[dict]:
        possible = []
        for i in range(len(items)):
            for j in range(i + 1, len(items)):
                a, b = items[i], items[j]
                if a.is_dir or b.is_dir:
                    continue
                if a.size_bytes == 0 or b.size_bytes == 0:
                    continue
                size_diff = abs(a.size_bytes - b.size_bytes)
                if size_diff > 1024:
                    continue
                norm_a = normalize_text(a.name)
                norm_b = normalize_text(b.name)
                if norm_a == norm_b:
                    possible.append({
                        "archivo_1": str(a.path),
                        "archivo_2": str(b.path),
                        "similitud": "nombre_identico",
                        "diferencia_tamano": size_diff,
                    })
        return possible

    def _get_hash(self, item) -> Optional[str]:
        if str(item.path) in self._hash_cache:
            return self._hash_cache[str(item.path)]
        try:
            h = hashlib.sha256()
            with open(item.path, "rb") as f:
                chunk = f.read(8192)
                while chunk:
                    h.update(chunk)
                    chunk = f.read(8192)
            result = h.hexdigest()
            self._hash_cache[str(item.path)] = result
            return result
        except (OSError, PermissionError):
            return None