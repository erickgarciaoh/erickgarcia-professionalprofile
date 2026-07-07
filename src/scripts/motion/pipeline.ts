import { gsap, ScrollTrigger, mm, MOTION_OK } from './core';
import { SplitText } from 'gsap/SplitText';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { sequence, type SequenceStep } from './terminal';

// Statement — the ONE star moment (§2.4). Two beats live here:
//   1. Kinetic typography over the thesis sentence (scrub-read).
//   2. The four PipelineSteps scenes, each a one-shot timeline on its own
//      enter trigger, built with the shared `sequence()` helper (§1.4).
// Everything is gated behind `mm.add(MOTION_OK, ...)` so reduced-motion users
// (and no-JS visitors) get the static, fully-composed final scenes with zero
// timelines created — no runtime `if (reducedMotion)` branches.

// --- Beat 1: kinetic typography (P4-01) ---------------------------------

const WORD_EACH = 0.4; // per-word alpha/rise duration within the scrub timeline
const WORD_STEP = 0.14; // stagger between successive words
const ACCENT_LIGHT = 0.25; // amber colour tween duration

function initStatementType(): (() => void) | void {
	const sentence = document.querySelector<HTMLElement>('.statement-sentence');
	if (!sentence) return;

	const split = new SplitText(sentence, { type: 'words', wordsClass: 'stmt-word' });
	const words = split.words as HTMLElement[];
	if (words.length === 0) {
		split.revert();
		return;
	}

	// Accent words ("understandable visuals") — prefer the authored span, fall
	// back to matching text so the amber assignment survives SplitText DOM churn.
	let accentWords = Array.from(sentence.querySelectorAll<HTMLElement>('.accent-words .stmt-word'));
	if (accentWords.length === 0) {
		const accentText = new Set(['understandable', 'visuals']);
		accentWords = words.filter((w) => accentText.has(w.textContent?.trim().toLowerCase() ?? ''));
	}

	// Resolve concrete colours so GSAP interpolates the amber ignition cleanly.
	const inkColor = getComputedStyle(words[0]).color;
	const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();

	// From-state (JS-only, pattern 1): dim the whole sentence and de-amber the
	// accent words so they can light up on scroll.
	gsap.set(words, { autoAlpha: 0.18, y: 12 });
	if (accentWords.length > 0) gsap.set(accentWords, { color: inkColor });

	const tl = gsap.timeline({
		scrollTrigger: {
			trigger: sentence,
			start: 'top 80%',
			end: '+=120%', // ~120vh scrub, no pinning
			scrub: 0.6,
		},
	});

	tl.to(words, { autoAlpha: 1, y: 0, ease: 'none', duration: WORD_EACH, stagger: { each: WORD_STEP } }, 0);

	// Amber ignites only once the last accent word's alpha has completed.
	if (accentWords.length > 0) {
		const lastAccentIdx = words.indexOf(accentWords[accentWords.length - 1]);
		const accentDoneAt = (lastAccentIdx < 0 ? words.length - 1 : lastAccentIdx) * WORD_STEP + WORD_EACH;
		tl.to(accentWords, { color: accentColor, ease: 'none', duration: ACCENT_LIGHT }, accentDoneAt);
	}

	return () => {
		tl.scrollTrigger?.kill();
		tl.kill();
		split.revert(); // restores the original sentence + static amber accent
	};
}

// --- Beat 2: the four PipelineSteps scenes (P4-02) ----------------------

const SCENE_START = 'top 70%'; // each step's own enter trigger, once

function q<T extends Element>(root: ParentNode, sel: string): T[] {
	return Array.from(root.querySelectorAll<T>(sel));
}

// Step 01 · raw — the stylized table's rects stagger in.
function buildRawScene(scene: SVGElement): gsap.core.Timeline {
	const rows = q<SVGRectElement>(scene, '#raw-table rect');
	gsap.set(rows, { autoAlpha: 0, y: 8 });

	const step: SequenceStep = [
		{ targets: rows, autoAlpha: 1, y: 0, duration: 0.4, ease: 'expo.out', stagger: { amount: 0.6 } },
	];
	return sequence([step]);
}

// Step 02 · extract — 14 particles fly along curved paths into the cylinder
// while the cylinder's strokes draw and its fills fade in.
function buildExtractScene(scene: SVGElement): gsap.core.Timeline {
	const particles = q<SVGCircleElement>(scene, '#particles circle');
	const cylinder = q<SVGElement>(scene, '#db-cylinder path, #db-cylinder ellipse');

	gsap.set(particles, { autoAlpha: 0 });
	gsap.set(cylinder, { drawSVG: '0%', fillOpacity: 0 });

	const step: SequenceStep = [
		{ targets: cylinder, drawSVG: '100%', duration: 1.1, ease: 'power1.inOut', position: 0 },
		{
			targets: particles,
			autoAlpha: 1,
			duration: 0.9,
			ease: 'power1.inOut',
			stagger: 0.04,
			position: 0.15,
			// Each particle curves from a mini-table exit point to its authored
			// rest position; four exit rows read as ~4 converging streams.
			motionPath: (i: number, t: SVGCircleElement) => {
				const cx = Number(t.getAttribute('cx'));
				const cy = Number(t.getAttribute('cy'));
				const sx = 150;
				const sy = 49 + (i % 4) * 24;
				const mx = (sx + cx) / 2;
				const my = Math.min(sy, cy) - 18 - (i % 3) * 6;
				return {
					path: [
						{ x: sx, y: sy },
						{ x: mx, y: my },
						{ x: cx, y: cy },
					],
					alignOrigin: [0.5, 0.5],
				};
			},
		},
		{ targets: cylinder, fillOpacity: 1, duration: 0.5, ease: 'none', position: 0.7 },
	];
	return sequence([step]);
}

// Step 03 · transform — a scattered dot cloud converges as five bars morph up
// from seeds at the baseline (MorphSVG). The "many rows, few values" metaphor.
function buildTransformScene(scene: SVGElement): gsap.core.Timeline {
	const template = scene.querySelector<SVGGElement>('#dots-cloud');
	const barsGroup = scene.querySelector<SVGGElement>('#bars-clean');
	if (!template || !barsGroup) return gsap.timeline({ paused: true });

	// Read bar geometry before converting rects to paths.
	const rects = q<SVGRectElement>(barsGroup, 'rect');
	const geo = rects.map((r) => ({
		x: Number(r.getAttribute('x')),
		w: Number(r.getAttribute('width')),
	}));
	const barCenters = geo.map((g) => g.x + g.w / 2);
	const BASE_Y = 176;

	MorphSVGPlugin.convertToPath(rects);
	const bars = q<SVGPathElement>(barsGroup, 'path');
	const finalD = bars.map((b) => b.getAttribute('d') ?? '');
	bars.forEach((bar, i) => {
		const cx = barCenters[i];
		// Collapsed seed: a dot-sized square sitting on the baseline.
		bar.setAttribute('d', `M${cx - 3},${BASE_Y - 6} L${cx + 3},${BASE_Y - 6} L${cx + 3},${BASE_Y} L${cx - 3},${BASE_Y} Z`);
	});

	// Paint the dot cloud from the defs template (JS-only — never in the static
	// scene, so no-JS/reduced-motion show only the final bars).
	const cloud = template.cloneNode(true) as SVGGElement;
	cloud.removeAttribute('id');
	cloud.setAttribute('class', 'dots-live');
	barsGroup.parentNode?.insertBefore(cloud, barsGroup);
	const dots = q<SVGCircleElement>(cloud, 'circle');

	const nearestCenter = (cx: number) =>
		barCenters.reduce((best, c) => (Math.abs(c - cx) < Math.abs(best - cx) ? c : best), barCenters[0]);

	const step: SequenceStep = [
		{
			targets: dots,
			autoAlpha: 0,
			duration: 0.7,
			ease: 'expo.inOut',
			stagger: { amount: 0.4 },
			position: 0,
			x: (_i: number, t: SVGCircleElement) => nearestCenter(Number(t.getAttribute('cx'))) - Number(t.getAttribute('cx')),
			y: (_i: number, t: SVGCircleElement) => BASE_Y - 4 - Number(t.getAttribute('cy')),
		},
		{
			targets: bars,
			morphSVG: (i: number) => finalD[i],
			duration: 0.9,
			ease: 'expo.inOut',
			stagger: 0.06,
			position: 0.25,
		},
	];

	const tl = sequence([step]);
	// Guarantee the final composed bars even if the timeline is killed mid-play.
	(tl as gsap.core.Timeline & { _pipelineFinalize?: () => void })._pipelineFinalize = () => {
		bars.forEach((bar, i) => bar.setAttribute('d', finalD[i]));
		cloud.remove();
	};
	return tl;
}

// Step 04 · decide — baseline + line draw themselves, then the bars' fills and
// the line's nodes fade in. The peak bar stays its authored amber.
function buildDecideScene(scene: SVGElement): gsap.core.Timeline {
	const baseline = scene.querySelector<SVGLineElement>('line');
	const polyline = scene.querySelector<SVGPolylineElement>('#line-chart polyline');
	const bars = q<SVGRectElement>(scene, '.decide-bars rect');
	const nodes = q<SVGCircleElement>(scene, '#line-chart circle');
	const strokes = [baseline, polyline].filter(Boolean) as SVGElement[];

	gsap.set(strokes, { drawSVG: '0%' });
	gsap.set(bars, { fillOpacity: 0, y: 8 });
	gsap.set(nodes, { autoAlpha: 0 });

	const steps: SequenceStep[] = [
		[{ targets: strokes, drawSVG: '100%', duration: 0.9, ease: 'none' }],
		[
			{ targets: bars, fillOpacity: 1, y: 0, duration: 0.5, ease: 'expo.out', stagger: 0.08 },
			{ targets: nodes, autoAlpha: 1, duration: 0.3, ease: 'expo.out', stagger: 0.06, position: '<0.15' },
		],
	];
	return sequence(steps);
}

const SCENE_BUILDERS: Record<string, (scene: SVGElement) => gsap.core.Timeline> = {
	raw: buildRawScene,
	extract: buildExtractScene,
	transform: buildTransformScene,
	decide: buildDecideScene,
};

function initPipelineScenes(): (() => void) | void {
	const steps = q<HTMLElement>(document, '.pipeline-step');
	if (steps.length === 0) return;

	const keys = ['raw', 'extract', 'transform', 'decide'];
	const cleanups: (() => void)[] = [];

	steps.forEach((step, i) => {
		const key = keys[i];
		const build = SCENE_BUILDERS[key];
		const scene = step.querySelector<SVGElement>('.scene');
		if (!build || !scene) return;

		const tl = build(scene); // paused; from-states already set
		const finalize = (tl as gsap.core.Timeline & { _pipelineFinalize?: () => void })._pipelineFinalize;

		const trigger = ScrollTrigger.create({
			trigger: step.querySelector('.step-panel') ?? step,
			start: SCENE_START,
			once: true,
			onEnter: () => tl.play(),
		});

		cleanups.push(() => {
			trigger.kill();
			tl.kill();
			finalize?.(); // snap to the composed final scene if killed mid-play
		});
	});

	return () => cleanups.forEach((cleanup) => cleanup());
}

export default function initPipeline(): void {
	mm.add(MOTION_OK, () => {
		const cleanups: (() => void)[] = [];

		const typeCleanup = initStatementType();
		if (typeCleanup) cleanups.push(typeCleanup);

		const scenesCleanup = initPipelineScenes();
		if (scenesCleanup) cleanups.push(scenesCleanup);

		return () => cleanups.forEach((cleanup) => cleanup());
	});
}
