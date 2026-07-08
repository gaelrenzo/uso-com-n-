#!/bin/bash
# Crea una nota rapida en Markdown
# Uso: ucn-note.sh "titulo de la nota"

TITLE="${1:-nota-$(date +%Y%m%d-%H%M)}"
NOTES_DIR="${UCN_NOTES_DIR:-/storage/emulated/0/universida-datos/notas}"
mkdir -p "$NOTES_DIR"

FILE="$NOTES_DIR/$(date +%Y%m%d)-${TITLE// /-}.md"

cat > "$FILE" <<EOF
# $TITLE

**Fecha:** $(date '+%Y-%m-%d %H:%M')

---

## Notas

EOF

echo "Nota creada: $FILE"
