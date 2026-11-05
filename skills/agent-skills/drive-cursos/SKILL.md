---
name: drive-cursos
description: Sube a Google Drive los archivos universitarios del celular, clasificándolos por semestre y curso (S01–S10). Usar cuando el usuario diga "sube a mi drive", "ordena en mi drive", "ponlo en S09 / en el curso X", "sube todo lo del celular al drive", "clasifica por curso", o al terminar un trabajo (temario, informe, examen) que deba quedar en la carpeta del curso.
---

# Subir al Drive por curso

## Estructura de Drive (remoto rclone `gdrive:`)
```
01_Universidad_FIME/
  00_Admin/  00_Plantillas_LaTeX/  98_Por_Clasificar/  99_Personal/
  S01_Semestre … S10_Semestre/
    <Curso>/                      (nombre con tildes, p.ej. "Centrales Termoeléctricas")
      01_Silabo_y_Planificacion/  02_Teoria_y_Diapositivas/  03_Bibliografia_y_Textos/
      04_Practicas_y_Laboratorios/ 05_Tareas_y_Proyectos/   06_Examenes_y_Evaluaciones/
      07_Software_y_Scripts/      08_Recursos_y_Repositorios/
02_Software_y_Herramientas/ 03_Idiomas_y_Cursos/ 04_Comites_y_Proyectos/ 05_Juegos_y_Ocio/ 06_Personal_y_Otros/
```
Semestre actual: **S09 = 2026-II** (S08 = 2026-I, S07 = 2025-II, S06 = 2025-I).

## Rutas locales por dispositivo (el script las detecta solo)
| Dispositivo | Carpeta local `Universidad_FIME` | Cache/plan/log |
|---|---|---|
| Android (Termux/proot) | `/storage/emulated/0/Documents/Universidad_FIME` | `~/reorg_cel/drive_cursos` |
| Linux | `~/Documents/Universidad_FIME` o `~/Documentos/…` | `~/.drive-cursos` |
| Windows | `%USERPROFILE%\Documents\Universidad_FIME` (o `OneDrive\Documents`) | `%USERPROFILE%\.drive-cursos` |

Dentro: `Sxx_Semestre/<Curso_sin_tildes>/`, `00_Admin/`, `00_Plantillas_LaTeX/`, `98_Por_Clasificar/<tema>/`.
Remoto: `gdrive:` (o el primer remoto de rclone con "drive" en el nombre). Si algo no se detecta, usar
`--local`, `--remoto`, `--trabajo` o las variables `DRIVE_CURSOS_LOCAL/REMOTO/TRABAJO`.
Requisitos: `python3`, `rclone` configurado con Google Drive; opcional `pdftotext` (poppler) para leer PDFs.
Primero siempre: `python3 <skill>/scripts/clasificar_subir.py --diagnostico`.

## Reglas
- Solo copiar: `rclone copy/copyto --ignore-existing`. Nunca `sync`, nunca `delete`, nunca sobrescribir.
- No borrar ni mover nada local sin confirmación (excepto ordenar un trabajo recién creado en su carpeta de curso).
- No usar `rclone link` (deja el archivo público). Para dar un enlace, usar el conector de Google Drive (`search_files` → `viewUrl`).
- Saltar temporales LaTeX (`.aux .log .out .toc .synctex.gz …`).
- Lo que no tenga curso claro va a `98_Por_Clasificar/Desde_celular_AAAA-MM/`, nunca a un curso adivinado.
- Subidas grandes (>100 MB) en segundo plano y verificar al final con `rclone lsf`.

## Caso 1: un trabajo nuevo (temario, informe, examen)
1. Identificar curso y tipo (tarea → `05_Tareas_y_Proyectos`, examen → `06_…`, laboratorio → `04_…`).
2. Guardar local en `…/Sxx_Semestre/<Curso>/<Nombre_trabajo>/` (compilar LaTeX ahí, borrar temporales).
3. `rclone copy "<carpeta local>" "gdrive:01_Universidad_FIME/Sxx_Semestre/<Curso>/05_Tareas_y_Proyectos/<Nombre_trabajo>" --ignore-existing`
4. Si se creó un Google Doc con el conector, moverlo a esa misma carpeta (`rclone moveto` del `.docx` que muestra rclone; mueve el Doc nativo).
5. Verificar con `rclone lsf` y avisar la ruta.

## Caso 2: subir todo lo local clasificando por curso
Script: `scripts/clasificar_subir.py` (en esta skill). `S` = `~/.claude/skills/drive-cursos/scripts`.
```bash
python3 $S/clasificar_subir.py --diagnostico           # rutas detectadas
python3 $S/clasificar_subir.py --refrescar             # prueba en seco, relista Drive (~2 min)
# revisar <trabajo>/plan.md  (estados: SUBIR / YA_EN_DRIVE / OMITIR_TEMPORAL)
nohup python3 $S/clasificar_subir.py --subir > <trabajo>/salida.txt 2>&1 &      # Linux/Android
python3 $S/clasificar_subir.py --solo "<ruta>"          # solo una carpeta o archivo
```
Windows (PowerShell): `python $env:USERPROFILE\.claude\skills\drive-cursos\scripts\clasificar_subir.py --subir`
(para segundo plano: `Start-Process python -ArgumentList '…\clasificar_subir.py','--subir' -WindowStyle Hidden`).
Cómo clasifica:
- Archivos ya dentro de `Sxx_Semestre/<Curso>/` → misma carpeta de curso en Drive (empareja nombres sin tildes).
- `98_Por_Clasificar`: lee el texto (pdftotext, docx/pptx/xlsx, tex) y puntúa: nombre exacto del curso en el nombre del archivo (+10) o en el texto (+8, solo cursos de 2+ palabras y en las primeras ~3000 letras), frases clave (+2 c/u, diccionario `KW`). Si empata, desempata por la fecha (semestre). Menos de 4 pts o empate → `98_Por_Clasificar/Desde_celular_AAAA-MM/`.
- Omite archivos cuyo MD5 ya existe en cualquier parte de `01_Universidad_FIME`.
- Para mejorar la clasificación, añadir frases al diccionario `KW` del script.
- Correcciones puntuales: `<trabajo>/excepciones.tsv` (`ruta_local<TAB>destino`; destino vacío = 98).

Lo no universitario (Libros, Juegos, APK, fotos, videos) no lo clasifica este script: en el celular se sube con `~/reorg_cel/subir_todo.sh` (pasos 3–10); en otros equipos, `rclone copy <carpeta> gdrive:06_Personal_y_Otros/<…> --ignore-existing`.

## Prompt para pedirlo
> Sube a mi Drive todo lo nuevo del celular clasificado por curso (skill drive-cursos). Primero prueba en seco y muéstrame el resumen por curso; los que no tengan curso claro déjalos en 98_Por_Clasificar. Solo copiar, sin borrar ni sobrescribir.

> Este trabajo es del curso <Curso>, S09: ordénalo en su carpeta local y en Drive (05_Tareas_y_Proyectos/<Nombre>).
