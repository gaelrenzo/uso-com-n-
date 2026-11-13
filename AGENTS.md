# Instrucciones para agentes

Estas reglas aplican a todo el repositorio y complementan las instrucciones específicas de cada agente.

- Antes de editar, revisa el estado de Git y las instrucciones aplicables. Integra cambios remotos sin descartar trabajo local o ajeno.
- Limita los cambios al objetivo solicitado; no sobrescribas ni elimines archivos sin autorización explícita.
- No modifiques `node_modules/`, binarios generados ni secretos. Mantén credenciales en `.env` y configuración local en los archivos ignorados correspondientes; versiona solo plantillas seguras.
- Usa mensajes de commit breves en español. No afirmes que un push tuvo éxito hasta comprobar el resultado y la rama remota.
- Conserva la compatibilidad multiplataforma (Windows, macOS, Linux y Termux/Ubuntu) al modificar scripts o documentación; indica requisitos y comandos específicos por plataforma.
- Verifica los cambios con comprobaciones pertinentes y comunica claramente qué se verificó y qué quedó pendiente.
