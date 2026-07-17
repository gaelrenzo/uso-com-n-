#!/bin/bash
set -euo pipefail

# ==============================================================================
# Instalador de Skills para Agentes IA
# Sincroniza las skills compartidas desde skills/agent-skills/ hacia los agentes.
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_SKILLS_DIR="$SCRIPT_DIR/skills/agent-skills"
SYNC_SCRIPT="$SCRIPT_DIR/skills/sync-agent-skills.sh"

echo "🚀 Instalando skills para agentes IA..."

if [ ! -d "$REPO_SKILLS_DIR" ]; then
  echo "❌ No se encontró el directorio de skills compartidas: $REPO_SKILLS_DIR" >&2
  exit 1
fi

if [ ! -f "$SYNC_SCRIPT" ]; then
  echo "❌ No se encontró el sincronizador: $SYNC_SCRIPT" >&2
  exit 1
fi

bash "$SYNC_SCRIPT"

echo ""
echo "🎉 Skills de agentes instaladas desde $REPO_SKILLS_DIR."
echo "   Para actualizar: cd \"$SCRIPT_DIR\" && git pull && bash install-agent-skills.sh"
