#!/data/data/com.termux/files/usr/bin/bash
# =============================================
# Instalador: Debian + XFCE + Termux:X11
# =============================================
# Pegar y ejecutar en Termux normal (NO dentro de Ubuntu)
# =============================================

set -e

echo "============================================"
echo " Instalando Debian + XFCE para Termux:X11"
echo "============================================"

# --- 1. Paquetes base ---
echo "[1/5] Instalando paquetes base en Termux..."
pkg update -y
pkg upgrade -y
pkg install -y proot-distro pulseaudio x11-repo termux-x11-nightly termux-api
termux-setup-storage

# --- 2. Instalar Debian ---
echo "[2/5] Instalando Debian via proot-distro..."
proot-distro install debian

# --- 3. Configurar Debian (XFCE + usuario) ---
echo "[3/5] Configurando Debian: XFCE y usuario 'user'..."
proot-distro login debian --shared-tmp -- bash -c '
  apt update && apt upgrade -y
  apt install -y sudo dbus-x11 xfce4 xfce4-goodies firefox-esr vim nano
  if ! id user &>/dev/null; then
    useradd -m -s /bin/bash user
    echo "user:user" | chpasswd
    usermod -aG sudo user
    echo "Usuario creado: user / pass: user"
  else
    echo "Usuario user ya existe"
  fi
'

# --- 4. Script de inicio rápido ---
echo "[4/5] Creando acceso rápido en ~/.shortcuts/start-debian-xfce.sh..."
mkdir -p ~/.shortcuts
cat > ~/.shortcuts/start-debian-xfce.sh <<'SHEOF'
#!/data/data/com.termux/files/usr/bin/bash
termux-wake-lock
am start --user 0 -n com.termux.x11/com.termux.x11.MainActivity
sleep 2
pulseaudio --start --exit-idle-time=-1
pacmd load-module module-native-protocol-tcp auth-ip-acl=127.0.0.1 auth-anonymous=1
termux-x11 :0 -ac &
sleep 3
proot-distro login debian --user user --shared-tmp -- bash -lc 'export DISPLAY=:0; export PULSE_SERVER=tcp:127.0.0.1; dbus-launch --exit-with-session startxfce4'
SHEOF
chmod +x ~/.shortcuts/start-debian-xfce.sh

# --- 5. Instrucciones finales ---
echo "[5/5] Instalacion completada!"
echo ""
echo "============================================"
echo " Para ARRANCAR el escritorio:"
echo "============================================"
echo ""
echo "  1. Abre Termux:X11 (app)"
echo "  2. Ejecuta:"
echo "     bash ~/.shortcuts/start-debian-xfce.sh"
echo ""
echo "  O manualmente paso a paso:"
echo "     termux-x11 :0 -ac &"
echo "     pulseaudio --start --exit-idle-time=-1"
echo '     pacmd load-module module-native-protocol-tcp auth-ip-acl=127.0.0.1 auth-anonymous=1'
echo "     proot-distro login debian --user user --shared-tmp -- bash -lc 'export DISPLAY=:0; export PULSE_SERVER=tcp:127.0.0.1; dbus-launch --exit-with-session startxfce4'"
echo ""
echo "  Usuario: user / Contrasena: user"
echo "  (cambiala con: passwd user dentro de Debian)"
echo ""
echo "  Tip: Pon el script start-debian-xfce.sh en"
echo "  Termux:Widget para un boton de acceso directo."
echo "============================================"
