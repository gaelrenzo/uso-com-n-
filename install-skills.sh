#!/bin/bash
# Alias historico: el instalador unico es install-agent-skills.sh
exec bash "$(dirname "${BASH_SOURCE[0]}")/install-agent-skills.sh" "$@"
