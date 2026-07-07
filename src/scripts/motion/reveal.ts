import { gsap, ScrollTrigger, mm, MOTION_OK } from './core';

const ENTER_START = 'top 78%';
const STAGGER_STEP = 0.1;
const STAGGER_CAP = 0.5;

export default function initReveal(): void {
	mm.add(MOTION_OK, () => {
		const groups = document.querySelectorAll<HTMLElement>('[data-reveal-group]');
		const cleanups: (() => void)[] = [];

		groups.forEach((group) => {
			const items = Array.from(group.querySelectorAll<HTMLElement>('[data-reveal-item]')).sort(
				(a, b) => Number(a.dataset.revealOrder ?? 0) - Number(b.dataset.revealOrder ?? 0),
			);

			if (items.length === 0) return;

			gsap.set(items, { y: 24, autoAlpha: 0 });

			const stagger = items.length > 1 ? Math.min(STAGGER_STEP, STAGGER_CAP / (items.length - 1)) : 0;

			const trigger = ScrollTrigger.create({
				trigger: group,
				start: ENTER_START,
				once: true,
				onEnter: () => {
					gsap.to(items, { y: 0, autoAlpha: 1, duration: 0.6, ease: 'expo.out', stagger });
				},
			});

			cleanups.push(() => {
				trigger.kill();
				gsap.set(items, { clearProps: 'all' });
			});
		});

		return () => cleanups.forEach((cleanup) => cleanup());
	});
}
