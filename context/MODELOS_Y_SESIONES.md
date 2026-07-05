# Guía operativa: modelos y sesiones por fase

Referencia para Erick (no es instrucción de agente). Objetivo: gastar Fable solo donde decide, y mantener sesiones cortas.

Regla resumida: **Fable donde se decide, Opus donde se diseña, Sonnet donde se ejecuta, Haiku donde se tramita.**
Cambiar de modelo a mitad de sesión con `/model` no pierde contexto — no hace falta una sesión por modelo.

## Modelo por fase

| Fase | Modelo default | Cuándo subir de modelo |
|---|---|---|
| 0 — Fundaciones | **Sonnet** | Nunca. Scaffold Astro, tokens, fuentes, GitHub Actions: mecánico y bien documentado. |
| 1 — Contenido | **Sonnet** | Opus/Fable solo para el copy del hero y el bio (una sesión corta). Estructura y content collections: mecánicas. |
| 2 — Sistema visual | **Opus** | Fable para el primer `/impeccable craft` de cada sección (la decisión de diseño); Opus itera sobre lo planteado. |
| 3 — Pieza de firma | **Fable** | Es LA fase: `/impeccable shape` (concepto de la dataviz) e implementación inicial = mayor retorno por token del proyecto. Ajustes finos: Opus. |
| 4 — Motion | **Opus** | Fable solo si la coreografía de carga del hero no sale con carácter en Opus. Opus + `/fast` para el loop editar→mirar→ajustar. |
| 5 — QA | **Sonnet** | `/impeccable critique` final con Opus (juicio de diseño). Audits, contraste, screenshots Playwright: Sonnet. Haiku para trámite puro (mover assets, correr builds, renombrar). |

## Higiene de sesión

PRODUCT.md, DESIGN.md y CLAUDE.md son la memoria externa: toda sesión nueva los carga. Limpiar es barato — hacerlo agresivamente.

- `/clear` **al cerrar cada fase**, siempre. Antes del clear: actualizar el estado de la fase en CLAUDE.md (lo único que sobrevive es lo escrito).
- `/clear` **dentro de una fase al cambiar de superficie** (terminado el índice de proyectos → clear → contacto).
- Mantener la sesión solo mientras se itera sobre lo mismo (ahí el historial sí aporta).
- A mitad de tarea con contexto pesado: `/compact` en vez de `/clear`.
- Evitar sesiones gigantes con `[1m]`: el coste por turno es proporcional a todo el contexto acumulado, no al último mensaje. Modelo caro × contexto corto suele ganar a modelo barato × sesión eterna.

## Patrón operativo por fase

1. Sesión limpia en el modelo default de la tabla.
2. Subir a Fable solo para el momento de decisión (shape / craft inicial), bajar de vuelta con `/model`.
3. Cerrar la fase: actualizar estado en CLAUDE.md → commit → `/clear`.
