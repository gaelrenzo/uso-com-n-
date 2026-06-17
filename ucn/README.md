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
    ├── config/          # Scanner nativo para config.yaml y .env
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
| **`ucn doctor`** | Diagnóstico del Sistema. | Verifica la existencia de dependencias críticas en tu PATH (`git`, `node`, `npm`, `live-server`, `cloudflared`), valida los archivos de configuración y detecta enlaces simbólicos rotos en tus agentes. |
| **`ucn tunnel [nombre]`** | Levanta túnel Cloudflare. | Expone tu servidor local web mediante un túnel seguro de Cloudflare, utilizando el token definido en tu `.env` o la configuración del túnel especificado. |

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
