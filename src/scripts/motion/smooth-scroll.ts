import Lenis from 'lenis';
import { gsap, ScrollTrigger, mm, MOTION_OK } from './core';

export default function initSmoothScroll(): void {
	mm.add(MOTION_OK, () => {
		const lenis = new Lenis();

		lenis.on('scroll', ScrollTrigger.update);

		const tick = (time: number) => lenis.raf(time * 1000);
		gsap.ticker.add(tick);
		gsap.ticker.lagSmoothing(0);

		const header = document.querySelector<HTMLElement>('.site-header');
		const anchors = document.querySelectorAll<HTMLAnchorElement>(
			'.primary-nav a[href^="#"], .hero-actions a[href^="#"]',
		);

		const onClick = (event: MouseEvent) => {
			const anchor = event.currentTarget as HTMLAnchorElement;
			const hash = anchor.getAttribute('href');
			if (!hash || hash === '#') return;

			const target = document.querySelector<HTMLElement>(hash);
			if (!target) return;

			event.preventDefault();
			const headerHeight = header?.getBoundingClientRect().height ?? 0;
			lenis.scrollTo(target, { offset: -headerHeight });
		};

		anchors.forEach((anchor) => anchor.addEventListener('click', onClick));

		return () => {
			anchors.forEach((anchor) => anchor.removeEventListener('click', onClick));
			gsap.ticker.remove(tick);
			lenis.destroy();
		};
	});
}
