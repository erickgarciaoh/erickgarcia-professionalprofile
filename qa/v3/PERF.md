# v3 · Phase 6 — Performance (P6-03)

Measured 2026-07-10 against the local production build (`pnpm build` + `pnpm preview`,
Chromium via Playwright, viewport 1920×1080) for bundle/rAF checks, and against the deployed
GitHub Pages URL for the LCP deployed AC (see below) after the v3 push/deploy the same day.

## LCP (largest contentful paint)

| Run (fresh load, scroll top) | LCP element | LCP time (local) | Size |
|---|---|---|---|
| 1 | `H1.hero-heading` — "Erick García" | 60 ms | 21030 px² |
| 2 | `H1.hero-heading` — "Erick García" | 60 ms | 20961 px² |
| 3 | `H1.hero-heading` — "Erick García" | 56 ms | 21017 px² |

- **LCP element = the hero `h1`.** ✅ Contract met (§2.2, guardrail: "LCP must remain the h1").
  The signature canvas boots after `load` and fades in over 2.2 s, so it never becomes LCP;
  the SVG fallback is a layout placeholder at `opacity: 0` on boot-capable viewports and is
  not counted either.
- **LCP time ≤ 2.5 s on the deployed page: VERIFIED 2026-07-10.** Pushed to `origin/main`
  (104917a), GitHub Actions deploy completed successfully. Lighthouse (desktop preset, JSON
  output, Chromium via Playwright's bundled binary since no system Chrome was present) run
  against `https://erickgarciaoh.github.io/erickgarcia-professionalprofile/`:
  **LCP = 0.5 s (544.5 ms)**, Performance category score **100/100**, FCP 0.5 s, TBT 0 ms,
  CLS 0.015. Far under the 2.5 s target — the LCP node is text (hero `h1`), so it renders as
  soon as CSS + the Cormorant subset are ready, same shape as the local measurement. ✅ AC met.

## Bundle audit (retirement weight)

| Asset | Raw | Gzip |
|---|---|---|
| JS (`index…js` — GSAP suite + Lenis + all motion modules, single chunk) | 200.4 KB | 74.0 KB |
| CSS (`index…css`) | 48.9 KB | 14.5 KB |
| `index.html` (inc. inline SVG fallback paths + all section markup) | 77.4 KB | — |
| Fonts (self-hosted woff2, @fontsource subsets) | 29 files | — |
| Total `dist/` | 2.3 MB | — |

- **Retired modules leave zero weight.** Grep for `WeeklyPulse | RotatingWord | rotating-word |
  mouse-preview | coffee-pulse | hero-field | work-preview` across `dist/` → **0 hits**. In
  `src/` the only hit is a *historical comment* in `page.css:174` ("with WeeklyPulse retired
  (v3)…"), not an orphan rule or import. ✅ Retirement hygiene guardrail satisfied.
- Note (not a defect, not in scope): `core.ts` registers the full GSAP plugin set
  (ScrollTrigger, SplitText, MotionPath, DrawSVG, MorphSVG, TextPlugin). `core.ts` is a locked
  contract (§4 "Do not touch"), so no change proposed. If a future pass wants to shave the
  74 KB gz, MorphSVG/MotionPath usage is worth auditing — logged for backlog only.

## Hero signature-asset rAF budget (§2.2: ≤ 4 ms/frame, 60 fps)

Sampled rAF frame intervals over ~1.5–2 s windows on the running canvas.

| Condition | Avg frame interval | p95 | Max | Frames > 20 ms |
|---|---|---|---|---|
| Hero on-screen + pointer sweeping the figure (worst case, peak re-sampling every frame) | 6.05 ms | 6.2 ms | 6.6 ms | 0 / 362 |
| Hero on-screen, at rest | 6.04 ms | — | 6.6 ms | 0 / 248 |
| Hero off-screen (canvas paused by IntersectionObserver) | 6.05 ms | — | 6.6 ms | 0 / 248 |

- Headless Chromium runs rAF unthrottled (~165 fps), so 6 ms is the harness cadence, not the
  canvas cost. The **differential** on-screen vs off-screen = **−0.01 ms** (noise): the canvas
  frame work does not move the frame interval at all, i.e. it fits inside the idle slack of a
  6 ms frame → **well under the 4 ms budget** (consistent with the "164 fps headless" figure
  recorded when P2-03 landed). ✅
- **Pause paths verified:** off-screen (IntersectionObserver) stops the loop; earlier
  `visibilitychange` handling is in `hero-relief.ts`. DPR capped at `min(dpr, 2)`. ✅
- **No long frames** (0 frames > 20 ms) in any window, including active pointer interaction and
  while scrolling through the Promise scrub and PipelineSteps → **60 fps holds**. ✅

## Verdict

| Check | Status |
|---|---|
| LCP element = hero h1 | ✅ |
| LCP ≤ 2.5 s deployed | ✅ 0.5 s measured 2026-07-10, deployed URL |
| Retired-module weight gone | ✅ |
| Hero rAF ≤ 4 ms/frame | ✅ (below measurement threshold) |
| Off-screen / hidden pause | ✅ |
| Scrub + scenes 60 fps (no long frames) | ✅ |
