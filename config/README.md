# Sistema de Configuración Desacoplado (UCN)

Este directorio gestiona la configuración de comportamiento y las credenciales del entorno de desarrollo portátil y sincronización.

El sistema utiliza una arquitectura híbrida dividida en dos archivos para garantizar la separación de conceptos y la seguridad de la información:

---

## 📂 Archivos de Configuración

| Archivo | Propósito | Estado de Versiones |
| :--- | :--- | :--- |
| **`config.yaml`** | Configuración de comportamiento y rutas del sistema. | **Excluido** (Ignorado en `.gitignore`). Se crea a partir de `config.yaml.example`. |
| **`.env`** | Credenciales, tokens y variables de entorno sensibles. | **Excluido** (Ignorado en `.gitignore`). Se crea a partir de `.env.example`. |

---

## 🛠️ Configuración Inicial

Para activar tu entorno local, realiza una copia de las plantillas de ejemplo:

```bash
# Desde la carpeta raíz del proyecto
cp config/config.yaml.example config/config.yaml
cp config/.env.example config/.env
```

---

## 📘 Detalle de Campos en `config.yaml`

### Sección `developer`
*   **`name`**: Nombre que utilizará Git globalmente para tus firmas de commits en este entorno.
*   **`email`**: Correo electrónico asociado a tu cuenta de GitHub.

### Sección `workspace`
*   **`workspace`**: Ruta del directorio de desarrollo principal de tu máquina (admite la tilde `~` para expandir automáticamente al directorio home del usuario de forma nativa en Windows/Linux).

### Sección `agents`
Lista de agentes de IA instalados en el sistema. Puedes habilitar/deshabilitar la sincronización para cada uno cambiando el parámetro `enabled` y establecer su ruta local de instalación:
*   **`claude`**: Configuración de Claude Code (habitualmente en `~/.claude`).
*   **`codex`**: Configuración de Codex CLI (`~/.codex`).
*   **`antigravity`**: Configuración de Antigravity (`~/.antigravity` o `~/.gemini/antigravity-cli`).
*   **`opencode`**: Configuración de OpenCode.

### Sección `settings`
*   **`auto_pull_on_sync`**: Si es `true`, al ejecutar `ucn sync` se realizará automáticamente un `git pull --rebase` antes de regenerar los enlaces simbólicos.
*   **`safe_push_ignore_removal`**: Si es `true`, al ejecutar `ucn push` los archivos eliminados localmente no serán removidos del repositorio remoto de GitHub (Modo Seguro).
*   **`weather_city`**: Ciudad configurada para el reporte meteorológico interactivo de tu pantalla de bienvenida (MOTD).

---

## 🔑 Detalle de Variables en `.env`

*   **`GITHUB_TOKEN`**: Token de Acceso Personal (PAT) de GitHub para autenticar push/pull si no utilizas claves SSH.
*   **`OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GEMINI_API_KEY`**: Credenciales de API utilizadas por tus respectivos agentes locales para el procesamiento de lenguaje natural.
*   **`CLOUDFLARE_TUNNEL_TOKEN`**: Token generado por la consola de Cloudflare Zero Trust para iniciar de forma segura el túnel local con `ucn tunnel`.
