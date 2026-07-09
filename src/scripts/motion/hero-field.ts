import { gsap, mm, MOTION_OK } from './core';
import {
	HERO_FIELD_RADIUS,
	HERO_FIELD_DEFAULT_ANCHOR,
	generateFieldPoints,
	fitLocalTrend,
	type FieldPoint,
} from './hero-field-data';

// Hero signature asset — "Signal in the noise" (P2-03, blueprint §2.2.1).
// A seeded canvas 2D field of ~300 drifting points; the pointer is the
// analyst's attention — points near it ease toward a locally fitted
// least-squares trend line, drawn as a hairline. Ambient, not a second star:
// zero amber, never the LCP element, boots only once the hero's own load
// cascade has finished (pointer:fine + >=60rem + reduced-motion: no-preference,
// via `mm.add` so the loop tears down cleanly if the media match ever flips).

const BOOT_QUERY = `(pointer: fine) and (min-width: 60rem) and ${MOTION_OK}`;
const ANCHOR_EASE = 0.08;
const FIT_EASE = 0.06;
const DRIFT_AMPLITUDE = 5;
const FADE_IN_DURATION = 0.6;

function waitForCascade(callback: () => void): void {
	const run = () => {
		const lastRow = document.querySelector<HTMLElement>('.masthead-row:last-child');
		if (!lastRow) {
			callback();
			return;
		}
		lastRow.addEventListener('animationend', callback, { once: true });
	};
	if (document.readyState === 'complete') run();
	else window.addEventListener('load', run, { once: true });
}

function contentMaskFor(
	px: number,
	py: number,
	box: { left: number; top: number; right: number; bottom: number },
	pad: number,
): number {
	const dx = px < box.left ? box.left - px : px > box.right ? px - box.right : 0;
	const dy = py < box.top ? box.top - py : py > box.bottom ? py - box.bottom : 0;
	if (dx === 0 && dy === 0) return 0.12; // inside the text block — heavily suppressed
	const dist = Math.max(dx, dy);
	return 0.12 + Math.min(dist / pad, 1) * 0.88;
}

function bootCanvas(hero: HTMLElement, canvas: HTMLCanvasElement): () => void {
	const ctx = canvas.getContext('2d');
	if (!ctx) return () => {};

	const svgFallback = hero.querySelector<SVGElement>('.hero-field-fallback');
	const points: FieldPoint[] = generateFieldPoints();
	const fitAmount = new Float32Array(points.length);
	let contentMask = new Float32Array(points.length).fill(1);

	const dpr = Math.min(window.devicePixelRatio || 1, 2);
	let width = 0;
	let height = 0;
	let anchor = { ...HERO_FIELD_DEFAULT_ANCHOR };
	let targetAnchor = { ...HERO_FIELD_DEFAULT_ANCHOR };
	let running = false;
	let heroVisible = false;
	let rafId = 0;

	const inkColor = getComputedStyle(document.documentElement).getPropertyValue('--ink-300').trim();
	const canvasColor = getComputedStyle(document.documentElement).getPropertyValue('--canvas-400').trim();
	const signalColor = getComputedStyle(document.documentElement).getPropertyValue('--data-1').trim();

	function resize() {
		const heroRect = hero.getBoundingClientRect();
		width = heroRect.width;
		height = heroRect.height;
		canvas.width = Math.round(width * dpr);
		canvas.height = Math.round(height * dpr);
		canvas.style.width = `${width}px`;
		canvas.style.height = `${height}px`;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

		const contentEl = hero.querySelector('.hero-content');
		const contentRect = contentEl?.getBoundingClientRect();
		const box = contentRect
			? {
					left: contentRect.left - heroRect.left,
					top: contentRect.top - heroRect.top,
					right: contentRect.left - heroRect.left + contentRect.width,
					bottom: contentRect.top - heroRect.top + contentRect.height,
				}
			: null;

		contentMask = new Float32Array(
			points.map((p) => (box ? contentMaskFor(p.x * width, p.y * height, box, 64) : 1)),
		);
	}

	function onPointerMove(event: PointerEvent) {
		if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
		const rect = hero.getBoundingClientRect();
		targetAnchor = {
			x: (event.clientX - rect.left) / rect.width,
			y: (event.clientY - rect.top) / rect.height,
		};
	}

	function onPointerLeave() {
		targetAnchor = { ...HERO_FIELD_DEFAULT_ANCHOR };
	}

	function frame(now: number) {
		if (!running) return;
		rafId = requestAnimationFrame(frame);

		anchor.x += (targetAnchor.x - anchor.x) * ANCHOR_EASE;
		anchor.y += (targetAnchor.y - anchor.y) * ANCHOR_EASE;
		const anchorPx = { x: anchor.x * width, y: anchor.y * height };
		const t = now / 1000;
		const r2 = HERO_FIELD_RADIUS * HERO_FIELD_RADIUS;

		const basePx: { x: number; y: number }[] = new Array(points.length);
		for (let i = 0; i < points.length; i++) {
			const p = points[i];
			const driftX = Math.sin(t * p.driftSpeed + p.driftPhase) * DRIFT_AMPLITUDE;
			const driftY = Math.cos(t * p.driftSpeed * 0.85 + p.driftPhase) * DRIFT_AMPLITUDE;
			const bx = p.x * width + driftX;
			const by = p.y * height + driftY;
			basePx[i] = { x: bx, y: by };
			const dx = bx - anchorPx.x;
			const dy = by - anchorPx.y;
			const inRadius = dx * dx + dy * dy <= r2 ? 1 : 0;
			fitAmount[i] += (inRadius - fitAmount[i]) * FIT_EASE;
		}

		const fit = fitLocalTrend(basePx, anchorPx, HERO_FIELD_RADIUS);

		ctx.clearRect(0, 0, width, height);
		for (let i = 0; i < points.length; i++) {
			const p = points[i];
			let { x: px, y: py } = basePx[i];
			if (fit && fitAmount[i] > 0.01) {
				const targetY = fit.m * px + fit.b;
				py += (targetY - py) * fitAmount[i];
			}
			ctx.globalAlpha = p.alpha * contentMask[i];
			ctx.fillStyle = p.tone === 0 ? inkColor : canvasColor;
			ctx.beginPath();
			ctx.arc(px, py, p.r, 0, Math.PI * 2);
			ctx.fill();
		}

		if (fit) {
			const x1 = Math.max(0, anchorPx.x - HERO_FIELD_RADIUS);
			const x2 = Math.min(width, anchorPx.x + HERO_FIELD_RADIUS);
			ctx.globalAlpha = 0.8;
			ctx.strokeStyle = signalColor;
			ctx.lineWidth = 1.75;
			ctx.beginPath();
			ctx.moveTo(x1, fit.m * x1 + fit.b);
			ctx.lineTo(x2, fit.m * x2 + fit.b);
			ctx.stroke();
		}
		ctx.globalAlpha = 1;
	}

	function play() {
		if (running) return;
		running = true;
		rafId = requestAnimationFrame(frame);
	}

	function stop() {
		running = false;
		cancelAnimationFrame(rafId);
	}

	resize();
	window.addEventListener('resize', resize);
	hero.addEventListener('pointermove', onPointerMove);
	hero.addEventListener('pointerleave', onPointerLeave);

	const io = new IntersectionObserver(
		([entry]) => {
			heroVisible = entry.isIntersecting;
			if (heroVisible && !document.hidden) play();
			else stop();
		},
		{ threshold: 0 },
	);
	io.observe(hero);

	const onVisibilityChange = () => {
		if (document.hidden) stop();
		else if (heroVisible) play();
	};
	document.addEventListener('visibilitychange', onVisibilityChange);

	canvas.style.display = 'block';
	gsap.set(canvas, { autoAlpha: 0 });
	gsap.to(canvas, { autoAlpha: 1, duration: FADE_IN_DURATION, ease: 'expo.out' });
	svgFallback?.setAttribute('hidden', '');

	return () => {
		stop();
		io.disconnect();
		window.removeEventListener('resize', resize);
		hero.removeEventListener('pointermove', onPointerMove);
		hero.removeEventListener('pointerleave', onPointerLeave);
		document.removeEventListener('visibilitychange', onVisibilityChange);
		gsap.set(canvas, { clearProps: 'all' });
		canvas.style.display = '';
		svgFallback?.removeAttribute('hidden');
	};
}

export default function initHeroField(): void {
	mm.add(BOOT_QUERY, () => {
		const hero = document.getElementById('hero');
		const canvas = hero?.querySelector<HTMLCanvasElement>('[data-hero-field]');
		if (!hero || !canvas) return;

		let cleanup: (() => void) | undefined;
		waitForCascade(() => {
			cleanup = bootCanvas(hero, canvas);
		});

		return () => cleanup?.();
	});
}
