import csv
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional

from .scanner import ScannedItem
from .validators import get_file_size_human, is_cloud_only, is_file_locked

logger = logging.getLogger(__name__)


def generate_inventory(items: list[ScannedItem], root_path: Path) -> list[dict]:
    inventory = []
    for idx, item in enumerate(items, 1):
        try:
            rel_path = item.path.relative_to(root_path)
            rel_str = str(rel_path.as_posix())
        except ValueError:
            rel_str = item.name
        entry = {
            "id": idx,
            "nombre": item.name,
            "ruta_absoluta": str(item.path),
            "ruta_relativa": rel_str,
            "tipo": "directorio" if item.is_dir else "archivo",
            "extension": item.extension,
            "tamano_bytes": item.size_bytes,
            "tamano_legible": _format_size(item.size_bytes),
            "fecha_creacion": _format_ts(item.created),
            "fecha_modificacion": _format_ts(item.modified),
            "carpeta_padre": item.parent,
            "profundidad": item.depth,
            "hash": item.hash_sha256,
            "estado_sincronizacion": "solo_nube" if item.is_cloud_only else "local",
            "categoria_actual": "",
            "categoria_sugerida": "",
            "confianza": 0.0,
            "motivos": [],
            "requiere_revision": False,
            "posible_duplicado": False,
            "error": "",
        }
        inventory.append(entry)
    return inventory


def _format_size(size: int) -> str:
    if size == 0:
        return "0 B"
    units = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    s = float(size)
    while s >= 1024 and i < len(units) - 1:
        s /= 1024
        i += 1
    return f"{s:.2f} {units[i]}"


def _format_ts(ts: float) -> str:
    from datetime import datetime
    try:
        return datetime.fromtimestamp(ts).strftime("%Y-%m-%d %H:%M:%S")
    except (OSError, ValueError):
        return ""


def save_inventory_csv(inventory: list[dict], path: Path):
    import csv
    if not inventory:
        return
    fieldnames = list(inventory[0].keys())
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(inventory)


def save_inventory_json(inventory: list[dict], path: Path):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(inventory, f, ensure_ascii=False, indent=2)
