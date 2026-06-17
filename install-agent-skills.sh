#!/bin/bash
# ==============================================================================
# Instalador de Skills para Agentes IA
# Copia las skills/config de skills/agents/ a cada herramienta
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
AGENTS_DIR="$SCRIPT_DIR/skills/agents"

echo "🚀 Instalando skills para agentes IA..."

# ─── Claude Code ───
if command -v claude &>/dev/null; then
  RULES_DIR="$HOME/.claude/rules"
  mkdir -p "$RULES_DIR"
  if [ -d "$AGENTS_DIR/claude" ]; then
    cp "$AGENTS_DIR/claude"/*.md "$RULES_DIR/" 2>/dev/null
    echo "  ✅ Claude Code: $(ls "$AGENTS_DIR/claude"/*.md 2>/dev/null | wc -l) reglas instaladas"
  fi
else
  echo "  ⏭️  Claude Code no instalado"
fi

# ─── OpenCode ───
if command -v opencode &>/dev/null; then
  SKILLS_DIR="$HOME/.opencode/skills"
  mkdir -p "$SKILLS_DIR"
  if [ -d "$AGENTS_DIR/opencode" ]; then
    cp "$AGENTS_DIR/opencode"/*.js "$SKILLS_DIR/" 2>/dev/null
    cp "$AGENTS_DIR/opencode"/instrucciones.md "$SKILLS_DIR/" 2>/dev/null
    echo "  ✅ OpenCode: $(ls "$AGENTS_DIR/opencode"/*.js 2>/dev/null | wc -l) skills instaladas"
  fi
else
  echo "  ⏭️  OpenCode no instalado"
fi

# ─── Codex ───
if command -v codex &>/dev/null; then
  echo "  📝 Codex: instrucciones en skills/agents/codex/"
  echo "    Codex no tiene un directorio de skills fijo."
  echo "    Revisa: codex plugin --help para mas opciones"
else
  echo "  ⏭️  Codex no instalado"
fi

# ─── Antigravity ───
if command -v agy &>/dev/null; then
  AGY_CONFIG_DIR="$HOME/.config/agy"
  mkdir -p "$AGY_CONFIG_DIR"
  if [ -f "$AGENTS_DIR/agy/config.yaml" ]; then
    cp "$AGENTS_DIR/agy/config.yaml" "$AGY_CONFIG_DIR/"
    echo "  ✅ Antigravity: config instalada"
  fi
else
  echo "  ⏭️  Antigravity no instalado"
fi

# ─── Shared Agent Skills (api-design-principles, bom, etc.) ───
if [ -f "$SCRIPT_DIR/skills/sync-agent-skills.sh" ]; then
  bash "$SCRIPT_DIR/skills/sync-agent-skills.sh"
fi

echo ""
echo "🎉 Skills de agentes instaladas."
echo "   Para actualizar: cd $(dirname "$0") && git pull && bash install-agent-skills.sh"

