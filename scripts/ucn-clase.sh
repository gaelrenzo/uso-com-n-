#!/bin/bash
# Abre la carpeta de universidad
# Uso: ucn-clase.sh [materia]

BASE="${UCN_CLASE_DIR:-/storage/emulated/0/universida-datos}"
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
