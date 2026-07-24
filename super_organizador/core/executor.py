import logging
import shutil
from pathlib import Path
from datetime import datetime
from typing import Optional

from .validators import path_exists, is_file_locked

logger = logging.getLogger(__name__)


class Executor:
    def __init__(self, simulation_mode: bool = True, max_moves: int = 50):
        self.simulation_mode = simulation_mode
        self.max_moves = max_moves
        self.movements_log = []

    def execute_plan(self, plan: list[dict], log_path: Path) -> list[dict]:
        approved = [p for p in plan if p["aprobado"].strip().upper() == "SI" and p["accion"] == "mover"]
        approved = approved[:self.max_moves]
        if not approved:
            logger.info("No hay movimientos aprobados para ejecutar")
            return []

        results = []
        for entry in approved:
            result = self._execute_single(entry, log_path)
            results.append(result)
        self._save_log(results, log_path)
        return results

    def _execute_single(self, entry: dict, log_path: Path) -> dict:
        origen = Path(entry["origen"])
        destino = Path(entry["destino"])
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        if not path_exists(origen):
            return {
                "timestamp": timestamp, "origen": str(origen),
                "destino": str(destino), "tipo": entry["tipo"],
                "resultado": "ERROR", "error": "Origen no existe",
                "hash_antes": "", "hash_despues": "",
            }
        if self.simulation_mode:
            logger.info(f"[SIMULACION] Movería: {origen} -> {destino}")
            return {
                "timestamp": timestamp, "origen": str(origen),
                "destino": str(destino), "tipo": entry["tipo"],
                "resultado": "SIMULACION", "error": "",
                "hash_antes": "", "hash_despues": "",
            }
        try:
            destino.parent.mkdir(parents=True, exist_ok=True)
            if destino.exists():
                stem = destino.stem
                suffix = destino.suffix
                counter = 1
                while destino.exists():
                    destino = destino.parent / f"{stem}_{counter:03d}{suffix}"
                    counter += 1
            shutil.move(str(origen), str(destino))
            logger.info(f"Movido: {origen} -> {destino}")
            return {
                "timestamp": timestamp, "origen": str(origen),
                "destino": str(destino), "tipo": entry["tipo"],
                "resultado": "OK", "error": "",
                "hash_antes": "", "hash_despues": "",
            }
        except Exception as e:
            logger.error(f"Error moviendo {origen}: {e}")
            return {
                "timestamp": timestamp, "origen": str(origen),
                "destino": str(destino), "tipo": entry["tipo"],
                "resultado": "ERROR", "error": str(e),
                "hash_antes": "", "hash_despues": "",
            }

    def _save_log(self, results: list[dict], log_path: Path):
        import csv
        log_path.parent.mkdir(parents=True, exist_ok=True)
        with open(log_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=[
                "timestamp", "origen", "destino", "tipo",
                "resultado", "error", "hash_antes", "hash_despues",
            ])
            writer.writeheader()
            writer.writerows(results)