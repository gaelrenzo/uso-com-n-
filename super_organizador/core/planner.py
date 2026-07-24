import csv
import logging
from pathlib import Path
from typing import Optional

from .classifier import Classifier
from .scanner import ScannedItem

logger = logging.getLogger(__name__)


class Planner:
    def __init__(self, classifier: Classifier, target_root: Path,
                 confidence_threshold: float = 0.90,
                 dynamic_categories: list[dict] = None):
        self.classifier = classifier
        self.target_root = target_root
        self.confidence_threshold = confidence_threshold
        self.dynamic_categories = dynamic_categories

    def _get_dynamic_category(self, name: str, rel_path: str, extension: str) -> tuple:
        if not self.dynamic_categories:
            return "", 0.0, []
        name_lower = name.lower()
        path_lower = rel_path.lower()
        best_cat = ""
        best_score = 0
        reasons = []
        for cat in self.dynamic_categories:
            score = 0
            kw = cat.get("keywords", [])
            for k in kw:
                if k.lower() in name_lower or k.lower() in path_lower:
                    score += 10
                    reasons.append(f"keyword '{k}' coincide con '{cat['name']}'")
            if score > best_score:
                best_score = score
                best_cat = cat["name"]
        return best_cat, best_score, reasons

    def generate_plan(self, items: list, inventory: list[dict]) -> list[dict]:
        plan = []
        for idx, entry in enumerate(inventory, 1):
            nombre = entry["nombre"]
            ruta = entry["ruta_relativa"]
            extension = entry["extension"]
            parent = entry.get("carpeta_padre", "")
            rel_path_obj = Path(ruta)
            parent_name = str(rel_path_obj.parent) if rel_path_obj.parent else ""

            if self.dynamic_categories:
                dyn_cat, dyn_score, dyn_reasons = self._get_dynamic_category(nombre, ruta, extension)
                if dyn_cat and dyn_score >= 10:
                    cat = dyn_cat
                    conf = min(dyn_score / 20.0, 0.95)
                    reasons = dyn_reasons
                else:
                    cat = "00_REVISAR_MANUALMENTE"
                    conf = 0.0
                    reasons = ["No coincide con categorias dinámicas"]
            else:
                result = self.classifier.classify(
                    name=nombre,
                    rel_path=ruta,
                    extension=extension,
                    parent_folder=parent_name,
                )
                cat = result["categoria"]
                conf = result["confianza"]
                reasons = result["motivos"]

            requires_review = conf < self.confidence_threshold
            if cat == "00_REVISAR_MANUALMENTE" or requires_review:
                cat = "00_REVISAR_MANUALMENTE"
                conf = min(conf, 0.5)
            origen = entry["ruta_absoluta"]
            destino = str(self.target_root / cat / nombre) if cat != "00_REVISAR_MANUALMENTE" else ""
            plan_entry = {
                "id": idx,
                "aprobado": "NO",
                "tipo": entry["tipo"],
                "origen": origen,
                "destino": destino,
                "categoria": cat,
                "confianza": conf,
                "motivos": "; ".join(reasons),
                "conflicto": "",
                "accion": "mover" if cat != "00_REVISAR_MANUALMENTE" else "revisar",
                "estado": "pendiente",
            }
            plan.append(plan_entry)
        return plan

    def save_plan_csv(self, plan: list[dict], path: Path):
        with open(path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=[
                "id", "aprobado", "tipo", "origen", "destino",
                "categoria", "confianza", "motivos", "conflicto",
                "accion", "estado",
            ])
            writer.writeheader()
            writer.writerows(plan)

    def save_plan_md(self, plan: list[dict], path: Path):
        with open(path, "w", encoding="utf-8") as f:
            f.write("# PLAN DE ORGANIZACION\n\n")
            f.write(f"Total de elementos: {len(plan)}\n\n")
            auto = [p for p in plan if p["accion"] == "mover"]
            review = [p for p in plan if p["accion"] == "revisar"]
            f.write(f"**Movimientos automáticos propuestos:** {len(auto)}\n")
            f.write(f"**Requieren revisión manual:** {len(review)}\n\n")
            f.write("---\n\n")
            for p in plan:
                f.write(f"## Elemento {p['id']}: {Path(p['origen']).name}\n\n")
                f.write(f"- **Origen:** {p['origen']}\n")
                if p["destino"]:
                    f.write(f"- **Destino sugerido:** {p['destino']}\n")
                f.write(f"- **Categoría:** {p['categoria']}\n")
                f.write(f"- **Confianza:** {p['confianza'] * 100:.0f}%\n")
                f.write(f"- **Acción:** {p['accion']}\n")
                if p["motivos"]:
                    f.write("- **Motivos:**\n")
                    for m in p["motivos"].split("; "):
                        f.write(f"  - {m}\n")
                f.write("\n")