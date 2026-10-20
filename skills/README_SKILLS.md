# INSTRUCCIONES PARA SKILLS FUTURAS
# Guardar en: uso-com-n-/skills/README_SKILLS.md

## Flujo para agregar una skill nueva

### 1. Buscar el repositorio de origen
- Buscar en skills.sh: https://skills.sh/
- Buscar en skillsmp.com o agentskill.sh
- Buscar en GitHub: "nombre-skill SKILL.md"
- Verificar el repo tiene archivos SKILL.md

### 2. Crear la skill en agent-skills/
Copiar el SKILL.md y archivos auxiliares (scripts/, references/) dentro de:
skills/agent-skills/nombre-skill/

### 3. Agregar source: al frontmatter
SIEMPRE agregar esta línea al inicio del frontmatter YAML:

---
source: https://github.com/OWNER/REPO
name: nombre-skill
description: ...
---

### 4. Formatos de frontmatter válidos
- description: texto corto
- description: >
  texto largo
  multilinea
- description: >-
  texto con fold

### 5. Registrar en el reporte LaTeX
Agregar la skill a skills_report.tex:
- En la tabla de su categoría (hardware, ponytail, etc.)
- O en la tabla "Otros Skills" si es nueva

### 6. Recompilar PDF
pdflatex -interaction=nonstopmode skills\skills_report.tex
pdflatex -interaction=nonstopmode skills\skills_report.tex

### 7. Actualizar AGENTS.md si es necesario
Si la skill tiene comandos especiales o protocolos,
agregar en ~/.config/opencode/AGENTS.md

## Repositorios conocidos

| Categoría | Repositorio | Stars | Skills |
|-----------|-------------|-------|--------|
| Hardware/KiCad | aklofas/kicad-happy | 589 | kicad, kidoc, emc, spice, bom, datasheets, digikey, mouser, lcsc, element14, jlcpcb, pcbway |
| Anti-OVER | DietrichGebert/ponytail | 52.8K | ponytail, ponytail-audit, ponytail-debt, ponytail-gain, ponytail-help, ponytail-review |
| DevOps | obra/superpowers | 232K | systematic-debugging, writing-plans, using-superpowers |
| Agentes | wshobson/agents | 36.2K | changelog-automation, postgresql-table-design |
| Web Search | Panniantong/Agent-Reach | 43.4K | agent-reach |
| NotebookLM | teng-lin/notebooklm-py | - | notebooklm |
| Skills CLI | vercel-labs/skills | 22.6K | find-skills |
| APIs | secondsky/claude-skills | - | api-design-principles |
| Diseño | eachlabs/skills | - | floor-plan-generator |
| UI | ibossyNr1/AaaS-Vault | - | visual-design-foundations |
| Experto IA | ProfSynapse/Professor-Synapse | - | professor-synapse |
| Unknown | - | - | ingenieria-electromecanica |

## Comandos útiles

`ash
# Listar todas las skills con source
Select-String -Pattern "^source:" skills\agent-skills\*\SKILL.md

# Verificar que todas tengan source
(Get-ChildItem skills\agent-skills\*\SKILL.md | ForEach-Object {
     = Get-Content .FullName -First 3
    [PSCustomObject]@{
        Skill = .Directory.Name
        HasSource = ( -match "^source:").Count -gt 0
    }
}) | Format-Table -AutoSize

# Sync de skills (Linux/Mac)
cd skills && ./sync-agent-skills.sh

# Sync de skills (Windows)
.\sync-agent-skills.ps1
`

## Notas importantes
- El directorio agent-skills/ es la FUENTE de verdad
- Las copias en .agents/ y .claude/ son instaladas por npx skills add
- No editar las copias, editar siempre en agent-skills/
- El PDF skills_report.tex documenta todo
- Si se descubre el repo de ingenieria-electromecanica, actualizar
