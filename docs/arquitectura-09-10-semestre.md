# Arquitectura de Automatización e Ingeniería: 09.º y 10.º Semestre

## 1. Visión General y Objetivos

Este sistema establece la capa de ingeniería, automatización y versionado para los semestres finalistas (**9.º y 10.º Semestre**), integrando:
- **Google Drive**: Almacenamiento seguro en la nube y repositorio de entrega final.
- **GitHub / UCN (Uso Común)**: Control de versiones, repositorios de código, plantillas de cálculo y automatización.
- **Tríada de IAs (Gemini, Codex, Antigravity)**: Agentes especializados para la resolución de guías, cálculos metrológicos, código numérico y generación automática de informes.

> [!IMPORTANT]
> **ZONA DE SEGURIDAD (🔒 NO TOCAR)**: Los semestres **01.º al 08.º** en Google Drive permanecen en estado bloqueado y de solo lectura. No sufren modificaciones, traslados ni eliminaciones.

---

## 2. Estructura de Directorios Estandarizada

Tanto en la nube (Google Drive) como en el entorno local (GitHub Workspace), el 9.º y 10.º semestre cuentan con la siguiente jerarquía fija:

```
09_SEMESTRE / 10_SEMESTRE
├── Cursos/      # Sílabos, listas de temas, teoría del curso
├── Tareas/      # Asignaciones individuales y trabajos prácticos
├── Informes/    # Laboratorios, proyectos finales e informes técnicos
├── Examenes/    # Guías de estudio, solucionarios y parciales/finales
└── Material/    # Datasheets, manuales, librerías, referencias PDF
```

---

## 3. Diagrama de la Arquitectura de Integración

```
GOOGLE DRIVE (Almacenamiento & Nube)
 ├── 🔒 01.º - 08.º Semestre (Bloqueado)
 └── 🟢 09.º y 10.º Semestre (Entrada / Salida)
        │
        ▼ (Guías & Material Crudo)
 WORKSPACE GITHUB & UCN
 ├── 📂 09_SEMESTRE/
 ├── 📂 10_SEMESTRE/
 └── 🛠️ UCN Suite & 42 Agent Skills
        │
        ▼
 TRÍADA DE AGENTES DE IA
 ├── ♊ Gemini (Análisis PDF, Guías & Datasheets)
 ├── 💻 Codex (Cálculos Numéricos, Python & SymPy)
 └── 🚀 Antigravity (Orquestador, Integración & DOCX/LaTeX)
        │
        ▼
 CAPA DE PRODUCCIÓN DE ENTREGABLES
 ├── 📊 calculos.py (Resultados & Tablas)
 └── 📝 generar_entregable.py (DOCX/PDF)
        │
        ├──────────────────────────────────────┐
        ▼                                      ▼
 REPOSITORIO GITHUB (`ucn push`)       GOOGLE DRIVE (NUBE)
  (Código & Versionado)                 (Copia de Entregables Finales)
```

---

## 4. Pipeline de Trabajo por Agente de IA

| Agente | Rol Principal | Skills Utilizadas | Salida Entregable |
| :--- | :--- | :--- | :--- |
| **Gemini** | Extracción de datos, análisis de lecturas, síntesis de datasheets y guías complejas en PDF. | `datasheets`, `professor-synapse`, `notebooklm` | Resumen conceptual en `informe.md` y parámetros iniciales. |
| **Codex** | Modelamiento matemático, procesamiento de datos de laboratorio, simulaciones SPICE/MATLAB. | `ingenieria-electromecanica`, `spice`, `kicad` | Código ejecutable en `calculos.py` y arrays de datos. |
| **Antigravity** | Orquestador general, control de calidad, generación de documentos Word/LaTeX y GitOps. | `thesis-writing`, `frontend-design`, `spec-kit` | Documento final en `entregables/*.docx` + Commit en GitHub via `ucn push`. |

---

## 5. Automatizaciones Disponibles (Scripts UCN)

### 5.1. Inicializar Nuevo Laboratorio / Informe
Para crear instantáneamente la estructura de un laboratorio o tarea en el semestre 9 u 10:

```bash
bash ./uso-com-n-/scripts/ucn-semestre.sh 09 Informes "Lab Transformadores" "Maquinas Electricas"
```

Esto generará automáticamente:
- `informe.md`: Estructura Markdown pre-formateada.
- `calculos.py`: Script para desarrollo numérico de Codex.
- `generar_entregable.py`: Generador de informes Word/DOCX profesionales.
- `sync_metadata.json`: Metadatos de sincronización hacia Drive.
- Carpetas `material/` y `entregables/`.

### 5.2. Ejecutar Cálculos y Generar Entregables
```bash
cd 09_SEMESTRE/Informes/Maquinas_Electricas/Lab_Transformadores
python3 calculos.py
python3 generar_entregable.py
```

### 5.3. GitOps y Resguardo Seguro
```bash
ucn push "Implementado informe de Lab Transformadores 09 Semestre"
```
