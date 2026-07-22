#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# Instalación y Configuración: Arch Linux ARM + XFCE + CachyOS Style para Termux:X11
# ==============================================================================
# Este script instala Arch Linux ARM mediante proot-distro, configura XFCE4,
# utilidades base y crea accesos directos para Termux:X11.
# ==============================================================================

set -e

echo "========================================================"
echo " 🚀 Instalando Arch Linux ARM + XFCE (CachyOS Style)"
echo "========================================================"

# 1. Paquetes base Termux
echo "[1/5] Verificando paquetes base en Termux..."
pkg update -y || true
pkg install -y proot-distro pulseaudio x11-repo termux-x11-nightly termux-api || true

# 2. Instalar Arch Linux ARM via proot-distro
echo "[2/5] Instalando Arch Linux ARM..."
if proot-distro list 2>/dev/null | grep -q "archlinux"; then
  echo "  ✅ Arch Linux ya está instalado, continuando con la configuración..."
else
  proot-distro install agners/archlinuxarm --as archlinux || proot-distro install archlinux
fi

# 3. Configurar paquetes internos de Arch Linux
echo "[3/5] Configurando paquetes y entorno dentro de Arch Linux..."
proot-distro login archlinux --shared-tmp -- bash -c '
  # Inicializar y poblar llaves de pacman
  pacman-key --init || true
  pacman-key --populate || true
  
  # Actualizar e instalar paquetes esenciales y escritorio XFCE
  pacman -Syyu --noconfirm
  pacman -S --noconfirm --needed \
    base-devel sudo git wget curl nano vim \
    dbus xfce4 xfce4-goodies firefox \
    ttf-dejavu ttf-liberation \
    pavucontrol xterm

  # Crear usuario no-root "user" con privilegios sudo
  if ! id user &>/dev/null; then
    useradd -m -g users -G wheel,video,audio -s /bin/bash user
    echo "user:user" | chpasswd
    echo "%wheel ALL=(ALL:ALL) NOPASSWD: ALL" >> /etc/sudoers
    echo "✅ Usuario creado: user / contraseña: user"
  else
    echo "  Usuario user ya existe"
  fi
'

# 4. Crear script de inicio para Termux:X11
echo "[4/5] Creando acceso rápido en ~/.shortcuts/start-arch-xfce.sh..."
mkdir -p ~/.shortcuts
cat > ~/.shortcuts/start-arch-xfce.sh <<'SHEOF'
#!/data/data/com.termux/files/usr/bin/bash
termux-wake-lock
am start --user 0 -n com.termux.x11/com.termux.x11.MainActivity 2>/dev/null || true
sleep 2
pulseaudio --start --exit-idle-time=-1 2>/dev/null || true
pacmd load-module module-native-protocol-tcp auth-ip-acl=127.0.0.1 auth-anonymous=1 2>/dev/null || true
termux-x11 :0 -ac &
sleep 3
proot-distro login archlinux --user user --shared-tmp -- bash -lc 'export DISPLAY=:0; export PULSE_SERVER=tcp:127.0.0.1; dbus-launch --exit-with-session startxfce4'
SHEOF
chmod +x ~/.shortcuts/start-arch-xfce.sh

# 5. Resumen final
echo "[5/5] ¡Instalación y configuración de Arch Linux completadas!"
echo ""
echo "========================================================"
echo " 🎮 Para INICIAR el escritorio Arch Linux:"
echo "========================================================"
echo "  1. Abre la app Termux:X11"
echo "  2. Ejecuta en Termux: bash ~/.shortcuts/start-arch-xfce.sh"
echo "     (o mediante el alias: ucn-arch)"
echo ""
echo "  Usuario predeterminado: user"
echo "  Contraseña predeterminada: user"
echo "========================================================"
