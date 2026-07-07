import { gsap, mm } from './core';

const ACTIVE_QUERY = '(pointer: fine) and (prefers-reduced-motion: no-preference)';
const MAX_PULL = 8;
const LABEL_RATIO = 0.4;
const PROXIMITY_MULTIPLIER = 1.4;
const PULL_DURATION = 0.3;
const RETURN_DURATION = 0.45;

function wrapLabel(el: HTMLElement): HTMLElement {
	const existing = el.querySelector<HTMLElement>(':scope > .magnetic-label');
	if (existing) return existing;

	const label = document.createElement('span');
	label.className = 'magnetic-label';
	label.append(...Array.from(el.childNodes));
	el.append(label);
	return label;
}

function initInstance(el: HTMLElement): () => void {
	const label = wrapLabel(el);

	const moveX = gsap.quickTo(el, 'x', { duration: PULL_DURATION, ease: 'expo.out' });
	const moveY = gsap.quickTo(el, 'y', { duration: PULL_DURATION, ease: 'expo.out' });
	const labelX = gsap.quickTo(label, 'x', { duration: PULL_DURATION, ease: 'expo.out' });
	const labelY = gsap.quickTo(label, 'y', { duration: PULL_DURATION, ease: 'expo.out' });

	let inRange = false;

	const release = () => {
		inRange = false;
		gsap.to([el, label], { x: 0, y: 0, duration: RETURN_DURATION, ease: 'expo.out' });
	};

	const onPointerMove = (event: PointerEvent) => {
		const rect = el.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;
		const radiusX = (rect.width / 2) * PROXIMITY_MULTIPLIER;
		const radiusY = (rect.height / 2) * PROXIMITY_MULTIPLIER;
		const dx = event.clientX - centerX;
		const dy = event.clientY - centerY;

		if (Math.abs(dx) > radiusX || Math.abs(dy) > radiusY) {
			if (inRange) release();
			return;
		}

		inRange = true;
		const pullX = gsap.utils.clamp(-MAX_PULL, MAX_PULL, (dx / radiusX) * MAX_PULL);
		const pullY = gsap.utils.clamp(-MAX_PULL, MAX_PULL, (dy / radiusY) * MAX_PULL);
		moveX(pullX);
		moveY(pullY);
		labelX(pullX * LABEL_RATIO);
		labelY(pullY * LABEL_RATIO);
	};

	document.addEventListener('pointermove', onPointerMove);

	return () => {
		document.removeEventListener('pointermove', onPointerMove);
		gsap.set([el, label], { clearProps: 'all' });
	};
}

export default function initMagnetic(): void {
	mm.add(ACTIVE_QUERY, () => {
		const buttons = document.querySelectorAll<HTMLElement>('[data-magnetic]');
		const cleanups = Array.from(buttons).map(initInstance);

		return () => cleanups.forEach((cleanup) => cleanup());
	});
}
