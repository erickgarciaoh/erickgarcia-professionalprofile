# Guía operativa: modelos y sesiones por fase

Referencia para Erick (no es instrucción de agente). Objetivo: gastar Fable solo donde se decide, y mantener sesiones cortas.

Regla resumida: **Fable donde se decide, Opus donde se diseña, Sonnet donde se ejecuta, Haiku donde se tramita.**
Cambiar de modelo a mitad de sesión con `/model` no pierde contexto — no hace falta una sesión por modelo.

---

## v1 (fases 0–5 de CLAUDE.md) — COMPLETADA 2026-07-06

Tabla original archivada al final del archivo. Lo aprendido se hereda abajo.

---

## v2 — Animaciones (blueprint: `docs/V2-ANIMATION-BLUEPRINT.md`)

La decisión de diseño ya está tomada (el blueprint la hizo Fable). Lo que queda es **ejecución
contra spec con criterio de aceptación binario** → el default de la v2 es Sonnet, no Opus.
Subir de modelo solo donde hay juicio visual en vivo (loop editar→mirar→ajustar) o donde el
resultado salga plano.

### Modelo y sesiones por fase

Una fila = una sesión de Claude Code. `/clear` al terminar cada fila, sin excepción.

| Sesión | Tareas | Modelo | Notas |
|---|---|---|---|
| F1-A | P1-01, P1-02 | **Sonnet** | Split de index.astro + headline estático. Mecánico, cero diseño nuevo. |
| F1-B | P1-03, P1-04 | **Sonnet** | WhatIDo + WhatIBuild estáticos. El contenido exacto está en §2.2/§2.3; no hay que inventar. |
| F1-C | P1-05 | **Opus** | La ÚNICA tarea de fase 1 con diseño real: componer las 4 escenas SVG finales del pipeline. Si sale plano o genérico → subir a Fable en la misma sesión y volver a bajar. |
| F1-D | P1-06, P1-07, P1-08 | **Sonnet** | Metrics + Toolkit + disolver #profile. Verificar el AC de P1-08 (ninguna frase perdida) antes del commit. |
| F2 | P2-01, P2-02, P2-03 | **Sonnet** | Infra GSAP+Lenis+reveal. Contratos exactos en §1.3/§1.4. P2-01 instala dependencias: confirmar antes. |
| F3-A | P3-01, P3-02, P3-03 | **Sonnet** | RotatingWord, Counter, terminales. Si el *feel* del RotatingWord no convence → `/model` a Opus + `/fast` para iterar mirando el navegador, y bajar. |
| F3-B | P3-04, P3-05, P3-06, P3-07 | **Sonnet** | Mouse-preview, magnético, pausa marquee, SectionNav. Mismo criterio: Opus+`/fast` solo si el ajuste fino lo pide. |
| F4-A | P4-01 | **Opus** | Kinetic typography scrubbed: el timing con scroll real se juzga con los ojos. `/fast` para el loop. |
| F4-B | P4-02, P4-03 | **Opus** | El momento estrella. Fable SOLO si tras 2–3 iteraciones las escenas no tienen carácter — y para eso, mejor sesión nueva corta con screenshot del estado actual. |
| F5-A | P5-01, P5-02, P5-03 | **Sonnet** | Pases reduced-motion / no-JS / screenshots: checklist, no juicio. |
| F5-B | P5-04, P5-05 | **Sonnet** | Perf + a11y. Son mediciones contra umbral, no diseño. |
| F5-C | `/impeccable critique` + P5-06 | **Opus** | Juicio de diseño final sobre la página completa + actualizar CLAUDE.md al plan v2 (requiere tu sign-off). Haiku no aplica aquí; el trámite de P5-06 es trivial pero va pegado al critique. |

Presupuesto aproximado de sesiones caras: 3 de Opus concentradas (F1-C, F4-A, F4-B) + 1 de cierre (F5-C). Todo lo demás es Sonnet.

### Pausas obligatorias (checkpoint entre sesiones)

Al cerrar cada sesión de la tabla, en este orden:

1. Verificar el AC de cada tarea de la sesión (son binarios: se cumplen o no).
2. Marcar las tareas hechas en el backlog del blueprint (añadir `✅` al inicio de la celda "Task").
3. `pnpm build` en verde → commit (mensaje en español, una tarea o sesión por commit).
4. `/clear`. Lo único que sobrevive es lo escrito en el repo — por eso el paso 2 no es opcional.

Pausas de fase (entre F1→F2, F2→F3, F3→F4, F4→F5): además de lo anterior, abrir el sitio con
`pnpm dev` y recorrerlo entero una vez ANTES de arrancar la fase siguiente. Es tu control de
"¿sigue pareciéndose a lo que quiero?" — más barato corregir rumbo aquí que a mitad de la fase 4.

### Higiene de sesión (heredada de v1, sigue vigente)

- CLAUDE.md + blueprint son la memoria externa; toda sesión nueva los carga. Limpiar es barato.
- Mantener la sesión solo mientras se itera sobre lo mismo (ahí el historial sí aporta).
- A mitad de tarea con contexto pesado: `/compact` en vez de `/clear`.
- Evitar sesiones gigantes con `[1m]`: el coste por turno es proporcional a todo el contexto
  acumulado. Modelo caro × contexto corto gana a modelo barato × sesión eterna.
- `/fast` existe solo en Opus: úsalo en los loops visuales (editar→screenshot→ajustar), no para razonar.

### Prompt plantilla para cada sesión v2

Sustituir `{SESIÓN}` y `{TAREAS}` según la tabla. No hace falta pegar contexto del proyecto: el
blueprint es la fuente de verdad y el prompt obliga a leerlo.

```text
Sesión {SESIÓN} de la v2 del landing. Implementa EXACTAMENTE estas tareas del backlog de
docs/V2-ANIMATION-BLUEPRINT.md: {TAREAS}. Nada más.

Antes de tocar código: lee el §4 (guardarraíles, vinculantes) y la spec §2.x que cada tarea
referencia. Las decisiones ya están tomadas en el blueprint — no las re-discutas ni "mejores"
el plan; puedes adaptar detalles de implementación solo si el criterio de aceptación y las
restricciones duras se siguen cumpliendo.

Reglas de la sesión:
- Una tarea a la vez, en orden. Al terminar cada una: verifica su criterio de aceptación
  (es binario), márcala con ✅ en la tabla del backlog del blueprint y commitea (mensaje en
  español, código/comentarios en inglés).
- pnpm siempre; no instales nada que el blueprint no liste sin preguntarme.
- No adelantes trabajo de fases posteriores aunque "quede cerca".
- `pnpm build` en verde antes de cada commit; si hay QA visual, usa Playwright.
- Al cerrar la última tarea: resumen de 3 líneas de qué quedó hecho y qué sesión sigue.
```

### Prompt inicial (sesión F1-A — copiar tal cual en sesión nueva con Sonnet)

```text
Sesión F1-A de la v2 del landing. Implementa EXACTAMENTE estas tareas del backlog de
docs/V2-ANIMATION-BLUEPRINT.md: P1-01 y P1-02. Nada más.

Antes de tocar código: lee el §4 (guardarraíles, vinculantes), el §1.2 (dónde vive cada cosa)
y la spec §2.1. Las decisiones ya están tomadas en el blueprint — no las re-discutas ni
"mejores" el plan; puedes adaptar detalles de implementación solo si el criterio de aceptación
y las restricciones duras se siguen cumpliendo.

Contexto mínimo: P1-01 es un refactor sin cambio visual — extraer las secciones existentes de
src/pages/index.astro a componentes en src/components/sections/ y dejar placeholders estáticos
para las secciones nuevas, en el orden del §2. P1-02 añade el headline estático del hero con la
palabra final "decisions" (la rotación llega en P3-01, no la implementes).

Reglas de la sesión:
- Una tarea a la vez, en orden. Al terminar cada una: verifica su criterio de aceptación
  (es binario), márcala con ✅ en la tabla del backlog del blueprint y commitea (mensaje en
  español, código/comentarios en inglés).
- pnpm siempre; en esta sesión NO se instala ninguna dependencia.
- No adelantes trabajo de fases posteriores aunque "quede cerca": nada de GSAP, Lenis ni reveals.
- `pnpm build` en verde antes de cada commit; compara el HTML renderizado de hero/projects/contact
  antes y después del split (el AC de P1-01 exige equivalencia funcional).
- Al cerrar P1-02: resumen de 3 líneas y confirma que la siguiente sesión es F1-B (P1-03, P1-04).
```

---

## v3 — Rediseño post-feedback (blueprint: `docs/V3-REDESIGN-BLUEPRINT.md`)

A diferencia de la v2, aquí hay MÁS diseño nuevo (asset del hero, escenas de tarjetas, modelo
lista+panel) → el centro de gravedad sube de Sonnet a Opus. Fable solo en dos puntos: el concepto
del asset de firma (P2-01, la decisión de mayor retorno de la v3) y el rescate si algo sale plano.

### Modelo y sesiones por fase

Una fila = una sesión de Claude Code. `/clear` al terminar cada fila, sin excepción.

| Sesión | Tareas | Modelo | Notas |
|---|---|---|---|
| F0 | P0-01 | **Sonnet** | Fix de layout con causa raíz ya diagnosticada en el blueprint (§2.0) + restyle con spec cerrada. Verificar alineación con Playwright y desplegar. |
| F1-A | P1-01 | **Sonnet** | Mecánica del layout fluido: contrato exacto en §1.2. Auditoría de max-width es checklist, no juicio. |
| F1-B | P1-02 | **Opus** | Composición wide por sección: cómo llena cada sección 1920/2560 SÍ es juicio visual. `/fast` para el loop screenshot→ajuste. |
| F2-A | P2-01 | **Fable** | `/impeccable shape` del asset de firma + decisión del ámbar del hero. LA sesión cara de la v3; termina con §2.2.1 escrito en el blueprint y tu OK. |
| F2-B | P2-02 | **Sonnet** | Hero estático + retiros (WeeklyPulse, RotatingWord, JSON). Copy ya cerrado en §2.2; es ejecución + higiene de borrado. |
| F2-C | P2-03 | **Opus** | Implementar el asset contra §2.2.1. Loop visual con `/fast`. Subir a Fable solo si tras 2–3 iteraciones no tiene carácter. |
| F3-A | P3-01 | **Opus** | Las tres escenas de What I do son diseño de motion nuevo (la sección "triste" — no puede salir plana otra vez). |
| F3-B | P3-02, P3-03 | **Sonnet** | Mover PipelineSteps (relocación + regresión) y Promise (mecánica de scrub ya existente, copy cerrado). |
| F4-A | P4-01, P4-02 | **Sonnet** | Schema + layout estático lista/panel. P4-01 te pedirá los dataset sizes de 3 proyectos: tenlos a mano. |
| F4-B | P4-03 | **Opus** | El feel del switching (crossfade, dimming, timing) se juzga con los ojos. `/fast`. |
| F5 | P5-01 | **Sonnet** | Banda de métricas: CSS-only contra spec. |
| F6-A | P6-01, P6-02 | **Sonnet** | Pases reduced-motion/no-JS + screenshots 5 anchos: checklist. |
| F6-B | P6-03, P6-04 | **Sonnet** | Perf + a11y: mediciones contra umbral. |
| F6-C | `/impeccable critique` + P6-05 | **Opus** | Juicio final sobre la página completa (con especial atención a 1920/2560, lo que falló en v2) + cierre de CLAUDE.md con tu sign-off. |

Presupuesto de sesiones caras: 1 de Fable (F2-A) + 4 de Opus (F1-B, F2-C, F3-A, F4-B) + 1 de
cierre Opus (F6-C). El resto es Sonnet.

### Pausas, higiene y prompt plantilla

Las tres secciones de la v2 (pausas obligatorias entre sesiones, pausas de fase con recorrido
completo en `pnpm dev`, higiene de sesión, prompt plantilla) siguen vigentes tal cual —
sustituyendo el nombre del blueprint por `docs/V3-REDESIGN-BLUEPRINT.md`. Añadido v3:

- El recorrido de pausa de fase se hace en pantalla grande (1920 o 2560), no solo en la ventana
  de desarrollo. El problema del "narrow" sobrevivió toda la v2 porque nadie miró el sitio en la
  resolución real de Erick.
- F2-A (shape) y F6-C (critique) requieren a Erick presente en la sesión: hay decisiones que el
  agente no puede tomar solo (concepto del asset, ámbar del hero, sign-off final).

### Prompt inicial (sesión F0 — copiar tal cual en sesión nueva con Sonnet)

```text
Sesión F0 de la v3 del landing. Implementa EXACTAMENTE esta tarea del backlog de
docs/V3-REDESIGN-BLUEPRINT.md: P0-01. Nada más.

Antes de tocar código: lee el §4 del blueprint v3 (guardarraíles, vinculantes — heredan los del
blueprint v2) y la spec §2.0. La causa raíz ya está diagnosticada ahí: las labels del SectionNav
ocultas con opacity:0 siguen ocupando layout y sus anchos variables desalinean los puntos. No
re-diagnostiques; aplica el fix de la spec (label en position:absolute fuera del flujo) + el
restyle sutil (punto 6px, label sin píldora: sin background, sin border, texto mono plano).

Reglas de la sesión:
- Solo se toca src/components/SectionNav.astro. La lógica de scroll-spy
  (scripts/motion/section-nav.ts) NO cambia.
- Verifica el AC con Playwright: los centros horizontales de los 8 puntos deben ser idénticos
  (getBoundingClientRect, tolerancia 0px); hover sobre cualquier punto no mueve ningún otro;
  focus de teclado visible con su label.
- pnpm siempre; en esta sesión NO se instala ninguna dependencia.
- No adelantes trabajo de fases posteriores aunque "quede cerca": nada de layout fluido ni gutters.
- pnpm build en verde → commit (mensaje en español, código/comentarios en inglés), marca P0-01
  con ✅ en la tabla §3 del blueprint, y push a main (esta fase se publica sola e inmediata:
  el sitio está enlazado desde CV/LinkedIn).
- Al cerrar: verifica el fix en el sitio desplegado y confirma que la siguiente sesión es F1-A
  (P1-01, Sonnet).
```

---

## Archivo: tabla v1 (histórica)

| Fase | Modelo default | Cuándo subir de modelo |
|---|---|---|
| 0 — Fundaciones | **Sonnet** | Nunca. Scaffold Astro, tokens, fuentes, GitHub Actions: mecánico y bien documentado. |
| 1 — Contenido | **Sonnet** | Opus/Fable solo para el copy del hero y el bio (una sesión corta). Estructura y content collections: mecánicas. |
| 2 — Sistema visual | **Opus** | Fable para el primer `/impeccable craft` de cada sección (la decisión de diseño); Opus itera sobre lo planteado. |
| 3 — Pieza de firma | **Fable** | Es LA fase: `/impeccable shape` (concepto de la dataviz) e implementación inicial = mayor retorno por token del proyecto. Ajustes finos: Opus. |
| 4 — Motion | **Opus** | Fable solo si la coreografía de carga del hero no sale con carácter en Opus. Opus + `/fast` para el loop editar→mirar→ajustar. |
| 5 — QA | **Sonnet** | `/impeccable critique` final con Opus (juicio de diseño). Audits, contraste, screenshots Playwright: Sonnet. Haiku para trámite puro (mover assets, correr builds, renombrar). |
