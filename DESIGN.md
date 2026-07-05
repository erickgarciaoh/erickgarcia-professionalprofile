# Design

Sistema visual de esta landing. **Fuente de verdad upstream:** `D:\Dev\Projects\personal-brand-design` (spec `src/PERSONAL_BRAND_DESIGN.md` v2.2 + tokens DTCG compilados). Este archivo documenta cómo la landing *aplica* ese sistema; no redefine valores. Los tokens se consumen como `var(--token)` desde una copia versionada de `outputs/css/tokens.css` + `tokens.dark.css` del repo de marca (regenerar allí, re-copiar aquí; nunca editar la copia).

## Theme

**Light base + ventanas dark.** El documento vive en canvas claro (`--canvas-200` #E7E5E0, page surface de marca); las zonas de datos —hero dataviz, índice de proyectos— se sumergen en `--ink-900`/`--ink-950` como interiores de dashboard, activadas con `[data-theme="dark"]` por sección. La transición entre mundos es un momento de diseño, no un cambio de fondo.

- Sobre dark: **bordes, no sombras** (regla de marca). Sombras solo en light (`--shadow-1..4`).
- Identidad ya comprometida: se preserva (canvas cálido y Cormorant son decisiones de marca existentes, no defaults nuevos).

## Color

| Rol | Token | Uso en la landing |
|---|---|---|
| Fondo página | `--canvas-200` | Base editorial |
| Superficie card light | `--canvas-50` | Solo si una card es la afordancia correcta |
| Ventanas dark | `--ink-900` / `--ink-950` | Hero dataviz, bloque de proyectos |
| Texto primario | `--ink-900` / `--canvas-200` (dark) | |
| Acento | `--accent` #C27C35 (light) / `--accent-on-dark` #E09A50 | **Un foco por vista.** CTA principal o el dato destacado — nunca ambos en el mismo viewport |
| Dataviz categórica | `--data-1..7` (slate lidera) | `--data-emphasis` (=ámbar) solo para la serie que importa |

Prohibido: hex crudo, ámbar decorativo, ámbar en rotación categórica.

## Typography

- **Display:** Cormorant Garamond 500–600, solo ≥28px (regla de marca). Escala fluida: `clamp()` con techo ≤6rem, tracking ≥ −0.02em, `text-wrap: balance`.
- **UI/cuerpo:** Barlow ≤600, cuerpo 16px lh 1.65, máx 70ch.
- **Datos/código:** JetBrains Mono; cifras con Barlow weight 100–200 `tabular-nums` (estilo metric-* de marca).
- Fuentes self-hosted (woff2), `font-display: swap`.

## Spacing & Layout

- Escala de marca `--space-1..24`; secciones con `clamp()` fluido que respira en viewports grandes.
- Composición asimétrica permitida; romper la retícula con intención, no por sección.
- Índice de proyectos: jerarquía real (destacado grande + resto en lista densa), **no** grid de cards uniformes.
- Radii: `--radius-md/lg` (4/8px). Z-index semántico, sin valores arbitrarios.

## Motion

- Curvas de marca: `--motion-slow` (350ms) y `--motion-page` (450ms, expo-out) para coreografía; `--motion-fast/base` para micro-interacciones.
- Una coreografía de carga orquestada en el hero > micro-efectos dispersos. Cada sección con la entrada que su contenido pide.
- Librería si hace falta (GSAP o motion vía pnpm); `prefers-reduced-motion` con alternativa siempre. El contenido es visible por defecto — los reveals realzan, nunca ocultan.

## Componentes clave (de la spec de marca)

- Botones: primary (ámbar sobre canvas-50), secondary (borde 1px, hover ámbar), ghost. Tipografía label-lg.
- KPI/metric: label-sm uppercase + cifra Barlow thin tabular — reservado a las ventanas dark.
- Monograma EG (`personal-brand-design/src/brand/`) como marca de sitio y favicon (32/180px existentes).

## Vetos específicos de este proyecto

Heredados de PRODUCT.md §Anti-references + bans del skill impeccable: eyebrows por sección, cards idénticas, side-stripes, gradient text, glassmorphism, hero-metric, fade-on-scroll uniforme.
