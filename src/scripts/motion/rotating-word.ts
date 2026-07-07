import { gsap, mm, MOTION_OK } from './core';
import { SplitText } from 'gsap/SplitText';

const CYCLE_INTERVAL = 2800;
const START_DELAY = 1200;
const OUT_DURATION = 0.3;
const OUT_STAGGER = 0.015;
const IN_DURATION = 0.45;
const IN_STAGGER = 0.02;

function swapWord(visual: HTMLElement, nextWord: string): void {
	const outSplit = new SplitText(visual, { type: 'chars' });

	gsap.to(outSplit.chars, {
		y: '-0.6em',
		autoAlpha: 0,
		duration: OUT_DURATION,
		stagger: OUT_STAGGER,
		ease: 'power1.in',
		onComplete: () => {
			outSplit.revert();
			visual.textContent = nextWord;
			const inSplit = new SplitText(visual, { type: 'chars' });
			gsap.fromTo(
				inSplit.chars,
				{ y: '0.6em', autoAlpha: 0 },
				{ y: 0, autoAlpha: 1, duration: IN_DURATION, ease: 'expo.out', stagger: IN_STAGGER },
			);
		},
	});
}

function initInstance(root: HTMLElement): () => void {
	const words = JSON.parse(root.dataset.words ?? '[]') as string[];
	const visual = root.querySelector<HTMLElement>('.rotating-word-visual');
	if (!visual || words.length < 2) return () => {};

	let index = 0;
	let intervalId: number | undefined;
	let startTimeoutId: number | undefined;
	let isVisible = false;

	const cycle = () => {
		index = (index + 1) % words.length;
		swapWord(visual, words[index]);
	};

	const play = () => {
		if (startTimeoutId || intervalId) return;
		startTimeoutId = window.setTimeout(() => {
			cycle();
			intervalId = window.setInterval(cycle, CYCLE_INTERVAL);
		}, START_DELAY);
	};

	const pause = () => {
		window.clearTimeout(startTimeoutId);
		window.clearInterval(intervalId);
		startTimeoutId = undefined;
		intervalId = undefined;
	};

	const evaluate = () => {
		if (isVisible && document.visibilityState === 'visible') play();
		else pause();
	};

	// The hero's own <section> is the relevant viewport boundary, not the
	// inline word itself (which never leaves the viewport independently of it).
	const section = root.closest<HTMLElement>('section') ?? root;
	const observer = new IntersectionObserver(
		([entry]) => {
			isVisible = entry.isIntersecting;
			evaluate();
		},
		{ threshold: 0 },
	);
	observer.observe(section);

	document.addEventListener('visibilitychange', evaluate);

	return () => {
		pause();
		observer.disconnect();
		document.removeEventListener('visibilitychange', evaluate);
	};
}

export default function initRotatingWord(): void {
	mm.add(MOTION_OK, () => {
		const roots = document.querySelectorAll<HTMLElement>('[data-rotating-word]');
		const cleanups = Array.from(roots).map(initInstance);

		return () => cleanups.forEach((cleanup) => cleanup());
	});
}
