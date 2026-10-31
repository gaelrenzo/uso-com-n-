import os
import shutil
from datetime import datetime
from pathlib import Path


def storage_dir(base_dir: Path) -> Path:
    """Carpeta de reportes y logs: fuera del repo si hay carpeta de datos."""
    custom = os.getenv("ORGANIZADOR_DIR")
    if custom:
        return Path(custom)
    data_dir = os.getenv("UCN_DATA_DIR")
    if data_dir:
        return Path(data_dir) / "organizador"
    return base_dir


def archive_reports(paths: list[Path], history_dir: Path) -> Path:
    """Copia los reportes a una carpeta fechada para conservarlos entre ejecuciones."""
    target = history_dir / datetime.now().strftime("%Y-%m-%d_%H%M%S")
    target.mkdir(parents=True, exist_ok=True)
    for path in paths:
        if path.exists():
            shutil.copy2(path, target / path.name)
    return target
