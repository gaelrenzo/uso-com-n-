#!/bin/bash
# Genera plantilla de informe
# Uso: ucn-informe.sh "titulo del informe"

# Detectar plataforma
PLATFORM_SH="$(cd "$(dirname "$0")" && pwd)/ucn-platform.sh"
if [ -f "$PLATFORM_SH" ]; then
  source "$PLATFORM_SH"
fi

TITLE="${1:-informe}"
DATE=$(date '+%Y-%m-%d')
DIR="${UCN_INFORMES_DIR:-$HOME/universida-datos/informes}/${TITLE// /-}"
mkdir -p "$DIR"

FILE="$DIR/informe.md"

cat > "$FILE" <<EOF
# $TITLE

**Fecha:** $DATE

---

## 1. Objetivo

## 2. Marco teorico

## 3. Materiales y metodos

## 4. Resultados

## 5. Discusion

## 6. Conclusiones

## 7. Referencias

EOF

echo "Plantilla de informe creada: $FILE"