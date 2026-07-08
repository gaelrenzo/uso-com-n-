#!/bin/bash
# ==============================================================================
# Instalador Automático - Skills sincronizadas via GitHub
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASH_DIR="$SCRIPT_DIR/termux-bash"
LINE="source \"$BASH_DIR/termux-bash.sh\""

echo "🚀 Instalando configuracion de Termux en ~/.bashrc..."

# Actualizar configuracion antigua si existe
if grep -q "skills/skills.sh" ~/.bashrc 2>/dev/null; then
  echo "🔄 Actualizando ruta antigua en ~/.bashrc..."
  sed -i 's|skills/skills.sh|termux-bash/termux-bash.sh|g' ~/.bashrc 2>/dev/null
fi

if grep -q "termux-bash/termux-bash.sh" ~/.bashrc 2>/dev/null; then
  echo "⚠️  Configuracion ya instalada en ~/.bashrc"
else
  echo "" >> ~/.bashrc
  echo "# Configuracion Termux sincronizada via GitHub" >> ~/.bashrc
  echo "$LINE" >> ~/.bashrc
  echo "✅ Configuracion anadida a ~/.bashrc"
fi

# Instalar skills para agentes IA
# Hacer ejecutables los scripts
if [ -d "$SCRIPT_DIR/scripts" ]; then
  chmod +x "$SCRIPT_DIR/scripts/"*.sh 2>/dev/null
  echo "✅ Scripts listos en scripts/"
fi

# Instalar skills para agentes IA
if [ -f "$SCRIPT_DIR/install-agent-skills.sh" ]; then
  echo ""
  bash "$SCRIPT_DIR/install-agent-skills.sh"
fi

echo ""
echo "🎉 Todo listo. Ejecuta: source ~/.bashrc"
echo "   Para actualizar: cd $SCRIPT_DIR && git pull && bash install.sh"
echo ""
echo "📚 Documentacion:"
echo "   docs/mochila-digital.md          - Guia completa de instalacion"
echo "   docs/flujo-productividad-academica-tecnica.md - Flujo diario"
