---
name: betano-asistido
description: Asistente de apuestas deportivas para betano.pe en modo asistido. Calcula margen, probabilidad sin margen, value y stake (Kelly fraccional con límites de bankroll), arma el boleto, abre betano.pe en el navegador y el usuario confirma el clic final. Lleva registro de ROI. Usar cuando el usuario diga "apuesta en betano", "analiza estas cuotas", "cuánto apuesto", "arma el boleto", "registra la apuesta", "cómo voy en apuestas".
---

# Betano asistido (betano.pe)

## Alcance (no negociable)
- **Nunca** hacer login, guardar credenciales, ni colocar/confirmar apuestas automáticamente.
  Los ToS de Betano prohíben bots: hacerlo arriesga el cierre de la cuenta y la retención del saldo.
- **Nunca** hacer scraping de betano.pe. Las cuotas se obtienen así: el usuario las pega/lee de la pantalla, o se consultan con The Odds API (`odds`).
- El agente calcula, arma el boleto y abre el navegador. **El clic final lo hace el usuario.**
- Respetar los límites de `config` (stake máx. % y pérdida diaria). Si `boleto` da avisos, decírselo al usuario y no abrir el navegador salvo que lo pida explícitamente (`--forzar`).
- Sin `--prob` propia no hay value: la cuota de la casa ya trae margen. No inventar probabilidades; pedirlas al usuario o justificarlas (forma, xG, bajas, etc.).

## Script
`python3 <skill>/scripts/betano.py <cmd>` (solo stdlib). Datos en `~/.betano-asistido/` (o `$BETANO_DIR`), fuera del repo.

| Comando | Uso |
|---|---|
| `config --bankroll 200 --kelly_frac 0.25 --stake_max_pct 2 --perdida_dia_max 20 --edge_min_pct 2` | Fijar bankroll y límites (una vez) |
| `analizar --cuotas 2.10 3.30 3.60 [--prob 50 27 23]` | Margen, cuota justa, edge y stake por resultado |
| `boleto --evento "Alianza vs Universitario" --mercado 1X2 --seleccion Local --cuota 2.10 --prob 0.52 [--abrir]` | Guarda el boleto y abre betano.pe (búsqueda del evento o `--url`) |
| `confirmar <id> [--cuota-real 2.05]` | Tras el clic del usuario: registrar como pendiente |
| `resultado <id> ganada\|perdida\|nula` | Cerrar la apuesta y actualizar el bankroll |
| `resumen` | Bankroll, ROI, pendientes, pérdida de hoy |
| `odds --deporte soccer_epl` | Cuotas de mercado con `ODDS_API_KEY` (the-odds-api.com; Betano puede no estar en la lista, sirve como referencia) |
| `bookmarklet` | Imprime el `javascript:...` para guardarlo como marcador (celular y PC) |
| `importar [--archivo f\|-] [--comparar soccer_epl]` | Analiza en bloque el último `betano-*.json` de Descargas; con `--comparar` cruza con el consenso sin margen de otras casas (The Odds API) y marca value + stake |

### Importación masiva (lo permitido: un toque del usuario, sin peticiones automáticas)
1. Instalar una vez: `betano.py bookmarklet` → copiar la salida → crear marcador "Cuotas" con esa URL.
   En Chrome Android: escribir "Cuotas" en la barra de direcciones y tocar el marcador.
2. En betano.pe abrir la liga y tocar el marcador → descarga `betano-AAAAMMDD-HHMMSS.json`.
3. `betano.py importar --comparar <deporte>` → ranking de partidos; los de value pasan a `boleto`.
El parser es heurístico (nombres + cuotas del innerText). Si reconoce 0 o pocos partidos, pedir el `.json` y ajustar `parsear_texto`.
No crear scrapers headless, rotación de proxies ni evasión de antibots: es lo que lleva a cerrar la cuenta.

Apertura del navegador: `termux-open-url` (Android) → `xdg-open` (Linux) → `os.startfile` (Windows).

## Flujo
1. `resumen` para ver el bankroll y lo que queda del límite diario.
2. El usuario da las cuotas de betano.pe y su estimación → `analizar`.
3. Si hay value (edge ≥ mínimo) → `boleto ... --abrir`. Mostrar el stake y los avisos.
4. El usuario coloca la apuesta en betano.pe; si la cuota cambió, `confirmar <id> --cuota-real X`.
5. Al terminar el partido → `resultado`.

## Juego responsable
Solo mayores de 18. Si el usuario quiere subir el límite diario después de perder, o apostar para "recuperar", recordarle los límites en vez de ajustarlos en ese momento. Ayuda en Perú: línea 113 (opción 5, salud mental).
