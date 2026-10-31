# Troubleshooting

### Permisos de scripts en FAT32 (sdcard)

Los scripts en `/storage/emulated/0/` o `/mnt/sdcard/` no conservan permisos `+x` porque la sdcard usa FAT32. Solucion:

```bash
# Ejecutar con bash directamente
bash scripts/ucn-note.sh "tema"

# O usar el alias (ya configurado)
ucn-note "tema"
```

### Debian + XFCE no inicia

**Error: "Cannot open display"**
```bash
# Verificar que termux-x11 este corriendo
ps aux | grep termux-x11

# Reiniciar si es necesario
termux-x11 :0 -ac &
sleep 3
```

**Error: "Bus address not found"**
```bash
# Dentro de Debian, reiniciar dbus
service dbus restart
```

**Error: "PulseAudio no conecta"**
```bash
# Verificar PulseAudio
pulseaudio --kill
pulseaudio --start --exit-idle-time=-1
pacmd load-module module-native-protocol-tcp auth-ip-acl=127.0.0.1 auth-anonymous=1
```

**Pantalla negra en Termux:X11**
```bash
# Verificar que XFCE este instalado
proot-distro login debian -- apt list --installed | grep xfce4

# Si no esta, reinstalar
proot-distro login debian -- apt install -y xfce4
```

### UCN CLI no encuentra el repositorio

Asegurate de estar dentro del directorio del proyecto o ejecutar desde la raiz:
```bash
cd /mnt/sdcard/universida-datos/uso-com-n-
ucn doctor
```

### Agentes IA (codex, claude, opencode, hermes) no funcionan

Ver detalle completo: [docs/personalizacion-multi-dispositivo.md](personalizacion-multi-dispositivo.md)

```bash
# Diagnostico rapido: muestra la ruta de cada agente detectado
ucn-agents

# Codex roto por dependencia ARM64 -> reinstalar
npm install -g @openai/codex@latest

# Hermes no encontrado -> localizar y fijar ruta en config/.env
which hermes
# UCN_HERMES_BIN=/ruta/al/hermes

# La tablet y el celular se ven distintos -> verificar plataforma/rutas
source scripts/ucn-platform.sh
echo "Plataforma: $UCN_PLATFORM | Datos: $UCN_DATA_DIR"
```

### Skills no aparecen despues de sincronizar

```bash
# Forzar resincronizacion
ucn sync

# Verificar enlaces
ls -la ~/.claude/skills/
ls -la ~/.config/opencode/skills/
```

### Git pull falla en Termux

```bash
# Configurar git si no esta configurado
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"

# Verificar conexion
git remote -v
```
