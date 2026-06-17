#!/bin/bash
# ==============================================================================
# Sincronizador de Skills para Agentes IA (Linux/Termux/Ubuntu/macOS)
# Crea enlaces simbólicos (symlinks) desde el repositorio a cada agente
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_SKILLS_DIR="$SCRIPT_DIR/agent-skills"

echo "🔄 Sincronizando skills de agentes desde: $REPO_SKILLS_DIR"

# Lista de directorios destino para cada agente
TARGET_DIRS=(
  "$HOME/.agents/skills"
  "$HOME/.claude/skills"
  "$HOME/.codex/skills"
  "$HOME/.config/opencode/skills"
  "$HOME/.copilot/skills"
  "$HOME/.cursor/skills"
  "$HOME/.gemini/skills"
  "$HOME/.gemini/antigravity-cli/skills"
)

# Crear directorio origen si no existe
mkdir -p "$REPO_SKILLS_DIR"

# Recorrer cada skill en el repositorio
for skill_path in "$REPO_SKILLS_DIR"/*; do
  [ -d "$skill_path" ] || continue
  skill_name=$(basename "$skill_path")
  
  echo "📦 Sincronizando skill: $skill_name"
  
  for target_dir in "${TARGET_DIRS[@]}"; do
    # Determinar carpeta base del agente
    agent_base=$(dirname "$target_dir")
    if [[ "$target_dir" == *"/opencode/skills" ]]; then
      agent_base="$HOME/.config/opencode"
    fi
    
    # Si la carpeta base del agente existe (indicando que está instalado/inicializado)
    if [ -d "$agent_base" ]; then
      mkdir -p "$target_dir"
      dest_link="$target_dir/$skill_name"
      
      # Si ya existe algo en el destino
      if [ -e "$dest_link" ] || [ -L "$dest_link" ]; then
        if [ -d "$dest_link" ] && [ ! -L "$dest_link" ]; then
          echo "  ⚠️ Guardando copia de seguridad de carpeta existente en: ${dest_link}_backup"
          mv "$dest_link" "${dest_link}_backup"
        else
          rm -rf "$dest_link"
        fi
      fi
      
      # Crear enlace simbólico
      ln -s "$skill_path" "$dest_link"
      echo "  ✅ Enlazado en: $dest_link"
    fi
  done
done

echo "🎉 ¡Sincronización de skills completada con éxito!"
