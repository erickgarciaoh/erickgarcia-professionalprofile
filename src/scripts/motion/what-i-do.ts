import { gsap, ScrollTrigger, mm, MOTION_OK } from './core';

// What I do — three service cards, each with a live scene that demonstrates
// the capability instead of describing it (§2.3). Every scene plays on its
// own enter trigger, then loops indefinitely with an idle pause between
// replays (Erick, 2026-07-10) so a card doesn't stay frozen in its solved
// state forever once scrolled past. Built with fromTo() (not to() + a
// separate gsap.set()) so every property is unambiguous on each repeat —
// GSAP's repeat only reliably restores a tween's own explicit "from" value.
// reduced-motion/no-JS visitors see the composed final state because these
// timelines only ever get created inside MOTION_OK.

const SCENE_START = 'top 78%';
const IDLE_REPEAT_DELAY = 10; // seconds the finished scene rests before replaying
const CHAR_DURATION = 0.014; // seconds per typed character
const MIN_LINE_DURATION = 0.25;
const MAX_LINE_DURATION = 0.7;
const LINE_PAUSE = 0.06; // pause after one line finishes typing, before the next starts

function q<T extends Element>(root: ParentNode, sel: string): T[] {
	return Array.from(root.querySelectorAll<T>(sel));
}

// Data visualisation — bars + trend line draw themselves, then bar fills fade in.
function buildVizScene(scene: HTMLElement): gsap.core.Timeline {
	const bars = q<SVGRectElement>(scene, '.viz-bar');
	const strokes = [...bars, ...q<SVGElement>(scene, '.viz-line')];
	const nodes = q<SVGCircleElement>(scene, '.viz-node');

	const tl = gsap.timeline({ paused: true });
	tl.fromTo(strokes, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.8, ease: 'none' })
		.fromTo(bars, { fillOpacity: 0 }, { fillOpacity: 1, duration: 0.4, ease: 'expo.out', stagger: 0.05 })
		.fromTo(
			nodes,
			{ autoAlpha: 0 },
			{ autoAlpha: 1, duration: 0.3, ease: 'expo.out', stagger: 0.04 },
			'<+=0.1',
		);
	return tl;
}

// Automation — condensed terminal, lines type themselves out character by character.
function buildTerminalScene(scene: HTMLElement): gsap.core.Timeline {
	const textSpans = q<HTMLElement>(scene, '.terminal-line-text');
	const caret = scene.querySelector<HTMLElement>('.caret');
	const fullTexts = textSpans.map((span) => span.textContent ?? '');

	const tl = gsap.timeline({ paused: true });
	textSpans.forEach((span, i) => {
		tl.fromTo(
			span,
			{ text: '' },
			{
				text: fullTexts[i],
				duration: gsap.utils.clamp(MIN_LINE_DURATION, MAX_LINE_DURATION, fullTexts[i].length * CHAR_DURATION),
				ease: 'none',
			},
			i === 0 ? undefined : `+=${LINE_PAUSE}`,
		);
	});
	if (caret) tl.fromTo(caret, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15, ease: 'expo.out' });

	return tl;
}

// Data cleaning — 14 scattered dots converge into their authored grid position.
function buildCleaningScene(scene: HTMLElement): gsap.core.Timeline {
	const dots = q<SVGCircleElement>(scene, '.clean-dot');

	// repeatRefresh re-invokes the function-based from-values on every replay,
	// so the scatter is fresh each cycle instead of the same positions.
	const tl = gsap.timeline({ paused: true, repeatRefresh: true });
	tl.fromTo(
		dots,
		{ x: () => gsap.utils.random(-42, 42), y: () => gsap.utils.random(-28, 28) },
		{ x: 0, y: 0, duration: 0.9, ease: 'expo.inOut', stagger: 0.04 },
	);
	return tl;
}

const SCENE_BUILDERS: Record<string, (scene: HTMLElement) => gsap.core.Timeline> = {
	viz: buildVizScene,
	automation: buildTerminalScene,
	cleaning: buildCleaningScene,
};

export default function initWhatIDo(): void {
	mm.add(MOTION_OK, () => {
		const cards = q<HTMLElement>(document, '#what-i-do .card[data-service]');
		const cleanups: (() => void)[] = [];

		cards.forEach((card) => {
			const key = card.dataset.service ?? '';
			const build = SCENE_BUILDERS[key];
			const scene = card.querySelector<HTMLElement>('.card-scene');
			if (!build || !scene) return;

			const tl = build(scene); // paused; from-states baked into each fromTo()
			tl.repeat(-1).repeatDelay(IDLE_REPEAT_DELAY);

			const trigger = ScrollTrigger.create({
				trigger: card,
				start: SCENE_START,
				once: true,
				onEnter: () => tl.play(),
			});

			cleanups.push(() => {
				trigger.kill();
				tl.kill();
			});
		});

		return () => cleanups.forEach((cleanup) => cleanup());
	});
}
