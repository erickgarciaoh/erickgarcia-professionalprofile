# P5-04 — Performance

Measured 2026-07-06 against the deployed page:
`https://erickgarciaoh.github.io/erickgarcia-professionalprofile/`
(commit `d548808`, deployed via GitHub Actions run 28837220211).

## Lighthouse (performance category), 3 runs

Tool: `pnpm dlx lighthouse` headless, using the Playwright-installed Chromium
(`chrome-win64/chrome.exe`) as `CHROME_PATH` — no system Chrome on this machine.

| Run | Score | LCP | FCP | TBT | CLS | Longest single task |
|---|---|---|---|---|---|---|
| 1 | 96 | 2487 ms | 1962 ms | 0 ms | 0.0003 | 175 ms |
| 2 | 98 | 2368 ms | — | 32 ms | — | 162 ms |
| 3 | 96 | 2327 ms | — | 16 ms | — | 164 ms |

**AC: LCP ≤ 2.5 s — met on all 3 runs** (2327–2487 ms). Margin on run 1 is
thin (13 ms); consistently in range across reruns, not a fluke on the low end.

No long task exceeded 200 ms in any run (max observed: 175 ms).

## GSAP bundle audit

`src/scripts/motion/core.ts` registers exactly the 5 plugins named in the
blueprint (§1.1 / §2.4) — no extras:

- `ScrollTrigger` — used in `reveal.ts`, `terminal.ts`, `section-nav.ts`, `pipeline.ts`
- `SplitText` — used in `rotating-word.ts`, `pipeline.ts` (statement kinetic type)
- `MotionPathPlugin` — used in `pipeline.ts` (extract-scene particles)
- `DrawSVGPlugin` — used in `pipeline.ts` (cylinder strokes, decide-scene draw)
- `MorphSVGPlugin` — used in `pipeline.ts` (transform-scene dots→bars)

All 5 confirmed in active use (grepped, not dead imports). Output is a single
bundled client script (Astro/Vite default chunking):

- `index.astro_astro_type_script_index_0_lang.*.js` — 186 KB raw / **69 KB gzip**

## 60fps check on the pipeline scrub

Method: injected a `requestAnimationFrame` frame-gap sampler, then drove the
Statement section with real wheel events (`page.mouse.wheel`) forward through
all four PipelineSteps scenes and back, matching how a user actually scrub-reads
the kinetic sentence + watches the scenes trigger.

| Metric | Value |
|---|---|
| Frames sampled | 559 |
| Max frame gap | 9.7 ms |
| Avg frame gap | 7.4 ms |
| Frames over 16.7 ms (sub-60fps) | 0 |
| Frames over 50 ms | 0 |
| Frames over 200 ms (long task) | 0 |

**AC: no long task > 200 ms during the scrub — met**, with wide margin (worst
frame was 9.7 ms, ~6x faster than the 16.7 ms/frame budget for 60fps).
