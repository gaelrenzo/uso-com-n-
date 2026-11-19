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

# --- Fuente unica de personalizacion (config/terminal-ui.conf) ---
_ucn_motd_ui_file() {
  local f
  if [ -n "${UCN_REPO_DIR:-}" ]; then
    f="$UCN_REPO_DIR/config/terminal-ui.conf"
    if [ -f "$f" ]; then
      printf '%s\n' "$f"
      return 0
    fi
  fi
  f="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." 2>/dev/null && pwd)/config/terminal-ui.conf"
  [ -f "$f" ] && printf '%s\n' "$f"
}

_ucn_motd_ui_text() {
  awk -F'|' -v t="$1" -v k="$2" '{sub(/\r$/,"")} $1==t && $2==k {print $3; exit}' "$3"
}

# Compacto si se pide o si la pantalla es angosta (celular en vertical)
if [ "${UCN_MOTD_COMPACT:-0}" = 1 ] || [ "${COLUMNS:-$(tput cols 2>/dev/null || echo 80)}" -lt 70 ]; then
  printf '%s UCN %s %s  %s  %s\n' "$(_ucn_motd_color '30;45')" "$(_ucn_motd_reset)" "$(date '+%a %d %b %H:%M')" "$(_ucn_motd_memory 2>/dev/null)" "${UCN_PLATFORM:-bash}"
  printf '%sucn-agents · sysinfo · btop · lazygit · z <dir>%s\n' "$(_ucn_motd_color 90)" "$(_ucn_motd_reset)"
  unset -f _ucn_motd_color _ucn_motd_reset _ucn_motd_memory _ucn_motd_ui_file _ucn_motd_ui_text
  return 0
fi

_ucn_motd_ui="$(_ucn_motd_ui_file)"
_ucn_motd_title="UCN - Mochila Digital"
_ucn_motd_welcome="Bienvenido de vuelta"
[ -n "$_ucn_motd_ui" ] && _ucn_motd_title="$(_ucn_motd_ui_text label title "$_ucn_motd_ui")"
[ -n "$_ucn_motd_ui" ] && _ucn_motd_welcome="$(_ucn_motd_ui_text label welcome "$_ucn_motd_ui")"

clear
printf '%s=====================================================%s\n' "$(_ucn_motd_color 35)" "$(_ucn_motd_reset)"
printf '        %s%s%s\n' "$(_ucn_motd_color 32)" "$_ucn_motd_welcome" "$(_ucn_motd_reset)"
printf '        %s%s%s\n' "$(_ucn_motd_color 33)" "$_ucn_motd_title" "$(_ucn_motd_reset)"
printf '        %s%s%s\n' "$(_ucn_motd_color 33)" "${UCN_PLATFORM:-bash}" "$(_ucn_motd_reset)"
printf '%s=====================================================%s\n\n' "$(_ucn_motd_color 35)" "$(_ucn_motd_reset)"
printf '%sFecha:%s      %s\n' "$(_ucn_motd_color 36)" "$(_ucn_motd_reset)" "$(date '+%A, %d %B %Y')"
printf '%sHora:%s       %s\n' "$(_ucn_motd_color 36)" "$(_ucn_motd_reset)" "$(date '+%I:%M %p')"
printf '%sDirectorio:%s %s\n' "$(_ucn_motd_color 36)" "$(_ucn_motd_reset)" "$(pwd)"
printf '%sPlataforma:%s %s\n' "$(_ucn_motd_color 36)" "$(_ucn_motd_reset)" "${UCN_PLATFORM:-desconocida}"
if _ucn_motd_mem="$(_ucn_motd_memory 2>/dev/null)" && [ -n "$_ucn_motd_mem" ]; then
  printf '%sMemoria:%s    %s\n' "$(_ucn_motd_color 36)" "$(_ucn_motd_reset)" "$_ucn_motd_mem"
fi

if [ -z "$_ucn_motd_ui" ]; then
  printf '\n%sNo se encontro config/terminal-ui.conf%s\n' "$(_ucn_motd_color 33)" "$(_ucn_motd_reset)"
else
  printf '\n%s%s:%s\n' "$(_ucn_motd_color 33)" "$(_ucn_motd_ui_text section commands "$_ucn_motd_ui")" "$(_ucn_motd_reset)"
  while IFS='|' read -r _ucn_kind _ucn_name _ucn_desc _; do
    [ "$_ucn_kind" = command ] || continue
    _ucn_desc="${_ucn_desc%$'\r'}"
    printf '  %s%-15s%s= %s\n' "$(_ucn_motd_color 32)" "$_ucn_name" "$(_ucn_motd_reset)" "$_ucn_desc"
  done < "$_ucn_motd_ui"

  printf '\n%s%s:%s\n' "$(_ucn_motd_color 33)" "$(_ucn_motd_ui_text section agents "$_ucn_motd_ui")" "$(_ucn_motd_reset)"
  _ucn_motd_found=0
  while IFS='|' read -r _ucn_kind _ucn_name _ucn_tool _ucn_normal _ucn_full; do
    [ "$_ucn_kind" = agent ] || continue
    _ucn_full="${_ucn_full%$'\r'}"
    if command -v ucn_resolve >/dev/null 2>&1 && ucn_resolve "$_ucn_tool" >/dev/null 2>&1; then
      printf '  %-15s %s%-8s%s %s%-12s%s\n' "$_ucn_name" "$(_ucn_motd_color 32)" "$_ucn_normal" "$(_ucn_motd_reset)" "$(_ucn_motd_color 33)" "$_ucn_full" "$(_ucn_motd_reset)"
      _ucn_motd_found=1
    fi
  done < "$_ucn_motd_ui"
  if [ "$_ucn_motd_found" = 0 ]; then
    printf '  No se detectaron agentes instalados.\n'
  fi

  printf '\n%s%s:%s ' "$(_ucn_motd_color 33)" "$(_ucn_motd_ui_text section productivity "$_ucn_motd_ui")" "$(_ucn_motd_reset)"
  _ucn_motd_first=1
  while IFS='|' read -r _ucn_kind _ucn_name _ucn_desc; do
    [ "$_ucn_kind" = nav ] || continue
    if [ "$_ucn_motd_first" = 1 ]; then
      _ucn_motd_first=0
    else
      printf ' | '
    fi
    printf '%s' "$_ucn_name"
  done < "$_ucn_motd_ui"
  printf '\n'
fi

printf '%s=====================================================%s\n' "$(_ucn_motd_color 35)" "$(_ucn_motd_reset)"
unset _ucn_motd_ui _ucn_motd_title _ucn_motd_welcome _ucn_motd_mem _ucn_motd_found _ucn_motd_first
unset _ucn_kind _ucn_name _ucn_tool _ucn_normal _ucn_full _ucn_desc
unset -f _ucn_motd_color _ucn_motd_reset _ucn_motd_memory _ucn_motd_ui_file _ucn_motd_ui_text
