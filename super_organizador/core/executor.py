import csv
import errno
import hashlib
import logging
import os
import shutil
from pathlib import Path
from datetime import datetime
from typing import Optional

from .validators import path_exists, is_file_locked

logger = logging.getLogger(__name__)

LOG_FIELDS = [
    "timestamp", "origen", "destino", "tipo",
    "resultado", "error", "hash_antes", "hash_despues",
]


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


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
        log_path.parent.mkdir(parents=True, exist_ok=True)
        # El log se escribe fila a fila: si se interrumpe, lo ya movido se puede deshacer
        with open(log_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=LOG_FIELDS)
            writer.writeheader()
            f.flush()
            for entry in approved:
                result = self._execute_single(entry)
                results.append(result)
                writer.writerow(result)
                f.flush()
                os.fsync(f.fileno())
        return results

    def _execute_single(self, entry: dict) -> dict:
        origen = Path(entry["origen"])
        destino = Path(entry["destino"])
        result = {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "origen": str(origen), "destino": str(destino), "tipo": entry["tipo"],
            "resultado": "OK", "error": "", "hash_antes": "", "hash_despues": "",
        }
        if not path_exists(origen):
            return {**result, "resultado": "ERROR", "error": "Origen no existe"}
        if origen.resolve() == destino.resolve():
            return {**result, "resultado": "OMITIDO", "error": "Origen y destino coinciden"}
        if self.simulation_mode:
            logger.info(f"[SIMULACION] Movería: {origen} -> {destino}")
            return {**result, "resultado": "SIMULACION"}
        try:
            destino.parent.mkdir(parents=True, exist_ok=True)
            if destino.exists():
                stem = destino.stem
                suffix = destino.suffix
                counter = 1
                while destino.exists():
                    destino = destino.parent / f"{stem}_{counter:03d}{suffix}"
                    counter += 1
            result["destino"] = str(destino)
            hash_antes, hash_despues = self._move_verified(origen, destino)
            logger.info(f"Movido: {origen} -> {destino}")
            return {**result, "hash_antes": hash_antes, "hash_despues": hash_despues}
        except Exception as e:
            logger.error(f"Error moviendo {origen}: {e}")
            return {**result, "resultado": "ERROR", "error": str(e)}

    def _move_verified(self, origen: Path, destino: Path) -> tuple:
        if origen.is_dir():
            shutil.move(str(origen), str(destino))
            return "", ""
        hash_antes = sha256_file(origen)
        try:
            os.rename(origen, destino)
        except OSError as e:
            if e.errno != errno.EXDEV:
                raise
            # Entre discos: el origen solo se borra si la copia es identica
            try:
                shutil.copy2(origen, destino)
                if sha256_file(destino) != hash_antes:
                    raise OSError("La copia no coincide con el original")
            except BaseException:
                destino.unlink(missing_ok=True)
                raise
            origen.unlink()
        return hash_antes, sha256_file(destino)
