#!/bin/bash
# Script de inicialización de entregables para 09_SEMESTRE y 10_SEMESTRE
# Uso: bash ./uso-com-n-/scripts/ucn-semestre.sh <09|10> <Cursos|Tareas|Informes|Examenes> "Nombre_del_Trabajo" "Nombre_del_Curso"

SEMESTRE="${1:-09}"
TIPO="${2:-Informes}"
NOMBRE="${3:-nuevo-trabajo}"
CURSO="${4:-General}"

SLUG_NOMBRE=$(echo "$NOMBRE" | tr ' ' '_')
SLUG_CURSO=$(echo "$CURSO" | tr ' ' '_')

BASE_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
TARGET_DIR="$BASE_DIR/${SEMESTRE}_SEMESTRE/$TIPO/$SLUG_CURSO/$SLUG_NOMBRE"

mkdir -p "$TARGET_DIR/material"
mkdir -p "$TARGET_DIR/entregables"

FECHA=$(date '+%Y-%m-%d')

# 1. Crear plantilla de informe en Markdown
cat > "$TARGET_DIR/informe.md" <<EOF
# INFORME: $NOMBRE
**Curso:** $CURSO
**Semestre:** ${SEMESTRE}° Semestre
**Fecha:** $FECHA
**Agentes en Pipeline:** Gemini (Lectura/Datasheets) | Codex (Cálculos/Simulaciones) | Antigravity (Integración/Formato)

---

## 1. OBJETIVO DEL TRABAJO
- Describir aquí los objetivos principales.

## 2. MARCO TEÓRICO Y CONCEPTOS CLAVE
- Resumen de teoría y datasheets analizados por Gemini.

## 3. PROCEDIMIENTO Y CÁLCULOS
- Explicación de los cálculos numéricos desarrollados por Codex en \`calculos.py\`.

## 4. RESULTADOS Y TABLAS METROLÓGICAS
- Inserción de gráficos, tablas de Excel y mediciones.

## 5. CONCLUSIONES Y RECOMENDACIONES
- Conclusiones principales del estudio.

## 6. REFERENCIAS
- Fuentes consultadas y datasheets.
EOF

# 2. Crear script de cálculo en Python (Codex ready)
cat > "$TARGET_DIR/calculos.py" <<EOF
#!/usr/bin/env python3
"""
Cálculos de ingeniería para $NOMBRE ($CURSO)
Ejecutado por Codex / Antigravity
"""
import numpy as np
import pandas as pd

def ejecutar_calculos():
    print("=== EJECUTANDO CÁLCULOS DE INGENIERÍA: $NOMBRE ===")
    # TODO: Inserte las ecuaciones y datos del laboratorio aquí
    
if __name__ == "__main__":
    ejecutar_calculos()
EOF
chmod +x "$TARGET_DIR/calculos.py"

# 3. Crear script generador de Word/DOCX (Antigravity ready)
cat > "$TARGET_DIR/generar_entregable.py" <<EOF
#!/usr/bin/env python3
"""
Generador automático de entregables DOCX profesional para $NOMBRE
"""
import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

def construir_docx():
    doc = docx.Document()
    
    # Encabezado principal
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run("$NOMBRE\\n")
    run.bold = True
    run.font.size = Pt(18)
    run.font.color.rgb = RGBColor(15, 23, 42)
    
    run_sub = p.add_run("Curso: $CURSO | Semestre: ${SEMESTRE}° | Fecha: $FECHA\\n")
    run_sub.font.size = Pt(10)
    run_sub.font.color.rgb = RGBColor(71, 85, 105)
    
    output_path = os.path.join(os.path.dirname(__file__), "entregables", "${SLUG_NOMBRE}_Entregable.docx")
    doc.save(output_path)
    print(f"✅ Entregable DOCX generado en: entregables/${SLUG_NOMBRE}_Entregable.docx")

if __name__ == "__main__":
    construir_docx()
EOF
chmod +x "$TARGET_DIR/generar_entregable.py"

# 4. Crear archivo de metadatos de sincronización Drive
cat > "$TARGET_DIR/sync_metadata.json" <<EOF
{
  "semestre": "${SEMESTRE}_SEMESTRE",
  "tipo": "$TIPO",
  "curso": "$CURSO",
  "nombre": "$NOMBRE",
  "creado": "$FECHA",
  "estado": "en_progreso",
  "drive_target": "${SEMESTRE} SEMESTRE/$TIPO/$CURSO/$NOMBRE"
}
EOF

echo "✨ Entorno de trabajo creado exitosamente en:"
echo "📂 $TARGET_DIR"
