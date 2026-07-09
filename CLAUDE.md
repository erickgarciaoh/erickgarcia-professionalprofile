# personal-landing-page-2

## Objetivo
Landing page personal + índice de portfolio de Erick García (Data Analyst / BI). Carta de presentación que impresione a reclutadores y dé acceso a los proyectos publicados. Ejecuta la fase 4 del repo `D:\Dev\Projects\personal-brand-design` (design system = fuente de verdad visual). Sustituye a los intentos `personal-landing-page` y `TEST2-html-page`, cuyo resultado se sintió plano; sus tics están vetados en `PRODUCT.md`.

Contexto de diseño: `PRODUCT.md` (estrategia, register: brand) y `DESIGN.md` (aplicación del sistema visual). Todo trabajo de UI pasa por el skill `/impeccable`.

## Plan por fases

### v1 — página completa (completado 2026-07-06)
| Fase | Descripción | Estado |
|---|---|---|
| 0 | **Fundaciones** — scaffold Astro (pnpm), copiar tokens CSS del repo de marca, fuentes self-hosted, layout base, monograma EG como favicon, deploy a GitHub Pages desde el día 1. | **Completada** (2026-07-05) |
| 1 | **Contenido completo, sin espectáculo** — página entera con contenido real: hero (copy), perfil/skills, índice de 4 proyectos vía content collection, contacto. Responsive, accesible, legible. Idioma: inglés (alcance internacional). | **Completada** (2026-07-05) |
| 2 | **Sistema visual con carácter** — treatment light base + ventanas dark, tipografía a escala, jerarquía del índice (destacado + lista), imagery real (screenshots de dashboards/proyectos). `/impeccable craft` por sección. | **Completada** (2026-07-05) |
| 3 | **Pieza de firma** — dataviz viva e interactiva en el hero (canvas/SVG, datos reales). Se define con `/impeccable shape` antes de codear. Fallback estático + reduced-motion. | **Completada** (2026-07-05) |
| 4 | **Motion coreografiado** — orquestación de carga del hero, transición entre mundos light/dark, micro-interacciones. `/impeccable animate`. | **Completada** (2026-07-05) |
| 5 | **QA y publicación** — `/impeccable critique` + `audit` + `polish`, screenshots Playwright en breakpoints, contraste AA, performance (LCP), publicación final. | **Completada** (2026-07-06) |

### v2 — motion coreografiado con GSAP/Lenis (completado 2026-07-06)
Plan detallado, specs por sección y guardarraíles: `docs/V2-ANIMATION-BLUEPRINT.md` (fuente de verdad, no duplicar aquí).

| Fase | Descripción | Estado |
|---|---|---|
| 1 | **Static & complete** — 8 secciones nuevas (Hero extendido, What I do, What I build, Statement, Selected work, Metrics, Toolkit, Contact) con contenido final, sin animación aún. | **Completada** |
| 2 | **Global motion infrastructure** — gsap + lenis, `core.ts`, `smooth-scroll.ts`, `reveal.ts`. | **Completada** |
| 3 | **Easy wins** — RotatingWord, Counter, LiveTerminal, mouse-preview, magnetic button, marquee pause, SectionNav. | **Completada** (2026-07-07) |
| 4 | **The star moment** — Statement: kinetic typography scrub-read + PipelineSteps (4 escenas one-shot: raw → extract → transform → decide). El único momento pinneado/heavyweight de la página. | **Completada** (2026-07-07) |
| 5 | **Polish & QA** — reduced-motion + no-JS pass completos, screenshots Playwright (320/768/1280/1920 + hover/terminal), performance (Lighthouse LCP, bundle GSAP, 60fps scrub), A11y (axe-core, contraste AA, teclado, aria-hidden). Tres defectos reales encontrados y corregidos en el camino (ver `docs/V2-ANIMATION-BLUEPRINT.md` §Phase 5 para el detalle). | **Completada** (2026-07-06) |

v2 cerrada por completo: sitio enlazado desde CV y LinkedIn (2026-07-07).

### v3 — rediseño post-feedback (plan aprobado 2026-07-07)
Origen: cinco inconformidades de Erick con la v2 desplegada (nav de puntos torcido, layout narrow en 1920/2560, hero con WeeklyPulse que ya no aporta, presupuesto de animación corrido una sección, Selected work y Metrics lejos del modelo de referencia). Plan detallado, specs por sección y guardarraíles: `docs/V3-REDESIGN-BLUEPRINT.md` (fuente de verdad, no duplicar aquí). Referencia de gramática (no de registro): https://cloudstudio.es/.

| Fase | Descripción | Estado |
|---|---|---|
| 0 | **Hotfix SectionNav** — alinear puntos (label fuera del flujo) + registro sutil sin píldora. Se publica solo e inmediato: el sitio está enlazado desde CV/LinkedIn. | **Completada** (2026-07-07) |
| 1 | **Layout fluido full-width** — muere el `.wrap` de 72rem; gutters `clamp()`, composición que llena 1920/2560, medida de texto ≤75ch. Base de todo lo demás. QA pasa a 5 anchos (320/768/1280/1920/2560). | Pendiente |
| 2 | **Hero nuevo** — nombre como monumento + frase de servicios + asset de firma interactivo (concepto se decide en `/impeccable shape`, P2-01). Se retiran WeeklyPulse, coffee-pulse.json y RotatingWord. | Parcial: copy/layout completo (P2-02); asset de firma **reabierto** (P2-01/P2-03) — concepto "Signal in the noise" descartado por Erick 2026-07-09, ver blueprint |
| 3 | **Rotación de secciones** — What I do: 3 tarjetas con escenas animadas. What I build: hereda PipelineSteps. Statement → Promise: una frase display con scrub breve. | Pendiente |
| 4 | **Selected work** — lista izquierda + panel sticky derecho que cambia on-hover/focus (thumbnail + dataset size + stack). Muere mouse-preview. | Pendiente |
| 5 | **Metrics como banda horizontal** — mismas 3 métricas en strip simple; Toolkit intocado. | **Completada** (2026-07-09) |
| 6 | **QA y cierre** — reduced-motion, no-JS, screenshots en 5 anchos, Lighthouse, axe, sign-off de Erick. | Pendiente |

Regla de proceso: idea nueva a mitad de fase → se clasifica contra este plan (va ahora / backlog / descartada) antes de tocar código. No se reordena ni reinicia sin decisión explícita.

Guía operativa de modelos y sesiones por fase (para Erick): `context/MODELOS_Y_SESIONES.md`.

## Backlog (explícitamente diferido)
- Sección blog/notas de análisis.
- Toggle de tema dark completo para toda la página (hoy: dark solo por ventanas).
- i18n ES/EN si el idioma elegido en fase 1 se queda corto para la audiencia.
- Analytics de visitas (privacy-friendly).
- Página de detalle por proyecto (caso de estudio largo) si el índice + enlace externo no basta.

## Stack
- **Astro** (output estático) + CSS con tokens de marca + TS vanilla para interacción; **GSAP + Lenis** para motion coreografiado (v2, ver `docs/V2-ANIMATION-BLUEPRINT.md`).
- **pnpm** siempre. Deploy: GitHub Pages (GitHub Actions), workflow `.github/workflows/deploy.yml` en push a `main`.
- Repo: `github.com/erickgarciaoh/erickgarcia-professionalprofile` (público). Sitio: `https://erickgarciaoh.github.io/erickgarcia-professionalprofile/`.
- Fuentes self-hosted vía `@fontsource` (Cormorant Garamond 500/600, Barlow 100/200/400/500/600, JetBrains Mono 400) — `src/styles/fonts.css`.
- QA visual: Playwright (screenshots por breakpoint).

## Datos
No aplica base de datos en runtime. La dataviz "Weekly Pulse" y `src/data/coffee-pulse.json` **se retiraron en v3 fase 2 (P2-02, 2026-07-07)** — el análisis vive en el repo del proyecto coffee-shop, esta landing ya no lo embebe. Dato reutilizado en v3: el tamaño del dataset (149,116 rows) se mostrará como meta en Selected work (pendiente, P4-01).

## Convenciones
<!-- Solo deltas respecto al CLAUDE.md global. -->
- **Tokens**: consumir `var(--token)` desde la copia versionada de `outputs/css/tokens*.css` del repo de marca. Nunca hex crudo, nunca editar la copia; si el sistema cambia, se regenera upstream y se re-copia.
- Reglas de marca no negociables: ámbar = un foco por vista; bordes (no sombras) sobre dark; Cormorant ≥28px; Barlow ≤600.
- Vetos de diseño: ver `PRODUCT.md` §Anti-references y `DESIGN.md` §Vetos.
- Código, identificadores, comentarios y contenido de la página en inglés (decisión de fase 1: alcance internacional).
