import { gsap, mm } from './core';

const ACTIVE_QUERY = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';
const CURSOR_OFFSET_X = 24;
const CURSOR_OFFSET_Y = 24;
const MOVE_DURATION = 0.35;
const ENTER_DURATION = 0.25;
const LEAVE_DURATION = 0.18;

export default function initMousePreview(): void {
	mm.add(ACTIVE_QUERY, () => {
		const list = document.querySelector<HTMLElement>('.project-list');
		const figure = document.querySelector<HTMLElement>('.work-preview');
		const img = figure?.querySelector<HTMLImageElement>('img');
		if (!list || !figure || !img) return;

		const moveX = gsap.quickTo(figure, 'x', { duration: MOVE_DURATION, ease: 'expo.out' });
		const moveY = gsap.quickTo(figure, 'y', { duration: MOVE_DURATION, ease: 'expo.out' });

		gsap.set(figure, { autoAlpha: 0, scale: 0.92 });

		let activeRow: HTMLElement | null = null;

		const onPointerMove = (event: PointerEvent) => {
			moveX(event.clientX + CURSOR_OFFSET_X);
			moveY(event.clientY + CURSOR_OFFSET_Y);

			const row = (event.target as HTMLElement).closest<HTMLElement>('.project-row');
			if (row && row !== activeRow) {
				activeRow = row;
				const src = row.dataset.previewSrc;
				if (src) img.src = src;
			}
		};

		const onPointerEnter = () => {
			gsap.to(figure, { autoAlpha: 1, scale: 1, duration: ENTER_DURATION, ease: 'expo.out' });
		};

		const onPointerLeave = () => {
			activeRow = null;
			gsap.to(figure, { autoAlpha: 0, scale: 0.92, duration: LEAVE_DURATION, ease: 'expo.out' });
		};

		list.addEventListener('pointerenter', onPointerEnter);
		list.addEventListener('pointermove', onPointerMove);
		list.addEventListener('pointerleave', onPointerLeave);

		return () => {
			list.removeEventListener('pointerenter', onPointerEnter);
			list.removeEventListener('pointermove', onPointerMove);
			list.removeEventListener('pointerleave', onPointerLeave);
			gsap.set(figure, { clearProps: 'all' });
		};
	});
}
