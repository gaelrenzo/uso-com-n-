import json
import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)


class AIClassifier:
    def __init__(self, provider: str = "none", model: str = "",
                 api_url: str = "", api_key: str = ""):
        self.provider = provider
        self.model = model
        self.api_url = api_url
        self.api_key = api_key

    def classify(self, name: str, rel_path: str = "", extension: str = "",
                 size: int = 0, nearby_files: list[str] = None,
                 categories: list[str] = None) -> dict:
        if self.provider == "none":
            return {"categoria": "", "confianza": 0.0, "motivos": ["IA no configurada"]}
        if self.provider == "openai":
            return self._classify_openai(name, rel_path, extension, size, nearby_files, categories)
        elif self.provider == "gemini":
            return self._classify_gemini(name, rel_path, extension, size, nearby_files, categories)
        elif self.provider == "ollama":
            return self._classify_ollama(name, rel_path, extension, size, nearby_files, categories)
        else:
            return {"categoria": "", "confianza": 0.0, "motivos": ["Proveedor no soportado"]}

    def _classify_openai(self, name, rel_path, extension, size, nearby_files, categories):
        import os
        import requests
        api_key = os.getenv("OPENAI_API_KEY", "")
        if not api_key:
            return {"categoria": "", "confianza": 0.0, "motivos": ["OPENAI_API_KEY no configurada"]}
        prompt = self._build_prompt(name, rel_path, extension, size, nearby_files, categories)
        try:
            resp = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": self.model or "gpt-4o-mini",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.1,
                },
                timeout=30,
            )
            resp.raise_for_status()
            result = resp.json()
            content = result["choices"][0]["message"]["content"]
            return self._parse_ai_response(content)
        except Exception as e:
            logger.warning(f"OpenAI classification failed: {e}")
            return {"categoria": "", "confianza": 0.0, "motivos": [f"Error IA: {e}"]}

    def _classify_gemini(self, name, rel_path, extension, size, nearby_files, categories):
        import os
        import requests
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            return {"categoria": "", "confianza": 0.0, "motivos": ["GEMINI_API_KEY no configurada"]}
        prompt = self._build_prompt(name, rel_path, extension, size, nearby_files, categories)
        try:
            resp = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}",
                json={"contents": [{"parts": [{"text": prompt}]}]},
                timeout=30,
            )
            resp.raise_for_status()
            result = resp.json()
            text = result["candidates"][0]["content"]["parts"][0]["text"]
            return self._parse_ai_response(text)
        except Exception as e:
            logger.warning(f"Gemini classification failed: {e}")
            return {"categoria": "", "confianza": 0.0, "motivos": [f"Error Gemini: {e}"]}

    def _classify_ollama(self, name, rel_path, extension, size, nearby_files, categories):
        import requests
        import os
        url = os.getenv("OLLAMA_URL", "http://localhost:11434")
        prompt = self._build_prompt(name, rel_path, extension, size, nearby_files, categories)
        try:
            resp = requests.post(
                f"{url}/api/generate",
                json={"model": self.model or "llama3", "prompt": prompt, "stream": False},
                timeout=30,
            )
            resp.raise_for_status()
            result = resp.json()
            return self._parse_ai_response(result.get("response", ""))
        except Exception as e:
            logger.warning(f"Ollama classification failed: {e}")
            return {"categoria": "", "confianza": 0.0, "motivos": [f"Error Ollama: {e}"]}

    def _build_prompt(self, name, rel_path, extension, size, nearby_files, categories):
        prompt = f"""Clasifica este archivo en una categoría.
Nombre: {name}
Ruta: {rel_path}
Extensión: {extension}
Tamaño: {size} bytes
Archivos cercanos: {nearby_files or []}
Categorías disponibles: {categories or []}

Responde SOLO con JSON:
{{"categoria": "nombre_categoria", "confianza": 0.0-1.0, "motivos": ["razon1", "razon2"]}}"""
        return prompt

    def _parse_ai_response(self, text: str) -> dict:
        import json
        import re
        try:
            json_match = re.search(r"\{.*\}", text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
        except (json.JSONDecodeError, AttributeError):
            pass
        return {"categoria": "", "confianza": 0.0, "motivos": ["Error parseando respuesta IA"]}
