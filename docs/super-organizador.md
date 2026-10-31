# Super Organizador Inteligente

Organizador automatico de archivos con inteligencia artificial. Escanea cualquier directorio o unidad, genera arboles de directorios, inventarios de archivos, detecta duplicados y problemas, y usa IA (OpenAI, Gemini, Ollama) para sugerir una estructura de categorias personalizada y ejecutar el plan de organizacion.

```
super_organizador/
├── main.py                 # Entrypoint
├── config.yaml             # Configuracion general
├── core/                   # Logica principal
│   ├── scanner.py          # Escaneo recursivo de directorios
│   ├── tree_generator.py   # Generacion de arbol
│   ├── inventory.py        # Inventario de archivos CSV/JSON
│   ├── problem_detector.py # Deteccion de duplicados y problemas
│   ├── duplicate_detector.py # Deteccion de archivos duplicados
│   ├── ai_classifier.py    # Clasificador por IA
│   ├── category_suggester.py # Sugerencia de categorias con IA
│   ├── classifier.py       # Clasificador por reglas
│   ├── planner.py          # Plan de organizacion
│   ├── executor.py         # Ejecucion de movimientos
│   ├── rollback.py         # Reversion de cambios
│   ├── normalizer.py       # Normalizacion de nombres
│   └── validators.py       # Validadores de ruta y config
├── data/                   # Datos de referencia
│   ├── categories.yaml     # Categorias predefinidas
│   ├── keywords.yaml       # Palabras clave por categoria
│   └── ignored_patterns.yaml # Patrones a ignorar
├── tests/                  # Tests unitarios
├── reports/                # Reportes generados
├── .opencode/agents/       # Agente para OpenCode
└── requirements.txt        # Dependencias
```

**Uso basico:**
```bash
python main.py --path "C:\Users\..."        # Escanear y analizar
python main.py --path "./mi carpeta" --analyze-only  # Solo analisis
python main.py --path "./mi carpeta" --plan           # Generar plan sin ejecutar
python main.py --path "./mi carpeta" --apply          # Ejecutar plan
```

**Configuracion:** editar `config.yaml` para seleccionar proveedor IA (openai/gemini/ollama), definir categorias personalizadas y ajustar comportamiento.

---

## Reportes y datos futuros

Los reportes y logs se guardan fuera del repo, en `$UCN_DATA_DIR/organizador/`
(o en `ORGANIZADOR_DIR`). Cada arbol, inventario y plan se copia ademas a
`reports/historial/<fecha>/`, asi conservas el estado de cada ejecucion.
Contienen rutas personales: `ucn push` y el CI bloquean su publicacion.
