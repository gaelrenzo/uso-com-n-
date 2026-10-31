# UCN CLI — Core Engine (Escrito en Go)

Este directorio contiene el código fuente de la herramienta CLI de administración unificada **`ucn`**, desarrollada en Go utilizando únicamente la biblioteca estándar para asegurar la máxima portabilidad, velocidad de ejecución y ausencia de dependencias externas.

---

## 🎯 Propósito del CLI
Reemplazar los antiguos scripts duplicados en Bash (`.sh`) y PowerShell (`.ps1`) por una única herramienta de línea de comandos multiplataforma capaz de ejecutarse de forma nativa en:
*   **Android (Termux y Ubuntu proot)**
*   **Linux**
*   **macOS**
*   **Windows (CMD y PowerShell)**

---

## 📂 Estructura del Código

```text
ucn/
├── go.mod               # Definición del módulo de Go
├── cmd/
│   └── ucn/
│       └── main.go      # Punto de entrada principal y enrutador de comandos
└── internal/
    ├── config/          # Scanner nativo para config.yaml, .env y agents.yaml
    ├── doctor/          # Diagnóstico del entorno local de desarrollo
    ├── git/             # Wrapper seguro de operaciones de Git (Safe GitOps)
    ├── sync/            # Enlazador dinámico (Symlinks en Unix / Junctions en Windows)
    └── tunnel/          # Gestor de Cloudflare Tunnels (Zero Trust)
```

---

## 🚀 Comandos Disponibles

| Comando | Acción | Detalles |
| :--- | :--- | :--- |
| **`ucn sync`** | Sincroniza las Habilidades. | Ejecuta un `git pull --rebase` automático (si está habilitado en `config.yaml`) y recrea todos los enlaces simbólicos de las skills locales hacia las carpetas de los agentes instalados. |
| **`ucn push "[mensaje]"`**| Safe GitOps Push. | Agrega cambios locales en modo seguro (usando `git add --ignore-removal` para proteger tu repositorio contra borrados accidentales locales), hace commit y sube a GitHub. |
| **`ucn doctor`** | Diagnóstico del Sistema. | Verifica plataforma, rutas de datos/notas, dependencias en PATH (`git`, `node`, `npm`, `live-server`, `cloudflared`), agentes de `config/agents.yaml` (ruta + versión), archivos de configuración y enlaces simbólicos rotos. |
| **`ucn doctor --fix`** | Corrección automática segura. | Crea `config/config.yaml` y `config/.env` desde sus `.example` si faltan, y asegura los directorios de datos/notas/informes/cursos/laboratorios. |
| **`ucn agents`** | Estado de agentes IA. | Muestra la tabla `NAME \| STATUS \| BIN` resolviendo cada agente del registro `config/agents.yaml`. |
| **`ucn skills sync`** | Enlaza las Habilidades sin `git pull`. | Lo usan `skills/sync-agent-skills.sh` y `.ps1` cuando `ucn` esta instalado. |
| **`ucn personal`** | Personalizaciones entre dispositivos. | `apply` instala reglas y ajustes del repo; `save` guarda las reglas de este equipo en el repo. |
| **`ucn secrets`** | Revision previa a publicar. | Busca credenciales y archivos privados en lo versionado. `ucn push` hace lo mismo con los cambios preparados y bloquea el commit. |
| **`ucn bootstrap`** | Preparacion de dispositivo. | Detecta plataforma, crea config desde plantillas, asegura directorios, instala el hook de shell, sincroniza skills y muestra agentes. Idempotente (reinstalable). |
| **`ucn update`** | Actualizacion del entorno. | `git fetch` + `git pull --rebase`, re-sincroniza skills de todos los agentes y reporta el estado de agentes. Con `--check` solo comprueba si hay actualizaciones. |
| **`ucn profile`** | Perfiles de especialidad. | `list` muestra los perfiles de `profiles/`, `use <nombre>` activa uno (guarda `config/.current-profile`), `current` muestra el activo, `show` el detalle (herramientas + prompt) y `export [<perfil>]` genera `config/profile-prompts/<perfil>.md` para la inyección en los wrappers. Exporta `UCN_PROFILE`. |
| **`ucn tunnel [nombre]`** | Levanta túnel Cloudflare. | Expone tu servidor local web mediante un túnel seguro de Cloudflare, utilizando el token definido en tu `.env` o la configuración del túnel especificado. |

---

## 🧪 Tests

```bash
cd ucn && go test ./internal/config/ -v -run "TestLoadAgents|TestResolveBin"
```

Desde la raíz del repo, la suite completa se corre con `./scripts/test-all.sh`.

---

## 🛠️ Compilación y Construcción

Para compilar el binario ejecutable en tu máquina local:

### Requisitos previos:
*   Tener instalado Go (versión `1.21` o superior).
    *   *Windows:* `winget install GoLang.Go`
    *   *Linux/Ubuntu:* `sudo apt install golang`
    *   *Termux:* `pkg install golang`

### Compilar para Windows:
Desde la carpeta raíz del proyecto o desde `ucn/`:
```bash
go build -o ucn.exe cmd/ucn/main.go
```

### Compilar para Linux, macOS y Termux (Android):
```bash
go build -o ucn cmd/ucn/main.go
```

El binario resultante se puede mover a tu carpeta `/usr/local/bin` (o agregar al PATH en Windows) para ejecutar `ucn` directamente desde cualquier directorio.
