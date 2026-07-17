#!/bin/bash
set -euo pipefail

# UCN Skills Manager
# Sincroniza las skills compartidas con los agentes instalados.
# Uso: ./install-skills.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYNC_SCRIPT="$SCRIPT_DIR/skills/sync-agent-skills.sh"

echo "=== UCN Skills Manager ==="
echo ""

if [ ! -f "$SYNC_SCRIPT" ]; then
  echo "❌ No se encontró el sincronizador: $SYNC_SCRIPT" >&2
  exit 1
fi

bash "$SYNC_SCRIPT"

echo ""
echo "Listo! Skills sincronizadas desde: $SCRIPT_DIR/skills/agent-skills"
