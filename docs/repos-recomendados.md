# Repos recomendados para mejorar UCN

Seleccion (oct 2026) de repos que encajan con la Mochila Digital. Verifica estrellas y
actividad en GitHub antes de adoptar algo: las cifras cambian.

## Dotfiles multi-dispositivo

| Repo | Para que sirve en UCN |
|------|-----------------------|
| [twpayne/chezmoi](https://github.com/twpayne/chezmoi) | Gestor de dotfiles con plantillas por SO; soporta Termux, Linux, macOS y Windows. Podria reemplazar los `install*.sh` + copias manuales de `termux-bash/` y `laptop-powershell/`. Secretos con `age`/`gpg`. |
| [rios0rios0/dotfiles](https://github.com/rios0rios0/dotfiles) | Ejemplo real con chezmoi para WSL + Windows 11 + Termux: el mismo trio que UCN. Buena referencia de estructura. |

Implementado: ver la seccion "Instalacion con chezmoi" del README (`home/` es la raiz de chezmoi).

## Skills y agentes IA

| Repo | Para que sirve en UCN |
|------|-----------------------|
| [anthropics/skills](https://github.com/anthropics/skills) | Skills oficiales y especificacion de `SKILL.md`. Referencia para validar las de `skills/agent-skills/`. |
| [hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) | Lista curada: skills, agentes, statuslines, hooks, plugins. |
| [jqueryscript/awesome-claude-code](https://github.com/jqueryscript/awesome-claude-code) | Lista curada con changelog mensual. |
| [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) | ~200 skills seleccionadas por calidad, multi-agente. |
| [sickn33/agentic-awesome-skills](https://github.com/sickn33/agentic-awesome-skills) | Biblioteca grande (+1900) con instalador para Claude, Codex, Gemini, Cursor. Usar con criterio: revisar cada skill antes de instalar. |
| [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) | Skills de automatizacion de flujos, agnosticas del agente. |

## Termux

| Repo | Para que sirve en UCN |
|------|-----------------------|
| [adrianogil/awesome-termux](https://github.com/adrianogil/awesome-termux) | Lista general por categorias (apps, lenguajes, utilidades). |
| [T4P4N/Awesome-Termux](https://github.com/T4P4N/Awesome-Termux) | Scripts, shells, Termux-WebUI, Termux-ADB. |

## Ingenieria electronica

Ver [repos-ingenieria-electromecanica.md](repos-ingenieria-electromecanica.md) (OpenPLC, Modbus, KiCad, SPICE).
