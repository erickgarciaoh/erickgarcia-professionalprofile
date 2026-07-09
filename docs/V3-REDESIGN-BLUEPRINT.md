# V3 Redesign Blueprint

Status: **approved plan (Erick, 2026-07-07), not yet implemented.** Single source of truth for the
v3 redesign. Written so a less capable model can pick any backlog task in §3 and implement it in
isolation, without re-deriving the plan.

v3 exists because v2, although technically clean, missed on five points Erick raised after living
with the deployed site (2026-07-07 session):

1. The SectionNav dots render crooked/misaligned and draw too much attention.
2. The page reads as a narrow center column with dead side margins on 1920/2560 screens.
3. The hero (WeeklyPulse window + "I don't just crunch numbers" line) no longer earns its place;
   the phrase also duplicates in What I do.
4. The animation budget landed one section off: What I do got the flattest treatment, the
   heavyweight PipelineSteps sat under a Statement that should have been two lines.
5. Selected work and Metrics should follow the reference's list-with-preview and horizontal-band
   models respectively.

**Reference (same as v2): https://cloudstudio.es/ — grammar, not register.** Full-bleed fluid
layout, huge display type, subtle right-edge dot nav, animated service cards, hover work-list with
switching preview, horizontal metrics band. NEVER its visual register (acid yellow, chunky
grotesque, mascot). Brand tokens and PRODUCT.md vetoes always win.

How to use this document as an implementer:

1. Read §4 (guardrails) once. They are binding. They inherit everything from
   `V2-ANIMATION-BLUEPRINT.md` §4 plus the v3 additions.
2. Take ONE task from the backlog (§3). Tasks are ordered; respect phase order and `Depends on`.
3. Read the section spec (§2) the task points to. Meet the **acceptance criterion** (binary) and
   the **hard constraints**. Implementation details may be adapted if both still hold.
4. Do not start tasks from a later phase "while you're at it".

---

## 0 · Audit snapshot (2026-07-07, v2 deployed)

| Item | Value |
|---|---|
| Framework | Astro 7.0.6 static, no React. GSAP ≥3.13 (all plugins) + Lenis installed |
| Layout today | Everything inside `.wrap { max-width: 72rem }` (`page.css:15`) → the "narrow" complaint |
| Sections (order) | Hero · What I do · What I build · Statement · Selected work (`#projects`) · Metrics · Toolkit · Contact |
| Motion modules | `core.ts, smooth-scroll.ts, reveal.ts, counter.ts, rotating-word.ts, terminal.ts, pipeline.ts, section-nav.ts, mouse-preview.ts, magnetic.ts, index.ts` |
| SectionNav defect | Labels hidden with `opacity: 0` still occupy flex layout; `align-items: flex-end` + variable label widths pushes every dot to a different x → the "curve". Root cause confirmed in `SectionNav.astro:67-79` |
| Deploy | GitHub Pages on push to `main`, base `/erickgarcia-professionalprofile/`. **The site is live and linked from CV/LinkedIn** — Phase 0 ships alone and immediately |

### Kept from v2 (do not rebuild)

`core.ts` gates (`mm`, `MOTION_OK`), Lenis contract, `reveal.ts`, `counter.ts` + `Counter.astro`,
`magnetic.ts`, `Marquee.astro` + Toolkit section (explicitly approved as-is), `terminal.ts`
`sequence()` helper, **PipelineSteps + pipeline.ts** (relocated, not rebuilt), the kinetic
scrub-read mechanic from P4-01 (reused at smaller scale in Promise), Contact section, the projects
content collection, dark-window treatment, anti-FOUC `[data-reveal='js']` pattern.

### Retired in v3 (delete, don't orphan)

| Piece | Files | When |
|---|---|---|
| WeeklyPulse dataviz | `components/WeeklyPulse.astro`, `src/data/coffee-pulse.json` | Phase 2. The analysis lives on in the coffee-shop repo; this landing no longer embeds it. Update CLAUDE.md §Datos in the same commit |
| RotatingWord | `components/RotatingWord.astro`, `scripts/motion/rotating-word.ts` | Phase 2 (dies with the old hero headline) |
| Hero `.hero-statement` + `.hero-lede` copy | `sections/Hero.astro`, `page.css` | Phase 2 (replaced by new copy, §2.2) |
| "I don't just crunch numbers" intro | `sections/WhatIDo.astro` | Phase 3 (replaced, §2.3) |
| Two of three LiveTerminals | `sections/WhatIBuild.astro` | Phase 3 (one condensed terminal survives inside the What-I-do automation card) |
| Cursor-follow work preview | `scripts/motion/mouse-preview.ts`, `.work-preview` figure + its `page.css` rules | Phase 4 (replaced by the fixed detail panel) |

Retirement hygiene is a guardrail (§4): every deletion removes imports, styles, init calls in
`scripts/motion/index.ts`, and QA references; `pnpm build` green proves it.

---

## 1 · Architecture

### 1.1 New/changed modules

```
src/
  scripts/motion/
    hero-field.ts      # NEW — signature hero asset (concept locked in P2-01; §2.2)
    work-panel.ts      # NEW — Selected-work list→panel switching (§2.6)
    promise.ts         # RENAMED SCOPE — short scrub-read for Promise (extracted from pipeline.ts beat 1)
    pipeline.ts        # KEPT — four one-shot scenes, now triggered inside #what-i-build
    (deleted: rotating-word.ts, mouse-preview.ts)
  components/
    ServiceCard.astro  # EVOLVED from AnimatedCard — adds a `scene` slot (§2.3)
    (deleted: WeeklyPulse.astro, RotatingWord.astro)
  components/sections/
    Hero.astro         # rebuilt (§2.2)
    WhatIDo.astro      # animated service cards (§2.3)
    WhatIBuild.astro   # hosts PipelineSteps (§2.4)
    Promise.astro      # RENAMED from Statement.astro (§2.5)
    SelectedWork.astro # list + detail panel (§2.6)
    Metrics.astro      # horizontal band (§2.7)
```

Section order (unchanged count, one rename): Hero · What I do · What I build · Promise ·
Selected work · Metrics · Toolkit · Contact. Section id `statement` → `promise`; update
`index.astro` `sectionNavItems`, any anchors, and `data-section-label`s in the same task that
renames the file.

### 1.2 The fluid layout system (Phase 1 — everything else builds on it)

The 72rem `.wrap` cap dies. Replacement contract:

```css
/* page.css — layout vars (NOT in tokens.css, which is untouchable) */
:root {
  --gutter: clamp(1.25rem, 4.5vw, 6.5rem);
  --page-max: 170rem; /* safety cap for >2560 ultrawide only; invisible below it */
}
.wrap {
  width: 100%;
  max-width: var(--page-max);
  margin-inline: auto;
  padding-inline: var(--gutter);
}
```

Binding rules:

- **Full-width layout ≠ full-width text.** Every paragraph keeps (or gains) a `max-width` in `ch`
  (existing caps: 42/46/60/65ch — audit and keep ≤ 75ch everywhere). What stretches is the
  *composition* (grids, display type, panels, bands), never body-text measure.
- Display type ceilings rise so type fills the width at 1920/2560 (per-section values in §2).
  All sizes stay `clamp()`-fluid; nothing may overflow at 320px.
- Dark bands (`#projects`, `#metrics`+Toolkit) are already full-bleed; their inner content adopts
  the same gutter.
- QA reference widths become **320 / 768 / 1280 / 1920 / 2560** for every subsequent phase.
  1920 and 2560 are Erick's actual screens; their absence in v2 QA is why the narrow problem
  shipped.

### 1.3 Content collection schema additions (Phase 4)

```ts
// content.config.ts — add to the projects schema
blurb: z.string().max(90).optional(),   // one-liner for the work list; falls back to summary
datasetSize: z.string().optional(),     // e.g. "149,116 rows" — shown in the detail panel
```

Known value: coffee-shop = `149,116 rows`. The other three (patient-revenue-ltv,
customer-complaints, maven-fuzzy-factory) **must be provided by Erick** — do not invent them;
omit the meta row if unconfirmed.

---

## 2 · Section-by-section specification

Shared vocabulary: "enter trigger" = ScrollTrigger `start: 'top 78%'`, `once: true`. Default ease
`expo.out`. Every scripted animation lives inside `mm.add(MOTION_OK, ...)`.

---

### 2.0 SectionNav — hotfix (Phase 0, ships alone)

- **Defect:** labels occupy layout space while `opacity: 0`; variable widths misalign the dots.
- **Fix (layout):** each `<a>` becomes `position: relative` with a fixed-size hit area
  (≥ 24×24px for a11y); `.dot-label` becomes `position: absolute; right: calc(100% + var(--space-2)); top: 50%; translate: 0 -50%` — out of flow. The `<ol>` no longer needs
  `align-items: flex-end`; dots form one exact column.
- **Fix (register — subtler, cloudstudio blend):** dot 6px, idle `var(--canvas-400)`;
  active dot `var(--canvas-700)` + `scale(1.3)` (no amber — nav is chrome, not focus).
  Label loses the pill (no background, no border, no radius): plain JetBrains Mono 0.6875rem
  uppercase, `var(--text-secondary)`, shown on hover/focus-visible/`aria-current` with the
  existing fade+4px slide. Focus ring stays visible on the anchor.
- **Unchanged:** scroll-spy logic (`section-nav.ts`), anchors via Lenis, hidden `<60rem`, JS-off
  behavior.
- **Done when:** the horizontal centers of all 8 dots are identical (assert via
  `getBoundingClientRect()` in a Playwright check, tolerance 0px); hovering any dot causes zero
  movement of any other dot; keyboard focus shows a ring and its label; deployed to `main`.

### 2.1 Fluid layout pass (Phase 1, global)

- **Task A — mechanics:** implement §1.2 (`--gutter`, `.wrap` rewrite, header/footer included);
  audit every `max-width` in `page.css` and section components, classifying each as *measure cap*
  (keep) or *layout corset* (remove/raise).
- **Task B — composition:** per-section wide pass. Minimums:
  - Hero: becomes the §2.2 layout (Phase 2 does the content; here only ensure the current hero
    doesn't break while stretched).
  - What I do: 3 cards span the full row at ≥60rem, gap scales with `--gutter`.
  - Statement/Promise sentence: ceiling `clamp(…, 6.5rem)` — display type must feel like it owns
    the width at 1920.
  - Selected work / Metrics / Toolkit / Contact: inner content adopts gutters; no band shows the
    old 72rem "shelf" edges.
- **Done when:** at 1920 and 2560 no viewport shows dead columns beyond `--gutter`; at 320 no
  horizontal scroll; every text block measures ≤ 75ch; screenshots at all five §1.2 widths stored
  under `qa/v3/phase1/`.

### 2.2 Hero (Phase 2)

- **Purpose:** identity in 3 seconds — name as the monument, one plain-language service sentence,
  one distinctive interactive asset. No project highlight (the work section owns that now).
- **Exact content:**
  - `h1`: `Erick García` — rendered as display uppercase via CSS (`text-transform`), Cormorant,
    `clamp(3.25rem, 10vw, 9.5rem)`, tight leading. The accessible name stays "Erick García".
  - Role line: `Senior Data Analyst / BI` (existing `.hero-role` treatment, scaled up one step).
  - Service sentence (final copy — replaces `.hero-statement` and `.hero-lede`):
    `Data analysis, report building and process automation for your specific needs — adaptable to different systems and structures, delivering reliable results in the shortest possible time.`
    Max measure 52ch.
  - CTAs unchanged: `View the work` → `#projects`, `Get in touch` → `#contact`.
  - Masthead `<dl>` (Focus / Currently / Based) survives, repositioned to the hero's lower edge.
- **Signature asset — concept locked in §2.2.1** (P2-01 `/impeccable shape` session with Erick,
  2026-07-07). The binding constraints the concept had to satisfy (still binding for P2-03):
  1. Interactive with pointer movement (`(pointer: fine)` only), data-themed, distinctive — NOT a
     copy of cloudstudio's particle sphere.
  2. Canvas 2D or SVG with **zero new dependencies** by default. Three.js/WebGL only if the shape
     session concludes it is necessary AND Erick approves the dependency explicitly.
  3. Static fallback (SVG/PNG or first-frame render) for no-JS and reduced-motion; the asset boots
     after load and never becomes the LCP element (LCP must remain the `h1`).
  4. rAF loop budget ≤ 4ms/frame on a mid-range laptop; DPR capped at 2; loop pauses when the tab
     is hidden and when the hero is off-screen.
  5. Amber: the hero viewport gets exactly ONE amber element — either inside the asset or the
     `View the work` solid button, never both. The shape session decides which.
- **Load choreography:** adapt the v1 cascade — name wipe → role → sentence → CTAs → masthead,
  asset fades in last (`autoAlpha`, after `load`).
- **Mobile:** name scales down fluidly (no wrap of "García" at 320px — test); asset simplifies or
  drops to its static fallback below 60rem if the concept is pointer-driven (pointless on touch).
- **Reduced-motion:** static fallback, no cascade beyond the existing blanket rule, no rAF loop.
- **Done when:** with JS off the hero shows name/role/sentence/CTAs/masthead/static asset; LCP is
  the `h1` at ≤ 2.5s on the deployed page; the pointer interaction runs at 60fps; the crunch-numbers
  phrase appears nowhere on the page; WeeklyPulse and RotatingWord files no longer exist in the
  repo and the build is green.

### 2.2.1 Signature asset — design contract (locked in P2-01, 2026-07-07)

Erick-approved in the P2-01 `/impeccable shape` session. This is the source of truth P2-03
implements; the five §2.2 constraints remain binding on top of it.

- **Concept: "Signal in the noise."** A full-bleed field of ~300 drifting data points behind the
  hero content. The pointer is the analyst's attention: points within its radius (~200px) ease
  toward a locally fitted least-squares trend line, and a hairline signal line draws through the
  neighborhood; on leave, points relax back into slow ambient drift. The asset is ambient
  background, not a second star — it demonstrates the thesis (find the signal) without competing
  with the name-monument.
- **Technique:** Canvas 2D, **zero new dependencies**. Module `src/scripts/motion/hero-field.ts`
  (§1.1). One transparent `<canvas>` absolutely positioned over the hero section,
  `aria-hidden="true"`, `pointer-events: none` (pointer tracked on the section, not the canvas).
  Point positions come from a **deterministic seeded PRNG** (no data file — coffee-pulse.json
  stays retired) so canvas and static fallback render the identical field.
- **Palette (no amber):** points `--ink-300`/`--canvas-400` at low alpha (≈0.10–0.35, sized
  1.5–2.5px); the fitted signal line `--data-1` slate (lead-categorical semantics: the signal,
  marked without spending the accent). A soft fade/exclusion mask keeps point density away from
  the text block so h1/sentence contrast is untouched. **Amber decision: the hero's single amber
  is the `View the work` solid CTA. The asset contains zero amber.**
- **Interaction gate:** boots only under `(pointer: fine)` AND ≥60rem AND `MOTION_OK`. Otherwise
  (touch, mobile, reduced-motion, no-JS) the hero shows the **static fallback**: an inline SVG of
  the same seeded field with one signal line already fitted — the "signal found" end state,
  identical visual identity.
- **Performance plan (vs. the §2.2 budget):** one rAF loop, O(N) per frame over ~300 points +
  O(k) local fit — well under 4ms on a mid-range laptop; DPR capped at
  `min(devicePixelRatio, 2)`; loop pauses via `IntersectionObserver` when the hero leaves the
  viewport and on `visibilitychange`. Canvas initializes after `window` `load` and fades in last
  in the load cascade (`autoAlpha`), so it never paints before the h1 — **LCP remains the h1**.
- **Distinctiveness check:** not cloudstudio's particle sphere (no 3D, no sphere, no
  cursor-orbit); distinct from the §2.3 Data-cleaning card scene (that one snaps dots to a rigid
  grid once; this is continuous regression fitting, never a grid).

### 2.3 What I do (Phase 3) — animated service cards

- **Purpose:** three capabilities that *demonstrate* themselves instead of stating themselves.
  This is where the "sad flat cards" complaint dies.
- **Exact content:** heading `What I do`; intro one-liner (replaces the crunch-numbers paragraph):
  `Three capabilities, one goal: numbers that arrive clean, on time, and mean something.`
  Card titles/bodies unchanged from v2 (§2.2 of the v2 blueprint).
- **Layout:** three equal columns at ≥60rem (cloudstudio grammar), single column below.
  *Veto note:* the "identical card grids" veto targets undifferentiated clones; here
  differentiation comes from each card's distinct live scene, which satisfies the veto's intent —
  documented here so implementers don't re-litigate it.
- **Component:** `ServiceCard.astro` (evolution of AnimatedCard): props `title, body`; named slot
  `scene` holding the animated panel. Card chrome: existing card treatment (border, radius,
  hover lift ≤4px, `@media (hover: hover)` only).
- **The three scenes (each = final state present in static HTML/SVG, animated on enter trigger,
  once; built with the shared `sequence()` helper):**
  1. **Data visualisation:** mini chart (5 bars + 1 line path) draws itself — DrawSVG strokes,
    then fills fade, ≈1.2s. Hover: bars do one subtle re-sort shuffle (transform-only, ≤0.5s,
    one iteration).
  2. **Automation processes:** one condensed `LiveTerminal` (the survivor), 4 lines max:
    `$ python run_daily_refresh.py` / `extract → transform → publish ... ok` /
    `✓ 0 manual steps` / blinking caret. Same `terminal.ts` sequencing, total ≤1.5s.
  3. **Data cleaning:** 14 scattered dots snap into a clean 2-column grid (transform-only tweens,
    stagger 0.04s, ≈1.1s, `expo.inOut`). Hover: one dot jitters out and re-snaps (once).
- **Library:** GSAP core + ScrollTrigger + DrawSVG; `terminal.ts`.
- **Amber focus:** none in this viewport — scenes use `--data-1` slate + neutrals (budget is spent
  in adjacent sections).
- **Mobile:** stacked; scenes play the same on enter; hover extras inert.
- **Reduced-motion / no-JS:** every scene visible in its final composed state; no timelines.
- **Done when:** all three scenes play exactly once on first view, in 60fps, are fully legible as
  static finals with JS off and with reduced-motion; the intro paragraph no longer says
  "crunch numbers"; AnimatedCard is either deleted or fully absorbed by ServiceCard (no dead files).

### 2.4 What I build (Phase 3) — the pipeline lives here now

- **Purpose:** the artifacts. The four PipelineSteps scenes (raw → extract → transform → decide)
  *are* what Erick builds — the correction of v2's one-slot-off animation budget.
- **Exact content:** heading `What I build`; one intro line:
  `From raw operational tables to decisions people can act on — this is the pipeline every project walks.`
  Then `PipelineSteps` **moved as-is** from Statement: four steps, ghost numerals, captions
  (`raw · extract · transform · decide`), progress marker, one-shot scene timelines, enter
  triggers. The three v2 terminals leave this section (one condensed survivor moved to §2.3;
  the other two deleted).
- **Technique:** no new animation work — relocation + regression. `pipeline.ts` keeps owning the
  four scenes; its selectors/anchors update to `#what-i-build`. The kinetic sentence does NOT come
  along (it becomes Promise, §2.5).
- **Amber focus:** step 04's peak bar (`--accent-on-dark`) — unchanged rule: only amber in its
  viewport.
- **Mobile / reduced-motion / no-JS:** exactly as specified in v2 §2.4 (final scenes static, all
  visible).
- **Done when:** the four scenes play exactly once, in order, inside the new section, with
  everything the v2 §2.4 done-when demanded still holding; no terminal markup remains in this
  section; no orphan CSS from the old layout.

### 2.5 Promise (Phase 3) — renamed from Statement, radically shortened

- **Purpose:** the thesis in one breath. Brief was v2's mistake; this section is now the pause
  between the pipeline and the work, not a second star moment.
- **Exact content:** small mono kicker `My promise` (existing `.project-kicker` treatment — mono
  caption, not an uppercase-eyebrow pattern repeat); then ONE display sentence (final copy):
  `Every data process I take on runs lean and fluid — optimized end to end, answered on time, delivered with quality.`
  Cormorant display, `clamp(1.9rem, 5vw, 4.5rem)`, measure ≤ 24ch.
- **Technique:** the P4-01 scrub-read mechanic reused at reduced scale: SplitText words,
  `autoAlpha 0.18 → 1`, `scrub: 0.6`, over ~70vh of scroll. No pin, no scenes, nothing else.
  Module: `promise.ts` (the scrub half extracted from `pipeline.ts`).
- **Amber focus:** the words `optimized end to end` (`--accent`), lighting only when their alpha
  completes — this viewport's single amber.
- **Section rename mechanics:** file → `Promise.astro`, id → `#promise`, label → `Promise`;
  update `index.astro` (import + `sectionNavItems`) and any references. No `#statement` anchor
  remains anywhere.
- **Mobile:** same, fluid type. **Reduced-motion / no-JS:** full sentence visible, amber static.
- **Done when:** the section occupies ≈1 viewport, reads forward/backward with scroll, the old
  long sentence is gone, `#statement` returns zero grep hits, reduced-motion/no-JS show the
  complete sentence.

### 2.6 Selected work (Phase 4) — list + switching detail panel

- **Purpose:** the four projects in the reference's strongest pattern: scan the list, see the
  proof change beside it.
- **Layout ≥60rem (inside the existing dark window):** two columns ≈ 40/60.
  - **Left — the list:** one `<ol>`, all four projects equal (the "featured" flag stops driving
    layout; keep it in the schema for potential future use). Each row: index numeral (mono,
    ghosted), title (display size, the row IS the link to `liveUrl`), `blurb` one-liner
    (fallback: `summary`), and a compact `Repository ↗` link.
  - **Right — the panel:** sticky (`position: sticky`, CSS — not GSAP pinning) figure showing the
    active project: cover image, meta rows in the masthead style — `Dataset` (`datasetSize`,
    row omitted if unconfirmed), `Stack` (the existing array, joined with `·`), and a
    `Live data-story ↗` link.
- **Interaction (`work-panel.ts`):** `pointerenter` OR keyboard focus on a row activates it:
  panel crossfades (`autoAlpha` 0.18s out / 0.25s in, image `src` swap while hidden — same
  build-time `getImage()` pre-resolution already used in v2), active row gets a hairline marker +
  full-opacity title; inactive rows dim to `--canvas-500`-on-ink levels (AA still required for
  their text). Initial active = first project. Gate: `MOTION_OK` for the fade (without it, swap is
  instant — content still switches).
- **Mobile / coarse pointer (<60rem):** the panel doesn't render; rows become the v2-style stacked
  cards (thumbnail + title + summary + stack + links) — all data reachable without hover.
- **No-JS:** panel statically shows project 1; every row is a working anchor with title + blurb +
  repo link visible. Nothing is hover-gated.
- **Retirement:** `mouse-preview.ts` + `.work-preview` figure + related CSS die in this phase.
- **Amber focus:** the panel's `Live data-story ↗` link — single amber in the viewport.
- **⚠ Content note (carried from v2):** any future screenshot must be NDA-scrubbed; the four
  current covers are public-dataset and fine.
- **Done when:** hovering/focusing each row switches the panel to the right cover and meta with no
  layout shift; keyboard tab order visits every row and the panel links; at <60rem and with JS off
  all four projects are fully browsable; `datasetSize` renders only for confirmed values;
  mouse-preview code returns zero grep hits.

### 2.7 Metrics (Phase 5) — horizontal band

- **Purpose:** same three numbers, displayed the simple way: one horizontal strip, read left to
  right, done.
- **Exact content:** unchanged — heading `Six years of production numbers`, the bio line (it names
  clients as prose; keep — lower-risk than logos, NDA warning from v2 §2.6 still applies to any
  logo idea), and the three Counter metrics (`1.4M+ / 6 / 90%+` with their labels).
- **Layout:** the `<dl>` becomes a horizontal band: three cells in a row at ≥48rem, separated by
  vertical hairlines (`border-inline-start`), figure above (Barlow 200, `tabular-nums`,
  `clamp(2.5rem, 4.5vw, 4rem)`), mono label below. Full-bleed dark band shared with the Toolkit
  marquee (one dark world — unchanged). Below 48rem: single column with horizontal hairlines
  (today's pattern).
- **Technique:** `Counter`/`counter.ts` untouched. Only CSS changes + `reveal.ts` group stays.
- **Anti-template line:** this is a band, not big-number *cards* — no boxes, no borders around
  cells beyond the hairline separators, no icons. That keeps the v2 veto satisfied.
- **Amber focus:** none. **Mobile / reduced-motion / no-JS:** as v2 (final figures server-rendered).
- **Done when:** at ≥1280 the three metrics read as one horizontal line with hairline separators;
  counters still fire once; no width jitter (`tabular-nums`); AA contrast holds; mobile stacks.

### 2.8 Toolkit & Contact — no changes

Explicitly approved as-is (Erick, 2026-07-07). Only Phase 1's gutter adoption touches them.
Do not "improve" them.

---

## 3 · Build backlog

Rules: one task = one commit-sized unit. Verify the AC before the next task. Phase gates are hard.
Commits in Spanish; code/comments/content in English. Mark tasks `✅` here when done.

### Phase 0 — SectionNav hotfix (ships alone, immediately)

| ID | Task | Files | AC (done when…) |
|---|---|---|---|
| P0-01 ✅ | Fix dot alignment (label out of flow) + subtle restyle per §2.0; deploy | `components/SectionNav.astro` | §2.0 done-when holds; pushed to `main` and verified on the live site |

### Phase 1 — Fluid full-width layout

| ID | Task | Files | AC |
|---|---|---|---|
| P1-01 ✅ | Layout mechanics per §1.2: `--gutter`/`--page-max`, `.wrap` rewrite, header/footer; max-width audit (measure caps stay, corsets die) | `src/styles/page.css`, section components with local `max-width` | No dead columns beyond gutters at 1920/2560; no h-scroll at 320; text ≤ 75ch everywhere |
| P1-02 ✅ | Per-section wide composition pass per §2.1 Task B; Playwright screenshots at 320/768/1280/1920/2560 → `qa/v3/phase1/` | section components, `page.css`, `qa/v3/phase1/` | §2.1 done-when holds; screenshots reviewed |

### Phase 2 — Hero

| ID | Task | Files | AC |
|---|---|---|---|
| P2-01 ⚠️ REABIERTA | `/impeccable shape` session WITH Erick: lock the signature asset concept against the 5 constraints in §2.2; append the design contract to this file as §2.2.1 | `docs/V3-REDESIGN-BLUEPRINT.md` | §2.2.1 exists, names technique/fallback/perf plan/amber choice; Erick approved in-session |
| P2-02 ✅ | Hero static rebuild per §2.2: new copy + type scale + masthead reposition; **delete** WeeklyPulse.astro, coffee-pulse.json, RotatingWord.astro, rotating-word.ts; update CLAUDE.md §Datos | `sections/Hero.astro`, `page.css`, `index.astro`, deletions, `CLAUDE.md` | Hero complete without JS at all 5 widths; build green with zero references to deleted files; crunch-numbers phrase gone site-wide |
| P2-03 ⚠️ REABIERTA | Implement the asset per §2.2.1: `hero-field.ts` (or the name the contract picks), pointer interaction, static fallback, pauses, load choreography hook | `scripts/motion/hero-field.ts`, `sections/Hero.astro`, `scripts/motion/index.ts` | §2.2 done-when holds (LCP = h1, 60fps, fallbacks, single amber) |

**2026-07-09 — P2-01/P2-03 reabiertas.** El concepto "Signal in the noise" se implementó (hero-field.ts/hero-field-data.ts) y hasta se le subió el contraste, pero Erick decidió en revisión visual que el concepto no convence — no es un problema de tuning, es de concepto. §2.2.1 queda como historial de la decisión original, no como contrato vigente. Código actual de `hero-field.ts`/`hero-field-data.ts` se deja funcionando tal cual (no se retira) hasta elegir el reemplazo, para no bloquear el resto del build. Decisión explícita de Erick: seguir con Fase 3 en paralelo y volver a este punto con una nueva sesión `/impeccable shape` antes de reimplementar.

### Phase 3 — Section rotation

| ID | Task | Files | AC |
|---|---|---|---|
| P3-01 ✅ | ServiceCard + three animated scenes per §2.3 (viz draw / condensed terminal / dots snap); new intro line; delete or absorb AnimatedCard | `components/ServiceCard.astro`, `sections/WhatIDo.astro`, `scripts/motion/` scene wiring | §2.3 done-when holds |
| P3-02 ✅ | Move PipelineSteps into What I build per §2.4; delete the two dead terminals; intro line; selector updates in `pipeline.ts` | `sections/WhatIBuild.astro`, `sections/Statement.astro` (emptied), `scripts/motion/pipeline.ts` | §2.4 done-when holds (full regression of the four scenes) |
| P3-03 ✅ | Promise section per §2.5: rename file/id/label, new copy, `promise.ts` scrub extracted from `pipeline.ts` | `sections/Promise.astro`, `scripts/motion/promise.ts`, `index.astro` | §2.5 done-when holds; zero `#statement` hits |

### Phase 4 — Selected work

| ID | Task | Files | AC |
|---|---|---|---|
| P4-01 ✅ | Schema + content: add `blurb`/`datasetSize` per §1.3; fill blurbs; **ask Erick for the three unconfirmed dataset sizes** (coffee = 149,116 rows) | `content.config.ts`, `src/content/projects/*.md` | Build green; blurbs ≤ 90 chars; only confirmed sizes present |
| P4-02 ✅ | Static layout per §2.6: list + sticky panel, mobile stacked cards, no-JS complete; featured flag stops driving layout | `sections/SelectedWork.astro`, `page.css`, `pages/index.astro` | §2.6 no-JS and mobile clauses hold at all 5 widths (screenshots in `qa/v3/phase4/`) |
| P4-03 ✅ | `work-panel.ts` interaction (hover/focus activation, crossfade, dimming); **delete** mouse-preview.ts + `.work-preview` + CSS | `scripts/motion/work-panel.ts`, `scripts/motion/index.ts`, `page.css` | §2.6 done-when holds; mouse-preview zero grep hits |

### Phase 5 — Metrics band

| ID | Task | Files | AC |
|---|---|---|---|
| P5-01 ✅ | Horizontal band restyle per §2.7 (CSS-only; Counter untouched) | `sections/Metrics.astro` | §2.7 done-when holds |

### Phase 6 — QA & close

| ID | Task | Files | AC |
|---|---|---|---|
| P6-01 | Reduced-motion + no-JS full passes over the new page | — | Zero motion / all content visible; every §2 no-JS clause verified |
| P6-02 | Playwright screenshots 320/768/1280/1920/2560 + interaction states (work panel per row, hero asset, card scenes) → `qa/v3/` | `qa/v3/` | Reviewed; no overflow/truncation/obscured focus |
| P6-03 | Performance: Lighthouse LCP ≤ 2.5s deployed (LCP = hero h1), bundle audit (WeeklyPulse/RotatingWord/mouse-preview weight gone), hero rAF ≤ 4ms/frame, scrub/scenes 60fps → `qa/v3/PERF.md` | `qa/v3/PERF.md` | All thresholds met and recorded |
| P6-04 | A11y: axe-core (wcag2a/aa) 0 real violations, AA contrast on new surfaces (dimmed list rows, band figures, nav labels), full keyboard walk, `aria-hidden` audit | — | All pass |
| P6-05 | Close: CLAUDE.md v3 table final states + memory update + README/OG copy if hero copy changed; **requires Erick's explicit sign-off** | `CLAUDE.md`, memory | Erick approved in-session |

---

## 4 · Guardrails for implementers

**Everything in `V2-ANIMATION-BLUEPRINT.md` §4 remains binding** (transform/opacity-only,
`mm.add(MOTION_OK)` gating, no-JS completeness, one amber per viewport, borders-not-shadows on
dark, Cormorant ≥28px, Barlow ≤600, tokens-only, expo easing family, no bounce/elastic, naming
conventions, pnpm-only). v3 additions and amendments:

1. **No GSAP pinning, still.** The Selected-work panel uses CSS `position: sticky` — that is the
   only sanctioned "fixed while scrolling" pattern.
2. **rAF canvas loops are now sanctioned, only for the hero asset**, under the §2.2 budget
   (≤ 4ms/frame, DPR ≤ 2, pause off-screen and on `visibilitychange`, never the LCP).
3. **Full-width ≠ full-width text.** Any paragraph over 75ch at any viewport is a defect.
4. **Retirement hygiene.** A deletion task isn't done until imports, init calls
   (`scripts/motion/index.ts`), CSS blocks, and QA references are gone and `pnpm build` is green.
   Orphan files are defects.
5. **QA widths are five:** 320/768/1280/1920/2560, every phase from Phase 1 on.
6. **Copy is locked in §2** (hero sentence, intro lines, promise sentence). Wording tweaks are an
   Erick decision, not an implementer adaptation.
7. **No new dependencies, period**, unless P2-01's contract names one and Erick approved it
   in-session.
8. **Amber map of the final page** (one per viewport, adding a second is a defect):
   Hero → the `View the work` solid CTA (decided in P2-01; the asset has zero amber, §2.2.1) ·
   What I do → none · What I build → step-04 peak
   bar · Promise → `optimized end to end` · Selected work → panel's Live link · Metrics/Toolkit →
   none · Contact → Get in touch button.

**Do not touch:** `src/styles/tokens.css`, `tokens.dark.css`, the deploy workflow, Toolkit and
Contact sections (beyond Phase 1 gutters), `counter.ts`, `magnetic.ts`, `reveal.ts` contracts.

**Adaptation clause:** durations ±20%, stagger values, and internal module structure may adapt if
the AC and hard constraints hold. May NOT change: section order, the copy in §2, amber
assignments, the single-heavyweight rule (PipelineSteps remains the only heavyweight animated
area; the hero asset is ambient, not a second star), or the retirement list in §0.

**Future (explicitly out of v3 scope):** blog/notes, full dark-theme toggle, i18n ES/EN,
analytics, per-project case-study pages, client-logo marquee (NDA-blocked), Matter.js physics.
