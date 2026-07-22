# Escritorio Arch Linux ARM (CachyOS Style) + XFCE + Termux:X11

Guía para instalar y ejecutar **Arch Linux ARM** con escritorio **XFCE4** y estética tipo **CachyOS** en Android vía Termux, sin necesidad de acceso root.

---

## 🎯 ¿Por qué Arch Linux / CachyOS en Tablet?

- **Mismo gestor de paquetes (`pacman`) y AUR (`yay`)** que CachyOS.
- **Rolling release**: paquetes y herramientas siempre actualizados.
- **Entorno liviano**: optimizado para procesadores ARM64 en tablets Android.

---

## 🚀 Instalación Rápida

Ejecuta el script automatizado de UCN desde tu terminal Termux:

```bash
bash /mnt/sdcard/universida-datos/uso-com-n-/scripts/install-arch-xfce.sh
```

O usando el alias de UCN:

```bash
ucn-install-arch
```

---

## 🎮 Arrancar el Escritorio Gráfico

### Método 1: Alias o Script Rápido

1. Abre la app **Termux:X11** en tu tablet.
2. En Termux ejecuta:
   ```bash
   ucn-arch
   ```
   o bien:
   ```bash
   bash ~/.shortcuts/start-arch-xfce.sh
   ```

### Método 2: Paso a Paso Manual

```bash
# 1. Iniciar servidor X11 y Audio
termux-x11 :0 -ac &
pulseaudio --start --exit-idle-time=-1
pacmd load-module module-native-protocol-tcp auth-ip-acl=127.0.0.1 auth-anonymous=1

# 2. Entrar a Arch Linux e iniciar XFCE
proot-distro login archlinux --user user --shared-tmp -- bash -lc \
  'export DISPLAY=:0; export PULSE_SERVER=tcp:127.0.0.1; dbus-launch --exit-with-session startxfce4'
```

---

## 🔑 Credenciales Predeterminadas

- **Usuario**: `user`
- **Contraseña**: `user`
- Privilegios de `sudo` habilitados sin contraseña.

Puedes cambiar la contraseña dentro de Arch Linux ejecutando `passwd`.

---

## 🛠️ Comandos Útiles en Arch Linux

```bash
# Actualizar sistema completo
sudo pacman -Syyu

# Instalar nuevos paquetes
sudo pacman -S <paquete>

# Buscar paquetes
pacman -Ss <busqueda>
```

---

## 📌 Diferencias Técnicas respecto a CachyOS Nativo de PC

1. **Kernel**: En Android (vía PRoot), se utiliza el kernel Linux de la tablet. No se pueden instalar kernels personalizados (como BORE).
2. **Arquitectura**: Se utiliza la adaptación **Arch Linux ARM64**, totalmente compatible con procesadores Snapdragon, MediaTek y Exynos.
