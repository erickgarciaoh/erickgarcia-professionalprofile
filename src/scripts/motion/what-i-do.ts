import { gsap, ScrollTrigger, mm, MOTION_OK } from './core';
import { sequence, type SequenceStep } from './terminal';

// What I do — three service cards, each with a live scene that demonstrates
// the capability instead of describing it (§2.3). Every scene plays once on
// its own enter trigger; reduced-motion/no-JS visitors see the composed final
// state because the "from" states below only ever get set inside MOTION_OK.

const SCENE_START = 'top 78%';
const TERM_LINE_DURATION = 0.28;
const TERM_LINE_GAP = 0.22;

function q<T extends Element>(root: ParentNode, sel: string): T[] {
	return Array.from(root.querySelectorAll<T>(sel));
}

// Data visualisation — bars + trend line draw themselves, then bar fills fade in.
function buildVizScene(scene: HTMLElement): gsap.core.Timeline {
	const bars = q<SVGRectElement>(scene, '.viz-bar');
	const strokes = [...bars, ...q<SVGElement>(scene, '.viz-line')];
	const nodes = q<SVGCircleElement>(scene, '.viz-node');

	gsap.set(strokes, { drawSVG: '0%' });
	gsap.set(bars, { fillOpacity: 0 });
	gsap.set(nodes, { autoAlpha: 0 });

	const steps: SequenceStep[] = [
		[{ targets: strokes, drawSVG: '100%', duration: 0.8, ease: 'none' }],
		[
			{ targets: bars, fillOpacity: 1, duration: 0.4, ease: 'expo.out', stagger: 0.05 },
			{ targets: nodes, autoAlpha: 1, duration: 0.3, ease: 'expo.out', stagger: 0.04, position: '<+=0.1' },
		],
	];
	return sequence(steps);
}

// Automation — condensed terminal, lines rise + fade in sequence.
function buildTerminalScene(scene: HTMLElement): gsap.core.Timeline {
	const lines = q<HTMLElement>(scene, '.terminal-line');
	gsap.set(lines, { y: 6, autoAlpha: 0 });

	const steps: SequenceStep[] = lines.map((line, i) => [
		{
			targets: line,
			y: 0,
			autoAlpha: 1,
			duration: TERM_LINE_DURATION,
			ease: 'expo.out',
			position: i === 0 ? undefined : `<+=${TERM_LINE_GAP}`,
		},
	]);
	return sequence(steps);
}

// Data cleaning — 14 scattered dots converge into their authored grid position.
function buildCleaningScene(scene: HTMLElement): gsap.core.Timeline {
	const dots = q<SVGCircleElement>(scene, '.clean-dot');

	gsap.set(dots, {
		x: () => gsap.utils.random(-42, 42),
		y: () => gsap.utils.random(-28, 28),
	});

	const step: SequenceStep = [{ targets: dots, x: 0, y: 0, duration: 0.9, ease: 'expo.inOut', stagger: 0.04 }];
	return sequence([step]);
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

			const tl = build(scene); // paused; from-states already set

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
