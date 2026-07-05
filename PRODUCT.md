# Product

## Register

brand

## Users

- **Reclutadores / hiring managers** (audiencia primaria): escanean en 30–60 segundos desde un CV o LinkedIn. Deciden en el primer fold si esto es "otro portfolio más" o alguien que hay que entrevistar.
- **Directores y analistas técnicos**: evalúan profundidad real — abren los proyectos, juzgan el criterio analítico y la ejecución.
- **Erick mismo**: la página es el índice canónico de sus proyectos publicados; añadir un proyecto nuevo debe ser trivial (content collection, no rediseño).

## Product Purpose

Carta de presentación profesional + índice de portfolio de Erick García (Data Analyst / BI). Muestra skills, dominio (T-SQL, Power BI, DAX, reportería de contact-center) y expansión activa (Python, IA, Claude API), y da acceso a los proyectos publicados.

Éxito = un reclutador la recuerda después de cerrar la pestaña, y puede llegar a cualquier proyecto en ≤2 clics. Es la ejecución de la fase 4 del repo `personal-brand-design`.

## Brand Personality

"Architectural Restraint meets Editorial Authority" (definida en `D:\Dev\Projects\personal-brand-design`). Sobria, precisa, con autoridad tranquila. La competencia con datos se **demuestra** en la propia página, no se declara con adjetivos. Emociones objetivo: confianza, curiosidad ("¿cómo hizo esto?"), seriedad sin frialdad.

## Anti-references

- **Los dos intentos previos** (`personal-landing-page`, `TEST2-html-page`): correctos pero planos. Sus tics concretos quedan vetados: eyebrow uppercase sobre cada sección, grid de cards idénticas para proyectos, fade-on-scroll uniforme aplicado a todo, hero genérico de dos líneas + scroll cue.
- La landing SaaS promedio de 2026 (hero-metric, gradientes, glassmorphism).
- El "portfolio de developer" plantilla: foto circular, barras de progreso de skills, iconos de tecnologías en fila.

## Design Principles

1. **La página es la demo.** Un analista de datos no dice "sé visualizar datos": la página lo visualiza en vivo. La pieza de firma es una dataviz real e interactiva.
2. **Documento que se abre a la sala de máquinas.** Base editorial light (canvas); las zonas de datos y proyectos se sumergen en dark (ink) como ventanas de dashboard. El contraste entre los dos mundos ES el carácter.
3. **Ámbar = un solo foco por vista.** Regla de marca no negociable. El acento nunca es decorativo.
4. **Motion coreografiado, no reflejo.** Cada reveal se diseña para lo que revela; nada de una entrada idéntica clonada por sección. Reduced-motion siempre cubierto.
5. **Contenido primero.** La estructura funciona con los proyectos reales de hoy y absorbe los de mañana sin rediseño.

## Accessibility & Inclusion

- WCAG 2.1 AA: texto de cuerpo ≥4.5:1, texto grande ≥3:1 (verificar especialmente Barlow claro sobre ink-900 y canvas-600 sobre canvas-200).
- `prefers-reduced-motion`: toda animación tiene alternativa (crossfade o estado final directo); la dataviz de firma ofrece render estático.
- La dataviz nunca depende solo del color (regla del design system: forma/etiqueta además de hue).
- Navegable por teclado; contenido íntegro sin JS (el JS enriquece, no bloquea).
