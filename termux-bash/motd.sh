# shellcheck shell=bash

[[ $- == *i* && -t 1 ]] || return 0

_ucn_motd_color() {
  if [ -t 1 ] && [ "${TERM:-}" != dumb ]; then
    printf '\033[%sm' "$1"
  fi
}

_ucn_motd_reset() {
  if [ -t 1 ] && [ "${TERM:-}" != dumb ]; then
    printf '\033[0m'
  fi
}

_ucn_motd_memory() {
  if command -v free >/dev/null 2>&1; then
    free -m 2>/dev/null | awk 'NR==2 && $2>0 {printf "%.1f/%.1f GiB (%d%%)", $3/1024, $2/1024, $3*100/$2; found=1} END {if (!found) exit 1}'
  elif [ "${UCN_PLATFORM:-}" = macos ] && command -v vm_stat >/dev/null 2>&1; then
    vm_stat 2>/dev/null | awk '
      /page size of/ {gsub(/[^0-9]/, "", $0); page=$0}
      /Pages free/ {free=$3+0}
      /Pages inactive/ {inactive=$3+0}
      /Pages speculative/ {speculative=$3+0}
      END {
        if (page > 0 && free+inactive+speculative > 0) {
          total_cmd="sysctl -n hw.memsize"; total_cmd | getline total; close(total_cmd)
          used=total-(free+inactive+speculative)*page
          printf "%.1f/%.1f GiB (%d%%)", used/1073741824, total/1073741824, used*100/total
        } else exit 1
      }'
  fi
}

_ucn_motd_agent() {
  local name="$1" tool="$2" normal="$3" full="$4"
  if command -v ucn_resolve >/dev/null 2>&1 && ucn_resolve "$tool" >/dev/null 2>&1; then
    printf '  %-15s %-10s %s\n' "$name" "$normal" "$full"
    return 0
  fi
  return 1
}

# Compacto si se pide o si la pantalla es angosta (celular en vertical)
if [ "${UCN_MOTD_COMPACT:-0}" = 1 ] || [ "${COLUMNS:-$(tput cols 2>/dev/null || echo 80)}" -lt 70 ]; then
  printf '%s UCN %s %s  %s  %s\n' "$(_ucn_motd_color '30;45')" "$(_ucn_motd_reset)" "$(date '+%a %d %b %H:%M')" "$(_ucn_motd_memory 2>/dev/null)" "${UCN_PLATFORM:-bash}"
  printf '%sucn-agents · sysinfo · btop · lazygit · z <dir>%s\n' "$(_ucn_motd_color 90)" "$(_ucn_motd_reset)"
  unset -f _ucn_motd_color _ucn_motd_reset _ucn_motd_memory _ucn_motd_agent
  return 0
fi

clear
printf '%s=====================================================%s\n' "$(_ucn_motd_color 35)" "$(_ucn_motd_reset)"
printf '        %sBienvenido de vuelta%s\n' "$(_ucn_motd_color 32)" "$(_ucn_motd_reset)"
printf '        %sUCN - Mochila Digital%s\n' "$(_ucn_motd_color 33)" "$(_ucn_motd_reset)"
printf '        %s%s%s\n' "$(_ucn_motd_color 33)" "${UCN_PLATFORM:-bash}" "$(_ucn_motd_reset)"
printf '%s=====================================================%s\n\n' "$(_ucn_motd_color 35)" "$(_ucn_motd_reset)"
printf '%sFecha:%s      %s\n' "$(_ucn_motd_color 36)" "$(_ucn_motd_reset)" "$(date '+%A, %d %B %Y')"
printf '%sHora:%s       %s\n' "$(_ucn_motd_color 36)" "$(_ucn_motd_reset)" "$(date '+%I:%M %p')"
printf '%sDirectorio:%s %s\n' "$(_ucn_motd_color 36)" "$(_ucn_motd_reset)" "$(pwd)"
printf '%sPlataforma:%s %s\n' "$(_ucn_motd_color 36)" "$(_ucn_motd_reset)" "${UCN_PLATFORM:-desconocida}"
if _ucn_motd_mem="$(_ucn_motd_memory 2>/dev/null)" && [ -n "$_ucn_motd_mem" ]; then
  printf '%sMemoria:%s    %s\n' "$(_ucn_motd_color 36)" "$(_ucn_motd_reset)" "$_ucn_motd_mem"
fi

printf '\n%sComandos rapidos:%s\n' "$(_ucn_motd_color 33)" "$(_ucn_motd_reset)"
printf '  update   = Actualiza paquetes\n  cls      = Limpia y recarga\n  ll       = Lista detallada\n  uni      = Ir a universida-datos\n  weather  = Clima en Puno\n  sysinfo  = Info del sistema\n  editui   = Editar configuracion\n'

printf '\n%sAgentes instalados:%s\n' "$(_ucn_motd_color 33)" "$(_ucn_motd_reset)"
_ucn_motd_found=0
while IFS='|' read -r _ucn_name _ucn_tool _ucn_normal _ucn_full; do
  if _ucn_motd_agent "$_ucn_name" "$_ucn_tool" "$_ucn_normal" "$_ucn_full"; then
    _ucn_motd_found=1
  fi
done <<'UCN_AGENTS'
Claude Code|claude|cl|cl-full
Codex|codex|codex|codex-full
Gemini CLI|gemini|gem|gem-full
OpenCode|opencode|ocode|ocode-full
Antigravity|agy|anti|anti-full
Hermes Agent|hermes|hermes|hermes-full
OpenClaw|openclaw|claw|-
Qwen Code|qwen|qwen|qwen-full
Crush|crush|crush|crush-full
GitHub Copilot|copilot|copilot|copilot-full
Amp|amp|amp|amp-full
iFlow|iflow|iflow|iflow-full
Aider|aider|aider|aider-full
Kimi CLI|kimi|kimi|kimi-full
Cursor Agent|cursor-agent|cursor|cursor-full
Kilo Code|kilocode|kilo|-
Augment|auggie|auggie|-
UCN_AGENTS
if [ "$_ucn_motd_found" = 0 ]; then
  printf '  No se detectaron agentes instalados.\n'
fi

printf '\n%sProductividad:%s notas | informes | cursos | labs | workspace\n' "$(_ucn_motd_color 33)" "$(_ucn_motd_reset)"
printf '%s=====================================================%s\n' "$(_ucn_motd_color 35)" "$(_ucn_motd_reset)"
unset _ucn_motd_mem _ucn_motd_found _ucn_name _ucn_tool _ucn_normal _ucn_full
unset -f _ucn_motd_color _ucn_motd_reset _ucn_motd_memory _ucn_motd_agent
