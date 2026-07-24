import json
import logging
import os
import re
from collections import Counter
from pathlib import Path

logger = logging.getLogger(__name__)


class CategorySuggester:
    def __init__(self, provider: str = "openai", model: str = "",
                 api_url: str = "", api_key: str = ""):
        self.provider = provider
        self.model = model
        self.api_url = api_url
        self.api_key = api_key

    def suggest_categories(self, scanned: list, root_path: Path,
                           inventory: list[dict] = None) -> list[dict]:
        summary = self._build_summary(scanned, root_path, inventory)
        categories = self._call_ai(summary)
        if categories:
            self._save_categories_yaml(categories)
        return categories

    def _build_summary(self, scanned, root_path, inventory) -> str:
        top_folders = set()
        extensions = Counter()
        file_count = 0
        dir_count = 0
        naming_patterns = set()
        for item in scanned:
            try:
                rel = item.path.relative_to(root_path)
            except ValueError:
                continue
            parts = rel.parts
            if len(parts) >= 2:
                top_folders.add(parts[0])
            if item.is_dir:
                dir_count += 1
            else:
                file_count += 1
                extensions[item.extension] += 1
                name_lower = item.name.lower()
                if any(k in name_lower for k in ["practica", "taller", "examen", "tarea", "libro", "informe", "trabajo", "proyecto"]):
                    naming_patterns.add(name_lower.split(".")[0].strip()[:50])

        extension_summary = "\n".join(f"  .{ext or '(sin ext)'}: {count}" for ext, count in extensions.most_common(30))
        folder_summary = "\n  ".join(sorted(top_folders)[:40]) if top_folders else "(vacio)"
        pattern_summary = "\n  - ".join(sorted(naming_patterns)[:20]) if naming_patterns else "(ninguno detectado)"

        return f"""RESUMEN DE DIRECTORIO: {root_path.name}
Archivos: {file_count}
Carpetas: {dir_count}
Carpetas raiz:
  {folder_summary}

Extensiones mas comunes:
{extension_summary}

Patrones de nombres detectados:
  - {pattern_summary}
"""

    def _call_ai(self, summary: str) -> list[dict]:
        if self.provider == "none":
            logger.warning("IA no configurada")
            return []
        prompt = f"""Eres un experto en organizacion de archivos digitales.

Basandote en este resumen de un directorio, sugiere una estructura de carpetas para organizarlo.
La estructura debe ser PRACTICA y UTIL. NO uses categorias genericas como "Varios" o "Otros".
Crea entre 5 y 12 categorias principales.

Analiza:
- Los nombres de las carpetas raiz (indican temas principales)
- Las extensiones de archivo (indican tipos de contenido)
- Los patrones de nombres (indican naturaleza del contenido: academicos, proyectos, personales, etc.)

Para cada categoria, incluye:
- name: nombre de la carpeta (ej: "01_UNIVERSIDAD", "02_PROYECTOS")
- desc: descripcion breve de que va ahi
- keywords: palabras clave que ayudarian a clasificar archivos en esta categoria

RESPONDE SOLO CON JSON (lista de objetos):
[
  {{"name": "01_EJEMPLO", "desc": "Que va aqui", "keywords": ["palabra1", "palabra2"]}}
]

RESUMEN DEL DIRECTORIO:
{summary}
"""
        try:
            text = self._query_ai(prompt)
            return self._parse_response(text)
        except Exception as e:
            logger.error(f"AI category suggestion failed: {e}")
            return []

    def _query_ai(self, prompt: str) -> str:
        if self.provider == "openai":
            return self._query_openai(prompt)
        elif self.provider == "gemini":
            return self._query_gemini(prompt)
        elif self.provider == "ollama":
            return self._query_ollama(prompt)
        return ""

    def _query_openai(self, prompt: str) -> str:
        import requests
        api_key = os.getenv("OPENAI_API_KEY", "")
        if not api_key:
            return ""
        resp = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "model": self.model or "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
            },
            timeout=60,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]

    def _query_gemini(self, prompt: str) -> str:
        import requests
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            return ""
        resp = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}",
            json={"contents": [{"parts": [{"text": prompt}]}]},
            timeout=60,
        )
        resp.raise_for_status()
        return resp.json()["candidates"][0]["content"]["parts"][0]["text"]

    def _query_ollama(self, prompt: str) -> str:
        import requests
        url = os.getenv("OLLAMA_URL", "http://localhost:11434")
        resp = requests.post(
            f"{url}/api/generate",
            json={"model": self.model or "llama3", "prompt": prompt, "stream": False},
            timeout=120,
        )
        resp.raise_for_status()
        return resp.json().get("response", "")

    def _parse_response(self, text: str) -> list[dict]:
        try:
            json_match = re.search(r"\[.*\]", text, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                if isinstance(result, list):
                    return result
        except (json.JSONDecodeError, AttributeError):
            pass
        logger.warning(f"Could not parse AI response: {text[:200]}")
        return []

    def _save_categories_yaml(self, categories: list[dict]):
        path = Path(__file__).parent.parent / "data" / "categories_dinamicas.yaml"
        try:
            import yaml
            data = {"categories": []}
            for i, cat in enumerate(categories, 1):
                name = cat.get("name", f"CAT{i:02d}")
                data["categories"].append({
                    "name": name,
                    "path": f"UNIDAD_ORGANIZADA/{name}",
                    "keywords": cat.get("keywords", []),
                    "desc": cat.get("desc", ""),
                })
            with open(path, "w", encoding="utf-8") as f:
                yaml.dump(data, f, allow_unicode=True, default_flow_style=False, sort_keys=False)
            logger.info(f"Categorias dinámicas guardadas en {path}")
        except Exception as e:
            logger.warning(f"Could not save categories YAML: {e}")