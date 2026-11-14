#!/bin/bash
# ==============================================================================
# Sincronizador de Skills para Agentes IA (Linux/Termux/Ubuntu/macOS)
# Crea enlaces simbólicos (symlinks) desde el repositorio a cada agente
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_SKILLS_DIR="$SCRIPT_DIR/agent-skills"
PLATFORM_SCRIPT="$SCRIPT_DIR/../scripts/ucn-platform.sh"
[ -f "$PLATFORM_SCRIPT" ] && source "$PLATFORM_SCRIPT"
UCN_DATA_DIR="${UCN_DATA_DIR:-$HOME/universida-datos}"
UCN_SHARED_MEMORY_DIR="${UCN_SHARED_MEMORY_DIR:-$UCN_DATA_DIR/ia/memoria-compartida}"
mkdir -p "$UCN_SHARED_MEMORY_DIR/skills"

echo "🔄 Sincronizando skills de agentes desde: $REPO_SKILLS_DIR"

# Lista de directorios destino para cada agente
TARGET_DIRS=(
  "$HOME/.agents/skills"
  "$HOME/.claude/skills"
  "$HOME/.codex/skills"
  "$HOME/.config/opencode/skills"
  "$HOME/.copilot/skills"
  "$HOME/.cursor/skills"
  "$HOME/.hermes/skills"
  "$HOME/.antigravitycli/skills"
  "$HOME/.gemini/skills"
  "$HOME/.gemini/antigravity-cli/skills"
)

if [ ! -d "$REPO_SKILLS_DIR" ]; then
  echo "❌ No existe la carpeta fuente de skills: $REPO_SKILLS_DIR" >&2
  exit 1
fi

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
          # Nunca pisar un respaldo anterior; "ucn skills clean" busca el sufijo _backup
          backup_path="${dest_link}_backup"
          n=2
          while [ -e "$backup_path" ] || [ -L "$backup_path" ]; do
            backup_path="${dest_link}_${n}_backup"
            n=$((n + 1))
          done
          echo "  ⚠️ Guardando copia de seguridad de carpeta existente en: $backup_path"
          mv "$dest_link" "$backup_path"
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

shared_skill_dir="$UCN_SHARED_MEMORY_DIR/skills/ucn-shared-memory"
mkdir -p "$shared_skill_dir"
cp "$REPO_SKILLS_DIR/ucn-shared-memory/SKILL.md" "$shared_skill_dir/SKILL.md"

echo "🎉 ¡Sincronización de skills completada con éxito!"
