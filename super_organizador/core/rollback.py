import csv
import logging
import shutil
from pathlib import Path

from .validators import path_exists

logger = logging.getLogger(__name__)


class Rollback:
    def __init__(self, simulation_mode: bool = True):
        self.simulation_mode = simulation_mode

    def rollback(self, log_path: Path) -> list[dict]:
        if not path_exists(log_path):
            logger.error(f"Log no encontrado: {log_path}")
            return []
        entries = self._read_log(log_path)
        reversed_entries = list(reversed(entries))
        results = []
        for entry in reversed_entries:
            if entry["resultado"] == "ERROR":
                continue
            origen = Path(entry["destino"])
            destino = Path(entry["origen"])
            if not path_exists(origen):
                results.append({"origen": str(origen), "destino": str(destino), "resultado": "ERROR", "error": "Origen no existe"})
                continue
            if self.simulation_mode:
                logger.info(f"[SIMULACION] Devolvería: {origen} -> {destino}")
                results.append({"origen": str(origen), "destino": str(destino), "resultado": "SIMULACION", "error": ""})
                continue
            try:
                if destino.exists():
                    results.append({"origen": str(origen), "destino": str(destino), "resultado": "ERROR", "error": "Destino ocupado"})
                    continue
                shutil.move(str(origen), str(destino))
                logger.info(f"Devuelto: {origen} -> {destino}")
                results.append({"origen": str(origen), "destino": str(destino), "resultado": "OK", "error": ""})
            except Exception as e:
                results.append({"origen": str(origen), "destino": str(destino), "resultado": "ERROR", "error": str(e)})
        return results

    def _read_log(self, log_path: Path) -> list[dict]:
        entries = []
        with open(log_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                entries.append(row)
        return entries

    def save_rollback_log(self, results: list[dict], log_path: Path):
        log_path.parent.mkdir(parents=True, exist_ok=True)
        with open(log_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=["origen", "destino", "resultado", "error"])
            writer.writeheader()
            writer.writerows(results)
