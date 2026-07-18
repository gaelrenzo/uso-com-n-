# Escritorio Debian + XFCE + Termux:X11

Guía para instalar y ejecutar un escritorio Linux completo en Android vía Termux, sin root.

## Requisitos

- Termux (desde F-Droid, no Play Store)
- App Termux:X11 (descargar APK desde GitHub)
- Android 8+

## Instalación

Ejecuta el script instalador en Termux normal:

```bash
pkg update -y && pkg upgrade -y
pkg install -y proot-distro pulseaudio x11-repo termux-x11-nightly termux-api
termux-setup-storage
proot-distro install debian
```

O usa el script automatizado de UCN:

```bash
bash /mnt/sdcard/universida-datos/uso-com-n-/scripts/install-debian-xfce.sh
```

Dentro de Debian (tras `proot-distro login debian --shared-tmp`) se instalarán XFCE, Firefox y se creará el usuario normal.

## Arrancar el escritorio

### Método 1: Script rápido

```bash
bash ~/.shortcuts/start-debian-xfce.sh
```

### Método 2: Manual paso a paso

```bash
# 1. Abre la app Termux:X11
# 2. En Termux, ejecuta:
termux-x11 :0 -ac &
pulseaudio --start --exit-idle-time=-1
pacmd load-module module-native-protocol-tcp auth-ip-acl=127.0.0.1 auth-anonymous=1

# 3. Lanza el escritorio
proot-distro login debian --user user --shared-tmp -- bash -lc \
  'export DISPLAY=:0; export PULSE_SERVER=tcp:127.0.0.1; dbus-launch --exit-with-session startxfce4'
```

## Troubleshooting

### Pantalla negra y solo mouse

El servidor X está corriendo pero el escritorio no conecta.

**Solución:** Limpiar sesiones anteriores y volver a arrancar:

```bash
pkill termux-x11
pulseaudio --kill 2>/dev/null
sleep 1
pulseaudio --start --exit-idle-time=-1
pacmd load-module module-native-protocol-tcp auth-ip-acl=127.0.0.1 auth-anonymous=1
termux-x11 :0 -ac &
sleep 3
proot-distro login debian --user user --shared-tmp -- bash -lc 'export DISPLAY=:0; export PULSE_SERVER=tcp:127.0.0.1; dbus-launch --exit-with-session startxfce4'
```

### Error: "X server already running"

Otra instancia de termux-x11 está activa. Ejecuta:

```bash
pkill termux-x11
```

Y vuelve a iniciar solo la parte del escritorio.

### Error: "Activity class does not exist"

La app Termux:X11 no está instalada. Descárgala desde GitHub:

https://github.com/termux/termux-x11/releases/tag/nightly

Elige termux-x11-arm64-v8a-debug.apk

### Error: xrdb: Permission denied / Cannot open display

El usuario dentro de proot no tiene acceso a la pantalla. Asegúrate de:
- Usar `--shared-tmp` en proot-distro login
- Pasar las variables `DISPLAY=:0` y `PULSE_SERVER=tcp:127.0.0.1`
- Usar `dbus-launch --exit-with-session`

### Reset completo del escritorio

Si todo falla, desde una nueva sesión:

```bash
pkill termux-x11
pulseaudio --kill
rm -rf /tmp/.X0-lock 2>/dev/null
# Luego arranca desde cero como en "Método 2"
```

## Uso con Termux:Widget

Para tener un botón de acceso directo en el escritorio de Android:

1. Instala Termux:Widget desde F-Droid
2. El script ya se encuentra en `~/.shortcuts/start-debian-xfce.sh`
3. Agrega un widget "Termux Widget" a tu pantalla de inicio
4. Selecciona start-debian-xfce.sh

## Comandos UCN relacionados

```bash
ucn-debian           # Arrancar el escritorio
ucn-install-debian   # Ejecutar instalador
```

## Alias asociados

Definidos en `termux-bash/aliases.sh`:

```bash
alias ucn-debian="bash ~/.shortcuts/start-debian-xfce.sh"
alias ucn-install-debian="bash $UCN_DIR/scripts/install-debian-xfce.sh"
```
