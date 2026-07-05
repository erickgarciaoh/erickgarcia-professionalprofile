# personal-landing-page-2

## Objetivo
Landing page personal + índice de portfolio de Erick García (Data Analyst / BI). Carta de presentación que impresione a reclutadores y dé acceso a los proyectos publicados. Ejecuta la fase 4 del repo `D:\Dev\Projects\personal-brand-design` (design system = fuente de verdad visual). Sustituye a los intentos `personal-landing-page` y `TEST2-html-page`, cuyo resultado se sintió plano; sus tics están vetados en `PRODUCT.md`.

Contexto de diseño: `PRODUCT.md` (estrategia, register: brand) y `DESIGN.md` (aplicación del sistema visual). Todo trabajo de UI pasa por el skill `/impeccable`.

## Plan por fases
| Fase | Descripción | Estado |
|---|---|---|
| 0 | **Fundaciones** — scaffold Astro (pnpm), copiar tokens CSS del repo de marca, fuentes self-hosted, layout base, monograma EG como favicon, deploy a GitHub Pages desde el día 1. | **Completada** (2026-07-05) |
| 1 | **Contenido completo, sin espectáculo** — página entera con contenido real: hero (copy), perfil/skills, índice de 4 proyectos vía content collection, contacto. Responsive, accesible, legible. Idioma: inglés (alcance internacional). | **Completada** (2026-07-05) |
| 2 | **Sistema visual con carácter** — treatment light base + ventanas dark, tipografía a escala, jerarquía del índice (destacado + lista), imagery real (screenshots de dashboards/proyectos). `/impeccable craft` por sección. | **Completada** (2026-07-05) |
| 3 | **Pieza de firma** — dataviz viva e interactiva en el hero (canvas/SVG, datos reales). Se define con `/impeccable shape` antes de codear. Fallback estático + reduced-motion. | **Completada** (2026-07-05) |
| 4 | **Motion coreografiado** — orquestación de carga del hero, transición entre mundos light/dark, micro-interacciones. `/impeccable animate`. | **Completada** (2026-07-05) |
| 5 | **QA y publicación** — `/impeccable critique` + `audit` + `polish`, screenshots Playwright en breakpoints, contraste AA, performance (LCP), publicación final y enlace desde CV/LinkedIn. | Pendiente |

Regla de proceso: idea nueva a mitad de fase → se clasifica contra este plan (va ahora / backlog / descartada) antes de tocar código. No se reordena ni reinicia sin decisión explícita.

Guía operativa de modelos y sesiones por fase (para Erick): `context/MODELOS_Y_SESIONES.md`.

## Backlog (explícitamente diferido)
- Sección blog/notas de análisis.
- Toggle de tema dark completo para toda la página (hoy: dark solo por ventanas).
- i18n ES/EN si el idioma elegido en fase 1 se queda corto para la audiencia.
- Analytics de visitas (privacy-friendly).
- Página de detalle por proyecto (caso de estudio largo) si el índice + enlace externo no basta.

## Stack
- **Astro** (output estático) + CSS con tokens de marca + TS vanilla para interacción; GSAP o motion solo si la fase 4 lo pide.
- **pnpm** siempre. Deploy: GitHub Pages (GitHub Actions), workflow `.github/workflows/deploy.yml` en push a `main`.
- Repo: `github.com/erickgarciaoh/erickgarcia-professionalprofile` (público). Sitio: `https://erickgarciaoh.github.io/erickgarcia-professionalprofile/`.
- Fuentes self-hosted vía `@fontsource` (Cormorant Garamond 500/600, Barlow 100/200/400/500/600, JetBrains Mono 400) — `src/styles/fonts.css`.
- QA visual: Playwright (screenshots por breakpoint).

## Datos
No aplica base de datos en runtime. La dataviz de firma ("Weekly Pulse", fase 3) consume `src/data/coffee-pulse.json`: agregado día×hora (txns + revenue) de las 149,116 transacciones del proyecto coffee-shop, generado one-off desde `XTREMUS\DB001/coffee_shop_sales` (`core.fact_sale_line ⋈ core.dim_date`). Para regenerarlo, re-ejecutar esa query y verificar que el total cuadre con 149,116.

## Convenciones
<!-- Solo deltas respecto al CLAUDE.md global. -->
- **Tokens**: consumir `var(--token)` desde la copia versionada de `outputs/css/tokens*.css` del repo de marca. Nunca hex crudo, nunca editar la copia; si el sistema cambia, se regenera upstream y se re-copia.
- Reglas de marca no negociables: ámbar = un foco por vista; bordes (no sombras) sobre dark; Cormorant ≥28px; Barlow ≤600.
- Vetos de diseño: ver `PRODUCT.md` §Anti-references y `DESIGN.md` §Vetos.
- Código, identificadores, comentarios y contenido de la página en inglés (decisión de fase 1: alcance internacional).
