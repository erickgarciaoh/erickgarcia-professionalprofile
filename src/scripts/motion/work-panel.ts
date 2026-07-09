import { gsap, mm, MOTION_OK } from './core';

/**
 * Selected work (§2.6): hovering or keyboard-focusing a list row switches the
 * sticky detail panel to that project. The panel crossfades (autoAlpha out/in,
 * content swapped while hidden) under MOTION_OK; without it the swap is instant
 * but the content still changes — reduced-motion never loses the ability to
 * browse projects. All four covers/meta are pre-resolved at build time and
 * carried on each row via data-* (see SelectedWork.astro), so the swap is a
 * plain attribute write, no fetch.
 */

interface PanelData {
	cover: string;
	alt: string;
	dataset: string;
	stack: string;
	live: string;
	title: string;
}

const OUT_DURATION = 0.18;
const IN_DURATION = 0.25;

export default function initWorkPanel(): void {
	const layout = document.querySelector<HTMLElement>('.work-layout');
	const panel = document.querySelector<HTMLElement>('.work-panel');
	if (!layout || !panel) return;

	const rows = Array.from(layout.querySelectorAll<HTMLElement>('.project-row'));
	const img = panel.querySelector<HTMLImageElement>('.work-panel-media img');
	const datasetRow = panel.querySelector<HTMLElement>('.panel-meta-dataset');
	const datasetValue = datasetRow?.querySelector<HTMLElement>('dd') ?? null;
	const stackValue = panel.querySelector<HTMLElement>('.panel-meta-stack dd');
	const live = panel.querySelector<HTMLAnchorElement>('.panel-live');
	if (rows.length === 0 || !img || !stackValue || !live) return;

	// The sticky container carries the P4-02 reveal transition on opacity; fade the
	// two inner blocks instead (they have no CSS transition) so gsap owns opacity
	// cleanly with no double-animation.
	const fadeTargets = Array.from(panel.children) as HTMLElement[];

	const read = (row: HTMLElement): PanelData => ({
		cover: row.dataset.cover ?? '',
		alt: row.dataset.coverAlt ?? '',
		dataset: row.dataset.dataset ?? '',
		stack: row.dataset.stack ?? '',
		live: row.dataset.live ?? '',
		title: row.dataset.title ?? '',
	});

	const paint = (data: PanelData): void => {
		img.src = data.cover;
		img.alt = data.alt;
		if (datasetRow && datasetValue) {
			datasetValue.textContent = data.dataset;
			datasetRow.hidden = data.dataset === '';
		}
		stackValue.textContent = data.stack;
		live.href = data.live;
		live.setAttribute('aria-label', `Open the live data-story for ${data.title}`);
	};

	let activeRow = rows.find((row) => row.classList.contains('is-active')) ?? rows[0];
	activeRow.classList.add('is-active');

	const markActive = (row: HTMLElement): void => {
		activeRow.classList.remove('is-active');
		row.classList.add('is-active');
		activeRow = row;
	};

	// Default (reduced-motion / no MOTION_OK): instant swap, content still changes.
	let activate = (row: HTMLElement): void => {
		if (row === activeRow) return;
		markActive(row);
		paint(read(row));
	};

	rows.forEach((row) => {
		row.addEventListener('pointerenter', () => activate(row));
		// focusin bubbles from the row's inner links, so tabbing to any focusable
		// element inside a row activates it — keyboard parity with hover.
		row.addEventListener('focusin', () => activate(row));
	});

	mm.add(MOTION_OK, () => {
		activate = (row: HTMLElement): void => {
			if (row === activeRow) return;
			markActive(row);
			const data = read(row);
			gsap
				.timeline()
				.to(fadeTargets, {
					autoAlpha: 0,
					duration: OUT_DURATION,
					ease: 'power1.out',
					onComplete: () => paint(data),
				})
				.to(fadeTargets, { autoAlpha: 1, duration: IN_DURATION, ease: 'power1.out' });
		};

		return () => {
			activate = (row: HTMLElement): void => {
				if (row === activeRow) return;
				markActive(row);
				paint(read(row));
			};
			gsap.set(fadeTargets, { clearProps: 'opacity,visibility' });
		};
	});
}
