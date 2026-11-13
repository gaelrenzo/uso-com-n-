---
name: awesome-prompts
description: Técnicas de Prompt Engineering, Context Engineering y catálogo de roles especializados para LLMs y Agentes de IA. Utilízalo para optimizar prompts, estructurar instrucciones de sistema o invocar personificaciones técnicas precisas (Act as...).
source: https://github.com/ai-boost/awesome-prompts, https://github.com/f/prompts.chat
---

# Awesome Prompts — Ingeniería de Prompts y Catálogo de Roles

Habilidad orientada a la ingeniería de prompts de grado de producción y roles operativos para modelos de lenguaje y agentes autónomos, integrando las metodologías de **ai-boost/awesome-prompts** y el catálogo de roles de **f/prompts.chat**.

---

## Cuándo usar esta habilidad

- **Diseño y refinamiento de prompts:** Cuando un prompt genera respuestas vagas, incompletas o alucinaciones.
- **Configuración de agentes y system prompts:** Al definir instrucciones base de agentes, harnesses o perfiles de IA.
- **Activación de roles (Persona Prompts):** Cuando se requiere que el modelo adopte un perfil profesional estricto (*Act as a Linux Terminal, Act as Senior Software Architect, Act as Security Auditor*).
- **Control de contexto:** Cuando se necesita estructurar tareas complejas usando Chain-of-Thought (CoT), ReAct o Few-Shot Learning.

---

## Principios de Ingeniería (ai-boost)

### 1. Framework C-O-C-E (Contexto, Objetivo, Restricciones, Entrega)

Todo prompt robusto debe estructurarse en 4 cuadrantes explícitos:

```text
[CONTEXTO]: Entorno de ejecución, tecnologías, antecedentes y estado actual.
[OBJETIVO]: Meta única, clara y verificable.
[RESTRICCIONES]: Lo que NO debe hacerse, límites de alcance, estilo y formato.
[FORMATO DE ENTREGA]: Estructura exacta de la salida (JSON, Markdown, diff, pasos numerados).
```

### 2. Patrones de Razonamiento para Tareas Complejas

- **Chain-of-Thought (CoT) Delimitado:**
  Indica al modelo: *"Antes de emitir la respuesta final, desglosa el análisis en un bloque de razonamiento interno paso a paso evaluando casos de borde."*
- **ReAct (Reason + Act):**
  Estructura el flujo en iteraciones de: `Pensamiento -> Acción -> Observación -> Conclusión`.
- **Few-Shot Operacional:**
  Proporciona al menos 1 o 2 ejemplos positivos del resultado esperado para guiar el formato exacto.

### 3. Técnicas Anti-Alucinación y Robustez

1. **Admitir incertidumbre:** Especificar *"Si los datos provistos son insuficientes o ambiguos, solicita aclaración antes de asumir"*.
2. **Delimitación de datos:** Separar instrucciones de datos de entrada usando bloques de triple comilla o tags XML (`<context>`, `<input>`).
3. **Validación de salida:** Solicitar un checklist de verificación final al cierre de la respuesta.

---

## Protocolo de Activación de Roles (f/prompts.chat)

Para personificaciones técnicas tipo *"Act as..."*, utiliza la estructura canónica:

```text
Quiero que actúes como [ROL/EXPERTO]. 
Experiencia: [Nivel de seniority y especialidad].
Entorno: [Herramientas, sistema operativo o ecosistema].
Reglas operativas:
1. Responde únicamente desde la perspectiva del rol solicitado.
2. [Restricciones de formato o comandos].
3. No añadas explicaciones innecesarias a menos que se soliciten explícitamente.
Primera tarea: [Instrucción inicial].
```

---

## Recursos de Referencia

Para consultar el catálogo curado de roles técnicos y de ingeniería adaptados a este repositorio, revisa:
- [`references/prompts-guide.md`](file:///C:/Users/renzo/uso-com-n-/skills/agent-skills/awesome-prompts/references/prompts-guide.md)

## Fuentes

- **ai-boost/awesome-prompts:** https://github.com/ai-boost/awesome-prompts
- **f/prompts.chat:** https://github.com/f/prompts.chat
