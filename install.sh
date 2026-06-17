#!/bin/bash
# ==============================================================================
# Instalador Automático - Skills sincronizadas via GitHub
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILLS_DIR="$SCRIPT_DIR/skills"
LINE="source \"$SKILLS_DIR/skills.sh\""

echo "🚀 Instalando skills en ~/.bashrc..."

if grep -q "skills/skills.sh" ~/.bashrc; then
  echo "⚠️  Skills ya instaladas en bashrc"
else
  echo "" >> ~/.bashrc
  echo "# SKILLS sincronizadas via GitHub" >> ~/.bashrc
  echo "$LINE" >> ~/.bashrc
  echo "✅ Skills anadidas a ~/.bashrc"
fi

# Instalar skills para agentes IA
if [ -f "$SCRIPT_DIR/install-agent-skills.sh" ]; then
  echo ""
  bash "$SCRIPT_DIR/install-agent-skills.sh"
fi

echo ""
echo "🎉 Todo listo. Ejecuta: source ~/.bashrc"
echo "   Para actualizar: cd $SCRIPT_DIR && git pull && bash install.sh"
