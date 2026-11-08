# Panel Minecraft

Panel web para crear y administrar servidores de Minecraft desde la tablet (Termux/proot), Linux o Windows.
Sin dependencias npm: solo Node 22+ y Java.

- **Paper** (plugins) o **Fabric** (mods), cualquier versión estable; descarga verificada con SHA-256.
- **Java + Bedrock**: con Geyser + Floodgate entran PC, celulares y consolas al mismo mundo.
- **Consola en vivo**, comandos, jugadores conectados (OP, whitelist, expulsar), `server.properties` desde el panel.
- **Plugins/mods de Modrinth** con un clic (incluye dependencias). Desactivar mueve el `.jar` a `.desactivados/`.
- **Respaldos** en caliente (`save-off` → `save-all flush` → tar.gz → `save-on`), automáticos cada N horas,
  rotación local y copia opcional a Drive (`ENZO1:05_Juegos_y_Ocio/Minecraft/<servidor>`, nunca se borra allá).
  Restaurar renombra el mundo actual a `*.antes-<fecha>` en vez de borrarlo.
- **playit.gg**: túnel gratis para amigos sin abrir puertos (funciona con CGNAT y datos móviles).
- **Asistente IA local** (Ollama, LM Studio, llama.cpp, fcc-server… misma detección que el escáner, `apps/escaner-ocr/public/ia.js`):
  ve la consola reciente, RAM, plugins y propiedades del servidor.

## App Android (sin escribir comandos)
Descargar en la tablet: https://github.com/gaelrenzo/uso-com-n-/releases/download/mc-panel-apk/panel-minecraft.apk
(la compila `.github/workflows/mc-panel-apk.yml` en cada cambio de `apps/mc-panel/apk/`).

La app no trae Java adentro: le pide a **Termux** (intent `RUN_COMMAND`) que arranque el panel en Ubuntu/proot
y lo abre cuando responde. Configuración de una vez (la app la muestra con botones):
1. Instalar Termux (F-Droid/GitHub) y en Termux: `echo 'allow-external-apps = true' >> ~/.termux/termux.properties; termux-reload-settings`
2. Dar a la app el permiso "Ejecutar comandos en Termux".
3. Equipo nuevo: **⬇ Instalar todo** (proot-distro + Ubuntu + Java 25/21 + Node + clona el repo en `/root/uso-com-n-`; se ve en Termux).
4. Recomendado: batería de Termux "Sin restricciones".

Después: tocar **▶ Iniciar panel**. El botón ⏻ del panel detiene los servidores guardando los mundos.
Registro del arranque: `~/mc-panel.log` en Termux.

## Uso desde terminal
```bash
cd $UCN_REPO_DIR/apps/mc-panel
tmux new -s mc 'node server.js'      # http://localhost:8095 ; Ctrl+B D para dejarlo corriendo
```
Para manejarlo desde el celular en la misma WiFi: `MC_HOST=0.0.0.0 node server.js` y abrir la URL con `?token=` que imprime.
Ctrl+C detiene los servidores con `stop` (guarda los mundos) antes de salir.

## Amigos por internet (pestaña 🌍 Amigos)
Tus amigos **no instalan nada**: abren Minecraft y escriben una dirección. El túnel gratis de playit.gg funciona
con datos móviles y sin IP pública. La pestaña guía paso a paso (solo la primera vez):
1. **Instalar agente** → **Iniciar túnel** → **Vincular** (enlace a tu cuenta gratis de playit).
2. En playit.gg → Tunnels: **Minecraft Java** → `127.0.0.1:<puerto>` y, con Bedrock, **Minecraft Bedrock** (UDP) → `127.0.0.1:<puertoBedrock>`
   (el panel muestra los puertos exactos de cada servidor).
3. Las direcciones se detectan solas de la salida del agente (o se pegan a mano) y quedan guardadas.
4. **Compartir invitación**: mensaje listo para WhatsApp con instrucciones para PC (Java) y celular/Windows (Bedrock).

Notas probadas (playit 1.2.0, Geyser 2.12, Bedrock 26.x):
- playit 1.2 separa el servicio (`playit`) de `playit-cli`; el panel ejecuta `playit-cli setup` si falta vincular.
- El túnel Bedrock gratis de playit solo soporta **RakNet**; Geyser 2.12 usa NetherNet por defecto, así que el panel
  pone `transport: both` (RakNet en el puerto Bedrock para el túnel, NetherNet en puerto+1000 para la red local).
- El panel vincula el agente como **self-managed** (`playit-cli claim … --type self-managed`): la clave de
  `playit-cli setup` es de solo lectura (`NotAllowedWithReadOnly` al crear túneles). Con self-managed, el botón
  **Crear túneles automáticamente** crea Java (TCP) y Bedrock (UDP) por la API y la dirección se detecta sola.
  La clave anterior queda como `~/.config/playit_gg/playit.toml.antes-<fecha>`.

Después, cada vez: **Iniciar servidor** y el túnel arranca solo (opción "Iniciar el túnel junto con el servidor").
Consolas (Switch/PS/Xbox) no permiten agregar servidores: necesitan [BedrockConnect](https://github.com/Pugmatt/BedrockConnect).

## Variables
| Variable | Por defecto |
|---|---|
| `PORT` / `MC_HOST` | `8095` / `127.0.0.1` (con otro host se exige el token de `MC_DATOS/token`) |
| `MC_DATOS` | `~/minecraft` (en proot es más rápido que la memoria compartida `/storage`) |
| `MC_JAVA` | `java` |
| `MC_DRIVE_REMOTO` | `ENZO1:05_Juegos_y_Ocio/Minecraft` |
| `IA_URL` / `IA_MODELO` / `IA_FORMATO` | autodetecta |

## RAM en la tablet
Con ~2 GB libres: 1024–2048 MB al servidor, `view-distance` 6 y `simulation-distance` 4 (valores iniciales).
Con menos de 3 GB asignados se quita `-XX:+AlwaysPreTouch` para que Android no mate el proceso.
Cierra apps pesadas antes de jugar; el asistente IA y el servidor compiten por la misma RAM.

## EULA
Crear un servidor exige marcar que aceptas el [EULA de Minecraft](https://aka.ms/MinecraftEULA); la fecha queda en `panel.json`.
