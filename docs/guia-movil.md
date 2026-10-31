# 📱 Guía Rápida para Dispositivos Móviles (Termux / Ubuntu)

### 1. Configurar Terminal Termux
Ejecuta la actualización inicial e instala los paquetes base en Termux:
```bash
pkg update && pkg upgrade -y
pkg install git -y
git clone https://github.com/gaelrenzo/uso-com-n-.git /storage/emulated/0/universida-datos/uso-com-n-
cd /storage/emulated/0/universida-datos/uso-com-n-
bash install.sh
source ~/.bashrc
```

### Escritorio Debian + XFCE (Termux:X11)

Ejecuta un escritorio Linux completo en Android, sin root, con la app Termux:X11.

**Instalacion:**
```bash
ucn-install-debian
# o directamente
bash /mnt/sdcard/universida-datos/uso-com-n-/scripts/install-debian-xfce.sh
```

**Arranque:**
```bash
ucn-debian
# o directamente
bash ~/.shortcuts/start-debian-xfce.sh
```

> Requiere la app **Termux:X11** descargada desde GitHub (buscar nightly release).
> Guia completa y solucion de problemas: `docs/escritorio-debian-xfce.md`

### Instalacion completa (todo incluido)

```bash
bash /storage/emulated/0/universida-datos/uso-com-n-/scripts/ucn-install-all.sh
```

Esto instala: paquetes base, Ubuntu proot, Python cientifico, agentes IA, librerias de ingenieria y UCN.

### Instalar Cloudflared (opcional)

Cloudflared permite exponer servicios locales a internet mediante tuneles seguros:

```bash
pkg install cloudflared
```

Para configurar el tunel, edita `config/.env` y agrega tu token:
```
CLOUDFLARE_TUNNEL_TOKEN=tu_token_aqui
```

Luego ejecuta:
```bash
ucn tunnel
```

### En Windows

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
Copy-Item -Path .\laptop-powershell\Microsoft.PowerShell_profile.ps1 -Destination $PROFILE -Force
```

---

