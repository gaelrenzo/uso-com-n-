#!/bin/bash
# UCN Skills Manager
# Instala skills en todos los agentes de IA de la laptop
# Uso: ./install-skills.sh

AGENTS=("claude" "cursor" "codex" "opencode")
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_DIR="$SCRIPT_DIR/skills/agent-skills"

echo "=== UCN Skills Manager ==="
echo ""

# List available skills
SKILLS=($(ls -d "$SKILLS_DIR"/*/ 2>/dev/null | xargs -I {} basename {}))
echo "Skills disponibles: ${#SKILLS[@]}"
echo ""

# Install to each agent
for agent in "${AGENTS[@]}"; do
    if [ "$agent" = "opencode" ]; then
        AGENT_DIR="$HOME/.config/opencode/skills"
    else
        AGENT_DIR="$HOME/.$agent/skills"
    fi
    
    mkdir -p "$AGENT_DIR"
    
    count=0
    for skill in "${SKILLS[@]}"; do
        SRC="$SKILLS_DIR/$skill"
        DST="$AGENT_DIR/$skill"
        cp -r "$SRC" "$DST" 2>/dev/null
        count=$((count + 1))
    done
    
    echo "[$agent] $count skills instaladas en $AGENT_DIR"
done

echo ""
echo "Listo! Skills instaladas en: ${AGENTS[*]}"
