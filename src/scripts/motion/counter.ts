import { gsap, ScrollTrigger, mm, MOTION_OK } from './core';

const ENTER_START = 'top 80%';
const COUNT_DURATION = 1.4;

function formatValue(value: number, format: string, suffix: string): string {
	const rounded = Math.round(value);
	if (format === 'compact') {
		return `${new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(rounded)}${suffix}`;
	}
	return `${rounded}${suffix}`;
}

function countUp(el: HTMLElement): void {
	const to = Number(el.dataset.counterTo ?? 0);
	const format = el.dataset.counterFormat ?? 'none';
	const suffix = el.dataset.counterSuffix ?? '';
	const proxy = { value: 0 };

	el.textContent = formatValue(0, format, suffix);

	gsap.to(proxy, {
		value: to,
		duration: COUNT_DURATION,
		ease: 'power1.out',
		snap: { value: 1 },
		onUpdate: () => {
			el.textContent = formatValue(proxy.value, format, suffix);
		},
	});
}

export default function initCounter(): void {
	mm.add(MOTION_OK, () => {
		const counters = document.querySelectorAll<HTMLElement>('[data-counter]');
		const triggers: ScrollTrigger[] = [];

		counters.forEach((el) => {
			const trigger = ScrollTrigger.create({
				trigger: el,
				start: ENTER_START,
				once: true,
				onEnter: () => countUp(el),
			});
			triggers.push(trigger);
		});

		return () => triggers.forEach((trigger) => trigger.kill());
	});
}
