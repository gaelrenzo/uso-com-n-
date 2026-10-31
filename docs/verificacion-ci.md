# 🔬 Verificacion y CI (Fase 1 - Robustez)

El registro central de agentes es **`config/agents.yaml`**: Bash, PowerShell, CMD y el CLI Go resuelven los binarios con el MISMO criterio:

1. Variable `UCN_<AGENTE>_BIN` (override en `config/.env`)
2. Comando en el PATH del dispositivo
3. Rutas conocidas por plataforma (del `agents.yaml`)

### Suite de tests local

```bash
./scripts/test-all.sh        # todos los checks (build Go, bash -n, resolver, doctor, estructura)
./scripts/test-all.sh quick  # solo checks rapidos sin compilar
```

Comprueba: build Go, `bash -n` de todos los scripts, resolución de agentes, variables de entorno, detección del repositorio/notas, estructura del repo y respuesta del CLI (`doctor`/`agents`).

### CI en GitHub Actions

Cada `push`/PR a `main` ejecuta (ver `.github/workflows/ci.yml`): `gofmt`, `go vet`, `go build`, tests de parseo de `agents.yaml`, `bash -n` de todos los scripts, `shellcheck` (si está disponible) y la suite `test-all.sh quick`.

### Agregar un agente IA nuevo

Para añadir un agente (ej. `composum`) se actualiza **solo el registro central**:

```yaml
  composum:
    command: composum
    env: UCN_COMPOSUM_BIN
    wrapper: comp
    full_args: --yolo
    description: Nuevo agente
    known_paths:
      termux: ["/data/data/com.termux/files/usr/bin/composum"]
      linux: ["/usr/bin/composum"]
      windows: ["%USERPROFILE%\\.local\\bin\\composum.exe"]
```

Y el wrapper `comp() { ucn_run composum "$@"; }` en `termux-bash/ia-tools.sh`. La suite de tests y el doctor lo detectan automáticamente.

---

