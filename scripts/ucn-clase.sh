#!/bin/bash
# Abre la carpeta de universidad
# Uso: ucn-clase.sh [materia]

# Detectar plataforma
PLATFORM_SH="$(cd "$(dirname "$0")" && pwd)/ucn-platform.sh"
if [ -f "$PLATFORM_SH" ]; then
  source "$PLATFORM_SH"
fi

BASE="${UCN_CLASE_DIR:-$HOME/universida-datos}"
SUBJECT="$1"

if [ -n "$SUBJECT" ]; then
  TARGET="$BASE/cursos/$SUBJECT"
  mkdir -p "$TARGET"
  cd "$TARGET" || exit
else
  cd "$BASE" || exit
fi

pwd
ls -la