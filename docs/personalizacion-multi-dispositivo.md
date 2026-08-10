# Personalizacion Multi-Dispositivo UCN

> [!IMPORTANT]
> El objetivo es que **TODOS los dispositivos** (laptop Windows con PowerShell, laptop Linux, tablet Android, celular Android y cualquier dispositivo futuro) tengan **las MISMAS personalizaciones y comandos**, sin errores, y que cualquier problema que aparezca **este documentado** con su solucion.

---

## 1. Comandos IA unificados (iguales en todos los dispositivos)

Los comandos de agentes IA son **identicos** en:
- **Bash / Termux** (tablet y celular): `termux-bash/ia-tools.sh`
- **PowerShell** (laptop Windows): `laptop-powershell/Microsoft.PowerShell_profile.ps1`
- **CMD** (laptop Windows, opcional): `laptop-cmd/ucn.cmd`

| Comando | Agente | Equivalente completo |
|---|---|---|
| `codex` | Codex CLI | `codex` |
| `codex-full` | Codex sin confirmaciones | `codex --dangerously-bypass-approvals-and-sandbox` |
| `cl` | Claude Code | `claude` |
| `cl-full` | Claude Code modo yes | `claude --yes` |
| `ocode` | OpenCode | `opencode` |
| `ocode-full` | OpenCode agente build | `opencode --agent build` |
| `anti` | Antigravity | `agy` |
| `anti-full` | Antigravity sin confirmaciones | `agy --dangerously-skip-permissions` |
| `hermes` | Hermes Agent | `hermes` |
| `hermes-full` | Hermes modo yolo | `hermes --yolo` |
| `ucn-agents` | Diagnostico | Muestra ruta de cada agente detectado |

---

## 2. Como se resuelve el binario de cada agente

El resolutor busca el ejecutable en este **orden** (igual en bash y PowerShell):

1. **Variable de entorno** `UCN_<AGENTE>_BIN` definida en `config/.env`
   - Ejemplos: `UCN_CODEX_BIN=/ruta/al/codex`, `UCN_HERMES_BIN=/ruta/al/hermes`
2. **Binario en el PATH** del dispositivo (`command -v` / `type -P`, en PowerShell `Get-Command`)
3. **Rutas conocidas** por plataforma:
   - Termux: `$HOME/.codex/bin/codex`, `$HOME/.claude/local/claude`, `$HOME/.opencode/bin/opencode`, `$HOME/hermes-agent/.venv/bin/hermes`, `$HOME/.local/bin/agy`, `/usr/local/bin/...`, `/data/data/com.termux/files/usr/bin/...`
   - Windows: `%USERPROFILE%\.codex\bin\codex.exe`, `%APPDATA%\npm\codex.cmd`, `%LOCALAPPDATA%\hermes\hermes-agent\venv\Scripts\hermes.exe`

> [!TIP]
> Si un agente no esta instalado, el comando **no falla** con "command not found".
> Muestra un mensaje claro: *"El agente 'X' no esta instalado en este dispositivo.
> Instalalo o define UCN_X_BIN en config/.env"* y devuelve codigo 127.

---

## 3. Deteccion de plataforma y directorios

`scripts/ucn-platform.sh` detecta y exporta:

| Variable | Que es | Valor en Termux | Valor en Linux/macOS | Valor en Windows |
|---|---|---|---|---|
| `UCN_PLATFORM` | Plataforma | `termux` | `linux` / `macos` | `windows` |
| `UCN_DATA_DIR` | Datos del usuario | `/storage/emulated/0/universida-datos` (o `/mnt/sdcard/...`) | `~/universida-datos` | `%USERPROFILE%\universida-datos` |
| `UCN_REPO_DIR` | Raiz del repo | donde este clonado | idem | idem |
| `UCN_NOTES_DIR` | Notas | `$UCN_DATA_DIR/notas` | idem | idem |
| `UCN_CURSOS_DIR` | Cursos | `$UCN_DATA_DIR/cursos` | idem | idem |

> [!NOTE]
> **Termux bajo proot-distro (Ubuntu/Debian):** se detecta `termux` tambien cuando el bash
> corre dentro de proot, comprobando `/data/data/com.termux/files/usr`. Asi `UCN_DATA_DIR`
> apunta siempre a la SD (`/storage/emulated/0/...`) y no a `/root/universida-datos`.

---

## 4. Errores comunes y su solucion (documentados)

### 4.1 `codex` falla con "Missing optional dependency @openai/codex-linux-arm64"
- **Causa:** instalacion npm incompleta (fallta la dependencia opcional para ARM64).
- **Solucion:**
  ```shell
  npm install -g @openai/codex@latest
  codex --version   # debe imprimir codex-cli X.Y.Z
  ```

### 4.2 `hermes` no encontrado o ruta rota (`/tmp/hermes-agent/.venv/bin/hermes`)
- **Causa:** antes la ruta estaba **fija** a `/tmp/...`, que no existe en todos los dispositivos.
- **Solucion (ya corregido):** ahora se resuelve dinamicamente. Si no lo detecta:
  ```shell
  which hermes            # ubicar el binario
  # y opcionalmente fijar en config/.env:
  # UCN_HERMES_BIN=/ruta/al/hermes
  ucn-agents              # verificar deteccion
  ```

### 4.3 La tablet y el celular tienen personalizaciones "muy diferentes"
- **Causa raiz:** `ucn-platform.sh` no detectaba Termux en proot y resolvia
  `UCN_DATA_DIR=/root/universida-datos`, mientras que en Termux normal resolvia
  `/storage/emulated/0/...`. Los comandos apuntaban a carpetas distintas.
- **Solucion (ya corregido):** el detector reconoce Termux/proot y prueba varios
  puntos de montaje de la SD (`/storage/emulated/0`, `/storage/0000-0000`,
  `/mnt/sdcard`, `/data/media/0`). Ademas los agentes se resuelven por PATH.
  Para verificar en cada dispositivo:
  ```shell
  source scripts/ucn-platform.sh
  echo "$UCN_PLATFORM | $UCN_DATA_DIR"
  ucn-agents
  ```

### 4.4 `command -v codex` devuelve "codex" en vez de la ruta
- **Causa:** como `codex` ahora es una funcion (wrapper), `command -v` muestra el nombre.
- **Solucion (ya corregido):** el resolutor usa `type -P` (solo PATH) para obtener la ruta real.

### 4.5 `cl` / `claude` pide login cada vez
- **Causa:** no hay sesion guardada de Claude Code.
- **Solucion:** `claude` una vez, inicia sesion; el token queda en `~/.claude` (o `%USERPROFILE%\.claude`).

### 4.6 El venv de Python no se crea en la SD (`Permission denied: 'lib' -> .../lib64`)
- **Causa:** la SD (FUSE) no permite crear symlinks de venv.
- **Solucion:** crear el venv fuera de la SD, por ejemplo en `/tmp`:
  ```shell
  python3 -m venv /tmp/opencode/venv
  /tmp/opencode/venv/bin/pip install pymodbus
  ```

### 4.7 `ucn-update` no actualiza
- **Causa:** si se ejecuta fuera de la raiz del repo, `git pull` falla.
- **Solucion:** `ucn-update` es funcion (definida en `termux-bash/functions.sh`); usa
  `UCN_REPO_DIR` automaticamente. Si no funciona, verifica:
  ```shell
  echo "$UCN_REPO_DIR" && cd "$UCN_REPO_DIR" && git pull
  ```

---

## 5. Registro central de agentes (`config/agents.yaml`)

Desde la Fase 1 de robustez, el registro **`config/agents.yaml`** es la fuente de verdad
que consultan el CLI Go (`ucn doctor`, `ucn agents`) y los tests. Por cada agente define:

- `command` — nombre del binario en el PATH
- `env` — variable `UCN_<AGENTE>_BIN` que permite override en `config/.env`
- `wrapper` — comando corto (ej. `cl`, `ocode`, `anti`)
- `full_args` — argumentos del modo "completo" (sin confirmaciones)
- `known_paths` — rutas conocidas por plataforma (termux / linux / windows)

### Agregar un agente nuevo

1. **Instalar** el binario en cada dispositivo (o al menos en el PATH).
2. **`config/agents.yaml`**: anadir la entrada con `command`, `env`, `wrapper`,
   `full_args` y `known_paths`. El doctor y la suite de tests lo detectan solo.
3. **`termux-bash/ia-tools.sh`**: anadir su caso en `ucn_resolve` (rutas conocidas)
   y su lanzador `nombre() { ucn_run <tool> "$@"; }`.
4. **`laptop-powershell/Microsoft.PowerShell_profile.ps1`**: anadir la ruta al hash
   `$Known` de `Get-UcnAgentBin` y la funcion `nombre`.
5. Documentarlo y hacer commit; los demas dispositivos lo reciben con `ucn-update`.

---

## 6. Diagnostico automatico (Fase 1)

El CLI Go (`ucn doctor`) ya tiene diagnostico estructurado y correccion automatica:

```shell
ucn doctor          # plataforma, agentes (ruta/version), config, skills
ucn doctor --fix    # crea config/.env, config.yaml y directorios que falten
ucn agents          # tabla NAME | STATUS | BIN del registro central
ucn bootstrap       # prepara el dispositivo de cero (config, dirs, hook, skills)
```

Y la suite de tests local para validar cambios antes de subirlos:

```shell
./scripts/test-all.sh        # build Go, bash -n, resolver, doctor, estructura
./scripts/test-all.sh quick  # solo checks rapidos
```

En GitHub hay CI (`.github/workflows/ci.yml`) que corre esos mismos checks en cada push.

### Verificacion rapida manual

En cada dispositivo ejecuta tambien:
```shell
source scripts/ucn-platform.sh
echo "Plataforma: $UCN_PLATFORM | Datos: $UCN_DATA_DIR | Repo: $UCN_REPO_DIR"
ucn-agents
```

Deberia mostrar las **mismas variables** (aunque con rutas locales diferentes
y solo los agentes realmente instalados en ese dispositivo).