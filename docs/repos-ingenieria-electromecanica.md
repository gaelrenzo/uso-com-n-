# Repositorios de Ingenieria Electromecanica y Automatizacion Industrial

> [!NOTE]
> Todos los enlaces fueron **verificados** (HTTP 200) el 10/08/2026. Incluye la fuente de donde se obtuvo cada repositorio y su estado actual de mantenimiento.

---

## 1. Repositorios verificados y clonados localmente

Se clonaron en `_repos_herramientas/` (copia shallow, `--depth 1`, para no llenar la SD) los proyectos activos mas utiles para la especialidad:

| Repositorio | Que es | Estado | Fuente / origen |
|---|---|---|---|
| [`openplc-runtime`](https://github.com/autonomy-logic/openplc-runtime) | OpenPLC Runtime v4: PLC open source compatible IEC 61131-3 (Ladder, ST, FBD). Reemplazo oficial de OpenPLC v3. | ✅ Activo (207 stars) | [1] README de OpenPLC_v3 (end-of-life) + busqueda "open source PLC runtime IEC 61131-3" |
| [`pymodbus`](https://github.com/pymodbus-dev/pymodbus) | Stack Modbus completo en Python (TCP, RTU, TLS, UDP): cliente, servidor y simulador | ✅ Activo (2.7k stars) | [2] Lista original + busqueda verificación |
| [`Open-Industry-Project`](https://github.com/Open-Industry-Project/Open-Industry-Project) | Simulador open source de fabrica/almacen (Godot) con OPC UA, Modbus TCP, S7, ADS, MQTT | ✅ Activo (794 stars) | [3] Lista original + verificación |
| [`Automatizacion-Industrial-1`](https://github.com/IngMatiasBertero/Automatizacion-Industrial-1) | Proyecto de linea automatica para llenado de botellas (trabajo de materia) | ✅ Activo | [3] Lista original |
| [`Proyecto-de-Automatizacion-Industrial`](https://github.com/VriosiSebastianDavidd/Proyecto-de-Automatizacion-Industrial) | PLC Siemens S7-1200, TIA Portal y Factory I/O | ✅ Activo | [1] Lista original |

### Clones grandes (no subidos al repo)
- **FreeCAD** y **OpenModelica**: son aplicaciones completas (codigo fuente de cientos de MB). Para una mochila digital **no se clonan el codigo fuente**; se instalan directamente desde sus instaladores/releases:
  - FreeCAD: https://github.com/FreeCAD/FreeCAD/releases
  - OpenModelica: https://openmodelica.org/download/
- El clone de **Open-Industry-Project** pesa ~1.2 GB en disco (modelos 3D). Solo se referencia, no se versiona.

---

## 2. OpenPLC: v3 (archivado) vs v4 (actual)

> [!IMPORTANT]
> **OpenPLC_v3** (`thiagoralves/OpenPLC_v3`) fue **archivado el 04/04/2026** (read-only, end-of-life). Su README redirige al sucesor oficial:
> **[OpenPLC Runtime v4](https://github.com/autonomy-logic/openplc-runtime)** — runtime headless (REST API + motor C/C++) controlado por el [OpenPLC Editor v4](https://github.com/autonomy-logic/openplc-editor).

Quick start del runtime v4 (Docker):
```shell
docker pull ghcr.io/autonomy-logic/openplc-runtime:latest
docker run -d --name openplc-runtime -p 8443:8443 \
  --cap-add=SYS_NICE --cap-add=SYS_RESOURCE \
  -v openplc-runtime-data:/var/run/runtime \
  ghcr.io/autonomy-logic/openplc-runtime:latest
```

---

## 3. Enlaces de busqueda y topics que si funcionan

Abre estos enlaces para descubrir muchos mas repositorios (verificados 200 OK):

```text
https://github.com/topics/electrical-engineering
https://github.com/topics/mechanical-engineering
https://github.com/topics/mechatronics
https://github.com/topics/industrial-automation
https://github.com/topics/plc
https://github.com/search?q=ladder+logic+PLC&type=repositories
https://github.com/search?q=electrical+machines&type=repositories
https://github.com/search?q=power+systems+simulation&type=repositories
```

---

## 4. Repos adicionales encontrados en la busqueda (10/08/2026)

| Repositorio | Que es | Fuente / origen |
|---|---|---|
| [`IronPLC`](https://github.com/ironplc/ironplc) | Toolchain y runtime IEC 61131-3 en Rust seguro (compilador + VM + extension VS Code + servidor MCP) | [4] busqueda "open source PLC runtime IEC 61131-3" |
| [`ZPLC`](https://github.com/eduardojvieira/ZPLC) | Runtime PLC IEC 61131-3 sobre Zephyr RTOS (RP2040, STM32, ESP32) con IDE de escritorio | [4] busqueda idem |
| [`industrial-automation-projects`](https://github.com/Reaper77777/industrial-automation-projects) | Portafolio de programas IEC 61131-3 (Ladder + pseudo-ST) con simulador PLC | [5] busqueda "industrial automation PLC ladder logic" |
| [`echidna`](https://github.com/61131/echidna) | Maquina virtual IEC 61131-3 open source (antes "IEC 61131-3 Virtual Machine") | [4] busqueda idem |

---

## 5. Entorno de practica PLC + Modbus (scripts incluidos)

Los scripts de practica estan en `practicas/plc-modbus/` dentro de este repo. Simulan una linea de automatizacion completa sin hardware:

```
practicas/plc-modbus/
├── 1_servidor_plc.py        # Servidor Modbus TCP que simula un PLC (simula S7-1200/OpenPLC)
├── 2_cliente_panel.py       # Panel de operador: enciende motores, cambia velocidad, alarmas
└── 3_escaneo_rtu_futuro.py  # Polling tipo SCADA (lectura ciclica cada 2 s)
```

**Mapeo de direcciones del PLC simulado (1-based, como Modbus real):**
- Coils: 1=motor1, 2=motor2, 3=alarma, 4=principal
- Discrete: 1=START, 2=STOP, 3=nivel
- Holding: 1=vel1, 2=vel2, 3=temp
- Input: 1=contador de piezas

**Instalacion** (fuera de la SD, porque Android/Termux con FUSE no permite symlinks del venv):
```shell
python3 -m venv /tmp/opencode/venv
/tmp/opencode/venv/bin/pip install pymodbus
```

**Ejecucion** (3 terminales):
```shell
# Terminal 1 - el PLC
/tmp/opencode/venv/bin/python 1_servidor_plc.py 5020

# Terminal 2 - el panel operador
/tmp/opencode/venv/bin/python 2_cliente_panel.py 127.0.0.1 5020

# Terminal 3 - el SCADA
/tmp/opencode/venv/bin/python 3_escaneo_rtu_futuro.py 127.0.0.1 5020
```

> [!TIP]
> Nota API: en pymodbus >= 3.11 los datastores `ModbusSlaveContext`/`ModbusServerContext(slaves=...)`
> se renombraron a `ModbusDeviceContext`/`ModbusServerContext(devices=...)` y la base de direcciones empieza en 1.
> Los scripts ya usan la API moderna (probada con pymodbus 3.14.0).

---

## 6. Palabras clave de busqueda recomendadas

```text
PLC ladder logic
OpenPLC
Siemens S7-1200
Factory I/O
electrical machines MATLAB
power systems Python
industrial automation
electrical installation CAD
Modbus TCP PLC
motor control
```

---

## Referencias (fuentes de donde se saco cada repositorio)

1. Respuesta anterior con lista de repos (OpenPLC_v3, Proyecto-de-Automatizacion-Industrial) + verificacion en GitHub.
2. Repositorio oficial PyModbus (README en github.com/pymodbus-dev/pymodbus).
3. Lista de repos proporcionada por el usuario (Open-Industry-Project, Ingenieria-Electrica-UdeA, Automatizacion-Industrial-1).
4. Busqueda web "github open source programmable logic controller runtime IEC 61131-3 repository" — resultados: ironplc/ironplc, Autonomy-Logic/openplc-runtime, eduardojvieira/ZPLC, 61131/echidna.
5. Busqueda web "github repository industrial automation PLC ladder logic IEC 61131-3 open source" — resultado: Reaper77777/industrial-automation-projects.
6. OpenPLC Runtime v4 docs — https://autonomylogic.com/runtime (quick start Docker).