# V2 Animation Blueprint

Status: **approved plan, not yet implemented.** This document is the single source of truth for the v2
animation + structure work. It is written so a less capable model can pick any backlog task in §3 and
implement it in isolation, without re-deriving the plan.

How to use this document as an implementer:

1. Read §4 (guardrails) once. They are binding.
2. Take ONE task from the backlog (§3). Tasks are ordered; respect phase order and `Depends on`.
3. Read the section spec (§2) the task points to. Meet the **acceptance criterion** (binary) and the
   **hard constraints**. Implementation details may be adapted if both still hold.
4. Do not start tasks from a later phase "while you're at it".

---

## 0 · Audit snapshot (2026-07-06)

| Item | Value |
|---|---|
| Framework | Astro 7.0.6, static output (`astro build`), **no React / no islands** |
| Package manager | pnpm 11.8.0 (pinned via `packageManager`), Node ≥ 22.12 |
| Styling | Brand tokens (`src/styles/tokens.css` + `tokens.dark.css`, versioned copies — never edit), `global.css`, `page.css` |
| Fonts | Self-hosted: Cormorant Garamond (display, ≥28px only), Barlow (UI/body, weight ≤600), JetBrains Mono (data/code) |
| Existing sections | `#hero` (name, role, lede, CTAs, masthead + WeeklyPulse dataviz), `#profile` (bio + toolkit `<dl>`), `#projects` (dark window: featured + dense list), `#contact` |
| Existing motion | Pure CSS: hero load choreography (name clip-path wipe → cascade → masthead rules), dark-window threshold reveal via one IntersectionObserver, micro-hovers. Anti-FOUC pattern: `document.documentElement.dataset.reveal = 'js'` set pre-paint in `Layout.astro`; all pre-reveal hidden states scoped to `[data-reveal='js']` in CSS; blanket reduced-motion rule at the foot of `page.css` |
| Animation libs installed | None. GSAP + Lenis are new in v2 |
| Deploy | GitHub Pages via Actions on push to `main`; site served under base path `/erickgarcia-professionalprofile/` |

**Consequences for the confirmed stack:**

- **Motion (the React library) is out** — the project is not React. GSAP covers micro-interactions too.
- GSAP ≥ 3.13 ships **all formerly-paid Club plugins free** in the public `gsap` npm package
  (SplitText, MorphSVG, DrawSVG, MotionPath, ScrollTrigger). No club account, no extra package.
- Three.js/WebGL and drag-throw physics (Matter.js) are **future**, not v2 tasks.

**Reused from v1 (do not rebuild):** brand motion tokens (`--motion-fast/base/medium/slow/page`),
expo-out easing `cubic-bezier(0.16, 1, 0.3, 1)` (= GSAP `expo.out`), the `[data-reveal='js']` gate,
the hero CSS load choreography, the projects threshold reveal, `WeeklyPulse.astro`, the projects
content collection and its cover images.

**Motion reference (Erick, 2026-07-06): https://cloudstudio.es/.** Follow its motion *grammar* —
stepped "what we build" sequence with ghost numerals, live terminal panels, dark counters band,
hover work-preview, labeled dot progress nav — NOT its visual register (acid-yellow drench, chunky
grotesque type, playful particle mascot). Brand tokens and the PRODUCT.md vetoes always win over
the reference. Its Matter.js drag-and-throw toolkit and Three.js particle scenes stay in "future".

---

## 1 · Architecture & dependencies

### 1.1 Install (pnpm only — ask Erick before running)

```bash
pnpm add gsap lenis
```

- `gsap` ≥ 3.13 (includes ScrollTrigger, SplitText, MorphSVGPlugin, DrawSVGPlugin, MotionPathPlugin).
- `lenis` (smooth scroll; formerly `@studio-freight/lenis` — use the plain `lenis` package).
- No other animation dependencies. Never `npm install` / `yarn`.

### 1.2 Where animation code lives

```
src/
  scripts/motion/
    core.ts            # gsap.registerPlugin(...), shared gsap.matchMedia() context,
                       # exports `motionOK` media query strings and the shared easing name
    smooth-scroll.ts   # Lenis wrapper (see contract below)
    reveal.ts          # global data-attribute-driven scroll-reveal utility
    counter.ts         # Counter behavior (reads data-counter-* attrs)
    rotating-word.ts   # RotatingWord behavior
    terminal.ts        # LiveTerminal timeline builder (shared sequencing helper)
    pipeline.ts        # PipelineSteps per-step scene timelines (star moment)
    section-nav.ts     # labeled dot progress nav (scroll-spy)
    mouse-preview.ts   # Selected-work cursor-follow preview
    magnetic.ts        # magnetic button micro-interaction
    index.ts           # single entry: imports + boots everything, guarded per-section
  components/
    AnimatedCard.astro
    LiveTerminal.astro
    Marquee.astro
    RotatingWord.astro
    Counter.astro
    PipelineSteps.astro
    SectionNav.astro
  components/sections/
    Hero.astro  WhatIDo.astro  WhatIBuild.astro  Statement.astro
    SelectedWork.astro  Metrics.astro  Toolkit.astro  Contact.astro
```

- `index.astro` becomes a thin composition of the eight section components and one
  `<script> import '../scripts/motion/index';</script>`.
- Astro bundles `<script>` tags as ESM for the client; import GSAP plugins only inside
  `src/scripts/motion/*` (client-only code), never in component frontmatter (build-time).
- Section-scoped CSS may live in each section component's `<style>`; shared motion CSS
  (from-states under `[data-reveal='js']`) stays in `page.css` under a clearly-marked `/* v2 motion */` block.

### 1.3 Global wiring contracts

**Reduced motion — one gate, used everywhere.** In `core.ts`:

```ts
import { gsap } from 'gsap';
export const mm = gsap.matchMedia();
export const MOTION_OK = '(prefers-reduced-motion: no-preference)';
// every scripted animation registers inside: mm.add(MOTION_OK, () => { ... });
```

The existing CSS blanket rule in `page.css` stays and keeps covering CSS animations.
Any new CSS from-state added under `[data-reveal='js']` MUST also be undone inside the
existing `@media (prefers-reduced-motion: reduce)` block (follow the pattern already there).

**No-JS / first-paint legibility.** Content is complete and visible in plain HTML. Two allowed
patterns for pre-reveal hidden states, in order of preference:

1. `gsap.set(...)` at boot (JS-only from-state; no CSS involved). Use when a flash of the final
   state before JS runs is acceptable (below-the-fold sections — it is).
2. CSS from-state scoped to `[data-reveal='js']` + undo in the reduced-motion block (the v1
   pattern). Use only for above-the-fold or LCP-adjacent elements.

Never gate visibility on a class that only JS adds without one of these two patterns.

**Lenis contract** (`smooth-scroll.ts`):

- Init only inside `mm.add(MOTION_OK, ...)` — reduced-motion users get native scroll.
- Sync with ScrollTrigger: `lenis.on('scroll', ScrollTrigger.update)` and drive Lenis from
  `gsap.ticker` (`gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0)`).
- Intercept in-page anchor clicks (`.primary-nav a`, hero CTAs, skip-link excluded) and route to
  `lenis.scrollTo(hash, { offset: -headerHeight })`. The skip link must keep native behavior.
- Keyboard scrolling (space, PgDn, arrows) must keep working. Test it.

**One amber focus per view (brand rule).** Each section spec below names its single amber element.
Implementers must not add amber anywhere else in that viewport.

### 1.4 Reusable components / utilities to create

| Piece | File(s) | Responsibility | Public contract |
|---|---|---|---|
| Smooth scroll | `scripts/motion/smooth-scroll.ts` | Lenis boot + ScrollTrigger sync + anchor routing | `initSmoothScroll(): void` |
| Scroll reveal | `scripts/motion/reveal.ts` | Generic entrance reveals, driven by markup | Elements opt in with `data-reveal-group` on a container; children with `data-reveal-item` (optional `data-reveal-order`). One ScrollTrigger per group, `once: true`, start `top 78%`. Animates `y: 24→0, autoAlpha: 0→1`, `0.6s expo.out`, stagger `0.1s`, total stagger capped at 0.5s |
| AnimatedCard | `components/AnimatedCard.astro` | Card used in What-I-do; hover elevation + icon micro-motion in CSS | Props: `title, body, iconId ('viz'\|'automation'\|'cleaning'), size ('wide'\|'std')` |
| Counter | `components/Counter.astro` + `counter.ts` | Count-up metric | Markup: `<span data-counter data-counter-to="1400000" data-counter-format="compact" data-counter-suffix="+">1.4M+</span>` — final value is server-rendered text (SEO/no-JS); JS rewinds to 0 and counts up only when `MOTION_OK` |
| Marquee | `components/Marquee.astro` | Infinite horizontal loop, CSS-transform based | Slot of items; duplicates track once with `aria-hidden="true"`; pauses on hover/focus-within; reduced-motion renders a static wrapped row (no duplicate track) |
| RotatingWord | `components/RotatingWord.astro` + `rotating-word.ts` | Cycling last word of the hero headline | Props: `words: string[]` (first word = static fallback, server-rendered). Container reserves width of the longest word (`ch`-based) so swaps never reflow the line |
| LiveTerminal | `components/LiveTerminal.astro` + `terminal.ts` | Fake terminal whose lines sequence in on enter | Props: `title, lines: string[]`. All lines present in HTML; `terminal.ts` builds a paused gsap timeline per instance and plays it once on ScrollTrigger enter |
| PipelineSteps | `components/PipelineSteps.astro` + `pipeline.ts` | The signature stepped data-pipeline sequence (cloudstudio grammar) | See §2.4. `terminal.ts` and `pipeline.ts` must share one helper: `sequence(steps: gsap.TweenVars[][]): gsap.core.Timeline` (build-once, reuse) |
| SectionNav | `components/SectionNav.astro` + `scripts/motion/section-nav.ts` | Labeled dot progress nav fixed at the right edge (cloudstudio grammar) | One dot per `<section data-section-label="...">`; dots are real anchor links; scroll-spy (IntersectionObserver) sets `aria-current="true"` and shows the active label; hidden below 60rem; works as plain anchors with JS off |
| Magnetic button | `scripts/motion/magnetic.ts` | Pointer-proximity pull on `[data-magnetic]` | Only under `(pointer: fine)` + `MOTION_OK`; max translate 8px; inner label moves at 40% |

---

## 2 · Section-by-section specification

Page order (top → bottom): Hero · What I do · What I build · Statement (star) · Selected work ·
Metrics · Toolkit · Contact. The v1 `#profile` section is dissolved: its toolkit `<dl>` feeds §2.7,
its bio + credential stats feed §2.6.

Shared vocabulary: "enter trigger" = ScrollTrigger `start: 'top 78%'`, `once: true`.
Default ease = `expo.out`. Exits (where any) run at ~75% of enter duration.

---

### 2.1 Hero

- **Purpose:** identity in 5 seconds — name, role, one memorable sentence, and the live proof
  (WeeklyPulse) that the claim is real.
- **Exact content (adds to existing hero, which keeps name / role / lede / CTAs / masthead / WeeklyPulse):**
  - New headline line between `.hero-role` and `.hero-lede`, class `.hero-statement`:
    `I don't just crunch numbers — I turn them into <RotatingWord words={['decisions','dashboards','clarity']} />.`
- **Technique (precise):** `RotatingWord`: gsap timeline swaps the word every **2.8s**. Out: current
  word's chars (SplitText, `type: 'chars'`) fall `y: '-0.6em'`, `autoAlpha: 0`, `0.3s`, stagger `0.015s`.
  In: next word's chars rise from `y: '0.6em'`, `autoAlpha: 0→1`, `0.45s expo.out`, stagger `0.02s`.
  `aria-hidden="true"` on the animated layer; a visually-hidden static span keeps the accessible
  sentence stable ("…into decisions."). Cycle pauses when the tab is hidden (`visibilitychange`) and
  when the hero leaves the viewport (IntersectionObserver or ScrollTrigger toggle).
- **Library:** GSAP core + SplitText.
- **Trigger:** starts after the v1 hero load choreography settles (delay ≈ 1.2s after boot), then loops.
- **Timing/easing:** above; never faster than 2.5s per cycle — it must read as calm, not as a ticker.
- **Mobile:** identical (cheap). Verify the reserved width doesn't wrap the headline at 320px; if it
  does, the headline drops to its own line via existing fluid type rules.
- **Reduced-motion:** static final word `decisions` (the server-rendered fallback). No cycling.
- **Amber focus in this view:** stays the WeeklyPulse peak cell (existing). RotatingWord is ink-colored.
- **Difficulty:** M. **Depends on:** `core.ts`.
- **Done when:** with JS disabled the full sentence reads "…into decisions."; with JS the word cycles
  through all three values without the line ever reflowing; with reduced-motion enabled no cycling occurs.

### 2.2 What I do

- **Purpose:** answer a recruiter's "so what does he actually do?" in one glance, three capabilities.
- **Exact content:** heading `What I do`; intro paragraph
  `I don't just crunch numbers. I design the systems around them — so the numbers arrive clean, on time, and mean something.`
  Three `AnimatedCard`s:
  1. **Data visualisation** — `Dashboards and data stories people actually read — Power BI, DAX, and hand-built HTML visuals.`
  2. **Automation processes** — `Python and SQL automations that remove the manual steps between raw data and the morning report.`
  3. **Data cleaning** — `Messy operational data turned into models you can trust — validated, documented, reproducible.`
- **Layout constraint (brand veto: identical card grids):** NOT three equal cards in a row. Use an
  asymmetric composition: card 1 `size="wide"` spanning 2 columns with the other two stacked beside
  it (desktop ≥60rem); single column on mobile. Same component, two sizes — differentiated, not cloned.
- **Technique (precise):** entrance via the global `reveal.ts` group (`data-reveal-group` on the grid,
  `data-reveal-item` per card): `y: 24→0`, `autoAlpha`, `0.6s expo.out`, stagger `0.12s`. Hover
  (CSS only, no JS): `transform: translateY(-4px)`, border-color shift, shadow step up one token
  (`--shadow-2` → `--shadow-3`; light world, shadows allowed), `var(--motion-base)`. Each card's inline
  SVG icon animates on card hover via CSS: `viz` bars scale up staggered (transform-origin bottom),
  `automation` gear rotates 20°, `cleaning` strokes tighten — all transform-only, ≤300ms.
- **Library:** GSAP ScrollTrigger via `reveal.ts`; hover pure CSS.
- **Trigger:** enter trigger, once.
- **Timing/easing:** defaults (§2 preamble).
- **Mobile:** stacked column; same reveal; hover states inert (no `:hover` on coarse pointers — wrap in `@media (hover: hover)`).
- **Reduced-motion:** cards visible immediately (gsap.set pattern 1 — JS applies from-state only under `MOTION_OK`).
- **Amber focus:** none in this section (heading and cards are ink; amber is spent elsewhere on the page). Icon accent uses `--data-1` slate.
- **Difficulty:** S. **Depends on:** `reveal.ts`, `AnimatedCard.astro`.
- **Done when:** all three cards are fully legible without JS; on scroll they enter once, staggered, and never re-hide; hover lifts card and animates its icon on fine-pointer devices only.

### 2.3 What I build

- **Purpose:** show the artifacts (scripts, procs, reports) as living things — the terminal conceit
  demonstrates "automation" instead of claiming it.
- **Exact content:** heading `What I build`; three items, each = short label + `LiveTerminal`:
  1. **Python scripts for automations** — terminal title `run_daily_refresh.py`, lines:
     `$ python run_daily_refresh.py` / `connecting to warehouse ......... ok` /
     `extracting 1.4M rows ........... ok (12.4s)` / `validating against source ..... ok` /
     `publishing morning report ...... done` / `✓ pipeline green — 0 manual steps`
  2. **SQL stored procedures for data processing** — title `sqlcmd`, lines:
     `> EXEC core.usp_RefreshSalesFacts;` / `(149,116 rows affected)` /
     `> EXEC qa.usp_CheckTotals;` / `source = target ✓` / `Completion time: 00:00:03.2`
  3. **Reports & visuals in HTML or Power BI** — title `build`, lines:
     `$ pnpm build:report` / `✓ data bound (coffee-pulse.json)` / `✓ charts rendered as SVG` /
     `✓ AA contrast verified` / `→ deployed: live data-story ↗`
- **Technique (precise):** every line exists in HTML (JetBrains Mono, `--ink-950` panel — these
  terminals are miniature dark windows; borders not shadows). On enter trigger `terminal.ts` plays a
  paused timeline: lines appear sequentially — each line `autoAlpha 0→1` + `y: 6→0`, `0.28s`,
  starting `0.22s` after the previous (`sequence()` helper). A CSS caret blinks on the last line
  (pure CSS `@keyframes`, steps(1)). Total per terminal ≤ 2.2s. The three terminals start with
  `0.35s` between them if simultaneously visible (stagger on the group trigger).
- **Library:** GSAP core + ScrollTrigger; shared `sequence()` from `terminal.ts` (reused by §2.4).
- **Trigger:** enter trigger per terminal group, once.
- **Mobile:** single column; font-size floor 0.75rem; lines wrap with `overflow-wrap`; same animation.
- **Reduced-motion:** all lines visible immediately (JS from-state under `MOTION_OK` only); caret static.
- **Amber focus:** exactly one — the final `→ deployed: live data-story ↗` line in terminal 3 uses `--accent-on-dark`. The `✓` glyphs are `--data-1`/neutral, NOT amber.
- **Difficulty:** M. **Depends on:** `LiveTerminal.astro`, `terminal.ts`, `reveal.ts`.
- **Done when:** with JS off every terminal shows its full final output; with JS the lines sequence once on first view; no layout shift while lines appear (space pre-reserved because lines are in-flow HTML from the start).

### 2.4 Statement — ★ the ONE star moment

- **Purpose:** the thesis of the whole page, felt rather than read. Kinetic statement + the signature
  PipelineSteps sequence: raw table → extract → SQL → transform/aggregate → charts draw themselves.
  **Stepped, cloudstudio-style (decision 2026-07-06):** four full-viewport steps, each scene playing
  once on enter — NO pinning, NO scrubbed scene. v2 uses no ScrollTrigger pinning anywhere. This is
  still the heaviest animated area on the page, and the only one.
- **Exact content:** the sentence
  `I transform complex datasets and databases into understandable visuals for decision-making.`
  followed by four steps labeled (small mono captions with a `01 — 02 — 03 — 04` progress marker,
  active index highlighted): `raw` · `extract` · `transform` · `decide`. Each step = oversized ghost
  numeral behind (outline, `--canvas-400`-level contrast on light / `--ink-700` on dark, decorative,
  `aria-hidden`), a one-line caption, and a dark panel (`--ink-950`, border not shadow) holding that
  step's SVG scene.
- **Technique (precise), two beats:**
  1. **Kinetic typography:** SplitText by words. ScrollTrigger scrub (`scrub: 0.6`) over the section's
     first ~120vh: each word goes `autoAlpha 0.18 → 1` progressively with scroll (classic scrub-read),
     `y: 12→0`. No pinning; the sentence occupies a full viewport, Cormorant display, ≥28px,
     clamp max ≤ 6rem. The words `understandable visuals` are that viewport's single amber element
     (`--accent`), lighting up only when their alpha completes.
  2. **PipelineSteps:** four steps, each ~1 viewport tall, each with a one-shot time-based timeline
     (built with the shared `sequence()` helper) played once on its own enter trigger:
     - **Step 01 · raw:** the stylized table's rows (gray rects) stagger in — `autoAlpha` + `y: 8→0`,
       `0.4s`, stagger `0.06s`.
     - **Step 02 · extract:** 14 particle dots leave a compact copy of the table and travel along 3–4
       curved paths (**MotionPathPlugin**, `alignOrigin: [0.5,0.5]`) into the DB cylinder while the
       cylinder's strokes draw in (**DrawSVG** `0%→100%`). Total ≈ 1.6s.
     - **Step 03 · transform:** a field of ~40 scattered dots **morphs** into 5 clean bar shapes
       (**MorphSVG** on grouped paths; pre-build both path sets in the SVG with matching ids
       `#dots-cloud` → `#bars-clean`), `0.9s`, `expo.inOut`. The "aggregation" metaphor: many rows, few values.
     - **Step 04 · decide:** a line chart path and the 5 bars **draw themselves** (**DrawSVG** on
       strokes, then fills fade in), ≈ 1.4s. The single emphasized mark (peak bar) fills
       `--accent-on-dark` — the only amber in this step's viewport.
     - The progress marker (`01 — 02 — 03 — 04`) updates as each step's trigger fires (CSS class swap,
       color transition `var(--motion-base)`).
- **Library:** GSAP ScrollTrigger (enter triggers only) + SplitText + MotionPathPlugin + DrawSVGPlugin
  + MorphSVGPlugin. Timelines built with the shared `sequence()` helper (same one as §2.3 — build once, reuse).
- **Trigger:** sentence = scrub over its own viewport; each step = enter trigger (`top 70%`), once.
- **Timing/easing:** `expo.out` for entrances; `expo.inOut` for the morph; the sentence scrub uses
  `ease: 'none'` internally (scroll IS the easing). Never spring/bounce.
- **Mobile:** same mechanic, same timelines — only the layout responds (single column, panels full
  width, ghost numerals scale down via the fluid type scale). No separate variant needed anymore.
- **Reduced-motion:** every panel shows its final composed scene, static; sentence fully visible;
  progress marker static at `04`. No timelines created (gate via `mm.add`).
- **Performance guards:** total particle count ≤ 16; no filters/blur inside the scenes; no
  `will-change` needed (short one-shot timelines, not scrubbed).
- **Difficulty:** M (was L when pinned+scrubbed — the stepped decision buys this down).
  **Depends on:** `core.ts`, `reveal.ts`, `terminal.ts` (`sequence()`), static SVG assets from task P1-05.
- **Done when:** scrolling through on desktop AND mobile plays each of the four scenes exactly once,
  in order, with no dropped frames on a mid-range laptop; the progress marker tracks the active step;
  the sentence scrub-read works forward and backward; with reduced-motion all four final scenes and
  the full sentence are visible with zero motion; with JS off the sentence and all four final scenes
  are fully visible.

### 2.5 Selected work

- **Purpose:** the four real projects (existing content collection) — the index recruiters came for.
- **Exact content:** existing `#projects` dark window (featured project + dense list) stays, including
  copy, links, and the v1 threshold reveal. v2 adds only the **cursor-follow preview**: on desktop,
  hovering a project row reveals a floating preview image (the project's existing cover) that follows
  the cursor.
- **Technique (precise):** one fixed-position `<figure class="work-preview" aria-hidden="true">`
  (280×175px, border `1px var(--border-default)`, `--radius-lg`, on `--ink-800`) containing one `<img>`
  swapped per hovered row (`data-preview-src` on each `.project-row`, pre-resolved by Astro assets at
  build). Movement: `gsap.quickTo(el, 'x'|'y', { duration: 0.35, ease: 'expo.out' })` on `pointermove`
  over the list; enter: `autoAlpha 0→1, scale 0.92→1, 0.25s`; leave: `0.18s` out. Image swap =
  instant `src` change while hidden or crossfade if visible.
- **Library:** GSAP core (`quickTo`). No ScrollTrigger.
- **Trigger:** `pointerenter`/`pointermove`/`pointerleave` on `.project-list` rows; active only under
  `(hover: hover) and (pointer: fine)` + `MOTION_OK`.
- **Decision to respect:** the dense rows currently render inline thumbnails. On desktop, when the
  cursor-preview is active, the inline `row-media` thumbnails are hidden (`display: none` inside the
  same media query) so the preview is THE image and rows become tighter text rows. Mobile keeps the
  inline thumbnails exactly as today.
- **Mobile / coarse pointer:** no preview, inline thumbnails (v1 behavior, unchanged).
- **Reduced-motion:** no follow animation — preview appears statically anchored to the row's right
  edge on hover, or simplest: keep the v1 inline thumbnails and never init the module.
- **Amber focus:** unchanged from v1 (featured project's "Live data-story" link).
- **⚠ Content note for Erick:** before adding any new screenshots, anonymize anything client-related.
  The four current covers come from public portfolio datasets and are fine; any future
  contact-center / client screenshot must have names, accounts, and volumes scrubbed. NDA check is on you.
- **Difficulty:** M. **Depends on:** `mouse-preview.ts`, `core.ts`.
- **Done when:** on a fine-pointer desktop, hovering each row shows its correct cover following the
  cursor smoothly and it disappears on leave; on touch devices and with reduced-motion the section is
  byte-identical to v1 behavior; keyboard focus on row links is never obscured by the preview.

### 2.6 Metrics

- **Purpose:** scale and credibility in numbers — absorbed from the v1 Profile bio, which dissolves here.
- **Exact content:** heading `Six years of production numbers`; one short bio line kept from v1:
  `Six-plus years building reporting systems for enterprise financial-services clients, inside high-volume, SLA-driven contact-center operations.`
  Three metrics (Counter each):
  1. `1.4M+` — `monthly interactions reported` (realizes "datasets of millions of rows" with a number
     already published in the v1 bio; swap the label to `rows in a single dataset` only if Erick prefers)
  2. `6` — `enterprise accounts served simultaneously`
  3. `90%+` — `stakeholder satisfaction`
- **Anti-template constraint (brand veto: hero-metric grid):** NOT big-number cards. Render as the
  brand's KPI style inside a **dark window band** (`--ink-950`, full-bleed like `#projects`): masthead-like
  rows — mono uppercase label + Barlow weight-200 `tabular-nums` figure, hairline rules between rows.
  (Brand rule: metric style is reserved for dark windows — that's why this band is dark.)
- **Client-logo marquee — documented alternative, NOT the default:** a logo marquee (Capital One, Visa,
  CitiGroup) is possible with the `Marquee` component. **⚠ Do not build it without Erick explicitly
  confirming NDA/permission status for naming financial clients and using their logos.** Default = the
  three metrics above; the bio line already names clients as prose (as v1 did), which is a lower-risk
  pattern than logos.
- **Technique (precise):** `Counter` counts from 0 to target on enter trigger: `duration 1.4s`,
  `ease: 'power1.out'`, `snap: 1`, formatted (`1.4M` compact notation, `%` suffix static). Figures are
  server-rendered at final value; JS rewinds to 0 only under `MOTION_OK` and only just-in-time
  (inside the ScrollTrigger callback, not at boot — avoids showing 0 on slow scroll). Rows enter via
  `reveal.ts` stagger.
- **Library:** GSAP core + ScrollTrigger.
- **Trigger:** enter trigger, once, `start: 'top 80%'`.
- **Mobile:** same rows, single column, figures clamp ≥ 2.5rem.
- **Reduced-motion:** figures shown at final value, no counting.
- **Amber focus:** none (figures are canvas-200 on ink; keeping amber out preserves §2.4/§2.5 focuses).
- **Difficulty:** S. **Depends on:** `Counter.astro`, `counter.ts`, `reveal.ts`.
- **Done when:** with JS off all three final figures are in the HTML; with JS each counts up exactly
  once when scrolled into view; `tabular-nums` prevents any width jitter while counting.

### 2.7 Toolkit

- **Purpose:** the stack at a glance — fast scan, a bit of life, zero claims of "expert level" bars.
- **Exact content:** heading `Toolkit`; items (exact set, this order):
  `SQL` · `Power BI` · `DAX` · `Python` · `HTML` · `Claude AI` · `MCP Servers` · `AI Agents`.
  Secondary static line beneath (from v1 profile): `Currently extending into R and Tableau.`
- **Technique (precise):** `Marquee` — one row, infinite horizontal loop: CSS `@keyframes` translating
  the track `-50%` (track = items + one `aria-hidden` duplicate), `~35s linear infinite`. JetBrains Mono
  labels with hairline separators (`·`), not pills. `:hover`/`:focus-within` on the marquee pauses it
  (`animation-play-state: paused`). Individual item hover: color shifts `--canvas-500 → --text-primary`
  (dark band) with `var(--motion-base)`. The marquee sits at the tail of the Metrics dark band (same
  window) — one dark world, not two adjacent ones.
- **Explicitly future (do not build in v2):** drag-and-throw physics (Matter.js), WebGL treatments.
- **Library:** none — pure CSS. (Marquee is deliberately the cheapest component on the page.)
- **Trigger:** always running while visible; `animation-play-state: paused` when off-screen via a tiny
  IntersectionObserver toggle (don't burn compositor time off-screen).
- **Mobile:** same marquee, slower is fine; items never wrap (they scroll instead).
- **Reduced-motion:** static wrapped grid of the 8 labels (no duplicate track rendered visible, no animation).
- **Amber focus:** none.
- **Difficulty:** S. **Depends on:** `Marquee.astro`.
- **Done when:** the loop runs seam-free (no visible jump at the wrap point), pauses on hover and on
  keyboard focus, is static-but-complete under reduced-motion, and screen readers read each item exactly once.

### 2.8 Contact

- **Purpose:** close the deal with zero friction. Minimal by design — do not over-animate.
- **Exact content:** unchanged from v1 (email focal, `Get in touch` button, résumé download, LinkedIn/GitHub).
- **Technique (precise):** two things only:
  1. Section entrance via `reveal.ts` (single group, subtle: `y: 16`, no stagger drama).
  2. **Magnetic button** on `Get in touch` (`data-magnetic`): within a proximity radius of 1.4× the
     button's box, the button translates toward the pointer, max **8px**, via `gsap.quickTo` x/y
     (`duration 0.3, ease: 'expo.out'`); label inside moves at 40% of that. On leave, both return to 0
     (`duration 0.45, ease: 'expo.out'` — NO elastic/bounce). Keep the existing `:active` scale press.
- **Library:** GSAP core.
- **Trigger:** `pointermove` listener attached only when the section is on-screen; `(pointer: fine)` + `MOTION_OK` only.
- **Mobile:** no magnetism; button behaves as v1.
- **Reduced-motion:** no magnetism, instant reveal.
- **Amber focus:** the `Get in touch` primary button (amber fill with ink text — existing `btn-primary` treatment) is this view's single amber element.
- **Difficulty:** S. **Depends on:** `magnetic.ts`, `reveal.ts`.
- **Done when:** button is fully functional with JS off, keyboard-focusable with visible focus ring
  (magnetism never fires on keyboard focus), pull never exceeds 8px, and the mailto/download links work.

---

## 3 · Build backlog

Rules: one task = one commit-sized unit. Finish and verify the acceptance criterion (AC) before the
next. Phase gates are hard: Phase N+1 must not start until Phase N is done. Commits in Spanish per
repo history convention; code/comments in English.

### Phase 1 — Static & complete (no new animation)

| ID | Task | Files | AC (done when…) |
|---|---|---|---|
| P1-01 | Split `index.astro` into 8 section components (extract existing hero/projects/contact markup as-is; new sections as static placeholders slotted in order) | `src/pages/index.astro`, `src/components/sections/*.astro` | `pnpm build` passes; rendered HTML for hero/projects/contact is functionally identical to before (same ids, classes, content); page shows 8 sections in §2 order |
| P1-02 | Hero: add static `.hero-statement` headline with final word `decisions` (no rotation yet); wire into the existing CSS cascade (its `rise` delay slots between role and lede) | `sections/Hero.astro`, `src/styles/page.css` | Sentence renders without JS; hero load choreography still plays with the new line cascading in order; no overflow at 320px |
| P1-03 | Build `WhatIDo.astro` static: heading, intro, 3 `AnimatedCard`s (asymmetric wide+2 layout, inline SVG icons), CSS hover states | `sections/WhatIDo.astro`, `components/AnimatedCard.astro` | All content from §2.2 visible without JS; AA contrast verified; layout correct at 320/768/1280; hover lift works, fine-pointer only |
| P1-04 | Build `WhatIBuild.astro` static: heading + 3 `LiveTerminal`s rendering ALL lines (final state), dark panels, CSS caret | `sections/WhatIBuild.astro`, `components/LiveTerminal.astro` | Exact lines from §2.3 visible without JS; mono font; terminals legible at 320px; no horizontal page scroll |
| P1-05 | Build `Statement.astro` static: full sentence (display type per §2.4) + `PipelineSteps.astro` rendering the four steps (ghost numeral + caption + dark panel per step), each panel holding its FINAL composed SVG scene, with ids/groups named for later animation (`#raw-table`, `#particles`, `#db-cylinder`, `#dots-cloud`, `#bars-clean`, `#line-chart`) and the `01 — 02 — 03 — 04` progress marker | `sections/Statement.astro`, `components/PipelineSteps.astro` | Sentence + all four final scenes fully visible without JS at 320/768/1280; SVG groups present with the exact ids; amber appears only on `understandable visuals` (its viewport) + peak bar (step 04) |
| P1-06 | Build `Metrics.astro` static: dark band, bio line, 3 KPI rows with final figures server-rendered (`Counter.astro` markup contract from §1.4), marquee-of-logos NOT built (leave the §2.6 NDA warning as a code comment) | `sections/Metrics.astro`, `components/Counter.astro` | Figures `1.4M+ / 6 / 90%+` present in HTML source; KPI style = mono label + Barlow-200 tabular figure; AA on ink-950 |
| P1-07 | Build `Toolkit.astro` static: `Marquee.astro` with the 8 items + reduced-motion static-grid branch + duplicate-track `aria-hidden` structure (animation CSS included — it's pure CSS, this is its natural task) + "Currently extending…" line | `sections/Toolkit.astro`, `components/Marquee.astro` | Loop runs seamlessly, pauses on hover/focus; static wrapped grid under reduced-motion; SR reads items once |
| P1-08 | Contact: add `data-magnetic` to `Get in touch`; dissolve `#profile` (bio → Metrics, toolkit → Toolkit); update `.primary-nav` anchors to the new section set (`What I do`, `Work`, `Contact`) and any `#profile` references | `sections/Contact.astro`, `sections/Hero.astro`, `src/pages/index.astro` | No dead anchors; nav scrolls to right places; no content lost (every v1 sentence either lives somewhere or was consciously dropped in this task's commit message) |

### Phase 2 — Global motion infrastructure

| ID | Task | Files | AC |
|---|---|---|---|
| P2-01 | **Ask Erick, then** `pnpm add gsap lenis`; create `core.ts` (registerPlugin for ScrollTrigger/SplitText/MotionPath/DrawSVG/MorphSVG, `mm`, `MOTION_OK`) and empty `index.ts` entry imported from `index.astro` | `package.json`, `scripts/motion/core.ts`, `scripts/motion/index.ts`, `src/pages/index.astro` | Build passes; bundle loads without console errors; no visual change yet |
| P2-02 | `smooth-scroll.ts` per §1.3 contract (Lenis + ScrollTrigger sync + anchor routing + reduced-motion bypass + skip-link exemption) | `scripts/motion/smooth-scroll.ts` | Wheel/touch scroll is smoothed; nav anchors glide with header offset; keyboard scroll works; reduced-motion = native scroll; skip link jumps natively |
| P2-03 | `reveal.ts` global utility per §1.4 contract; apply markup attrs to WhatIDo, Metrics rows, Contact (NOT hero, NOT projects — their v1 choreography stays) | `scripts/motion/reveal.ts`, the 3 section files | Each tagged group reveals once on enter with stagger; JS-off shows everything; reduced-motion shows everything instantly; total stagger per group ≤ 0.5s |

### Phase 3 — Easy wins

| ID | Task | Files | AC |
|---|---|---|---|
| P3-01 | RotatingWord behavior (§2.1) | `components/RotatingWord.astro`, `scripts/motion/rotating-word.ts`, `sections/Hero.astro` | §2.1 done-when holds |
| P3-02 | Counter behavior (§2.6) | `scripts/motion/counter.ts` | §2.6 done-when holds |
| P3-03 | LiveTerminal sequencing incl. shared `sequence()` helper (§2.3) | `scripts/motion/terminal.ts` | §2.3 done-when holds; `sequence()` exported and unit-testable in isolation |
| P3-04 | Mouse-follow work preview (§2.5) incl. hiding inline thumbnails on fine-pointer desktop | `scripts/motion/mouse-preview.ts`, `sections/SelectedWork.astro`, `page.css` | §2.5 done-when holds |
| P3-05 | Magnetic button (§2.8) | `scripts/motion/magnetic.ts` | §2.8 done-when holds |
| P3-06 | Marquee off-screen pause (tiny IO toggling `animation-play-state`) | `scripts/motion/index.ts` or inline in `Toolkit.astro` script | Marquee animation paused while section off-screen (verify via devtools) |
| P3-07 | SectionNav labeled dot progress nav per §1.4 contract: fixed right edge, one dot per section, scroll-spy `aria-current` + visible label on the active dot, anchors routed through Lenis, hidden <60rem | `components/SectionNav.astro`, `scripts/motion/section-nav.ts`, section components (add `data-section-label`) | Active dot + label always match the section in view while scrolling; clicking a dot navigates with header offset; dots are keyboard-focusable with visible focus; with JS off the anchors still jump; not rendered <60rem |

### Phase 4 — The star moment (one, only one)

| ID | Task | Files | AC |
|---|---|---|---|
| P4-01 | Statement kinetic typography: SplitText words + scrub per §2.4 beat 1, amber on `understandable visuals` | `scripts/motion/pipeline.ts` (same module, part 1), `sections/Statement.astro` | Scrub-read works forward/backward; reduced-motion & no-JS show full sentence; amber only there |
| P4-02 | PipelineSteps timelines: four one-shot scene timelines per §2.4 beat 2 (rows stagger → MotionPath particles + DrawSVG cylinder → MorphSVG aggregation → DrawSVG charts), each on its own enter trigger, built with `sequence()`; progress-marker class swap wired to the triggers | `scripts/motion/pipeline.ts` | Each scene plays exactly once, in order, on desktop and mobile; progress marker tracks the active step; 60fps on a mid-range laptop |
| P4-03 | Reduced-motion + no-JS branches for the whole Statement section: gate every timeline via `mm.add(MOTION_OK, ...)` (no runtime ifs); verify final scenes render with JS disabled and with reduced-motion at 320/768/1280 | `scripts/motion/pipeline.ts`, `components/PipelineSteps.astro` | §2.4 reduced-motion and no-JS done-when clauses hold; zero timelines created under reduced motion (verify via devtools) |

### Phase 5 — Polish & QA

| ID | Task | Files | AC |
|---|---|---|---|
| P5-01 | Reduced-motion full pass: toggle `prefers-reduced-motion` and walk every section | — | Zero motion anywhere; all content visible; Lenis not initialized |
| P5-02 | No-JS pass: disable JS, walk every section | — | Every §2 "with JS off" clause verified |
| P5-03 | Playwright screenshots at 320/768/1280/1920 + hover/terminal states; store under `qa/` | `qa/` | Screenshots reviewed; no overflow, no truncation, no obscured focus |
| P5-04 | Performance: Lighthouse LCP ≤ 2.5s on the deployed page, JS bundle audited (GSAP plugins tree-shaken — import only used plugins), 60fps check on pipeline scrub (devtools performance recording) | — | Metrics recorded in `qa/PERF.md`; no long task > 200ms during scrub |
| P5-05 | A11y: AA contrast re-verified on all new surfaces (esp. terminal text on ink-950, KPI labels), keyboard walk-through, `aria-hidden` audit (marquee duplicate, preview figure, rotating layer) | — | No AA failures; tab order sane; SR announces each content item exactly once |
| P5-06 | Update `CLAUDE.md` phase table + `README`/OG copy for v2; **requires Erick's explicit sign-off on the new phase plan** (anti-abandono rule) | `CLAUDE.md` | Table reflects v2 phases and their status; Erick approved in-session |

---

## 4 · Guardrails for implementers

**Hard constraints (non-negotiable, from the session brief + brand system):**

1. Animate **only** `transform` and `opacity` as continuous/looping properties. Never animate
   layout-driving properties (`width`, `height`, `top`, `left`, margins, font-size) — not in loops,
   not in reveals. Sanctioned non-layout exceptions where the technique requires them: `clip-path`
   (wipes), `stroke-dashoffset`/`stroke-dasharray` (DrawSVG), path `d` morphs (MorphSVG),
   `border-color`/`background-color`/`color` on micro-hovers. v2 uses **no ScrollTrigger pinning**
   anywhere (decision 2026-07-06: stepped pipeline instead of pinned scrub); do not introduce it.
2. `prefers-reduced-motion: reduce` → every animation has a defined alternative (each §2 spec names
   it). Scripted animations live inside `mm.add(MOTION_OK, ...)`; CSS animations are covered by the
   existing blanket rule + explicit undo of any from-state.
3. Every section has a defined mobile behavior (each §2 spec names it). Pointer-dependent effects gate
   on `(hover: hover) and (pointer: fine)`.
4. Content is complete and legible on first paint without JS. JS enriches; it never gates content.
5. **One amber element per viewport.** Each §2 spec names it. Adding a second is a defect.
6. Brand rules: borders not shadows on dark surfaces; Cormorant only ≥ 28px; Barlow ≤ 600;
   tokens via `var(--token)` only — a raw hex value anywhere is a defect.
7. Easing: `expo.out` family for entrances, `ease: 'none'` inside scrubbed timelines, exits ≈ 75% of
   enter duration. Never bounce/elastic.

**Standing vetoes (from PRODUCT.md/DESIGN.md — rejecting these is why some specs differ from the generic version of the pattern):**
uniform fade-on-scroll cloned across sections · identical card grids · hero-metric big-number cards ·
uppercase eyebrow above every section · side-stripe borders · gradient text · glassmorphism ·
skill progress bars · amber as decoration.

**Naming conventions:** motion modules `scripts/motion/<kebab>.ts`, one default-exported
`init<Name>(): void` each, all invoked from `scripts/motion/index.ts`. Data attributes:
`data-reveal-group` / `data-reveal-item` / `data-counter*` / `data-magnetic` / `data-preview-src` /
`data-variant`. CSS classes follow the existing `page.css` style (plain kebab, no BEM). Identifiers,
comments, and page content in English; commit messages in Spanish (repo convention).

**Do not touch:** `src/styles/tokens.css`, `src/styles/tokens.dark.css` (versioned copies from the
brand repo), `src/data/coffee-pulse.json`, `WeeklyPulse.astro` internals, the hero CSS load
choreography and projects threshold reveal (unless a task explicitly names them), the deploy workflow.

**Do not install** anything beyond `gsap` and `lenis` without Erick's explicit approval. pnpm only.

**Adaptation clause:** implementers MAY change implementation details (exact durations ±20%, stagger
values, internal module structure, terminal copy phrasing) when the section's acceptance criterion and
the hard constraints above still hold. They may NOT change: section order, section content meaning,
the single-star-moment rule (§2.4 is the only heavyweight animated scene), the amber assignments, or
the reusable-component contracts in §1.4.

**Future (explicitly out of v2 scope):** Three.js/WebGL scenes, drag-and-throw physics (Matter.js),
client-logo marquee (blocked on NDA confirmation), blog/notes section, full dark-theme toggle.
