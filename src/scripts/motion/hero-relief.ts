import { gsap, mm, MOTION_OK } from './core';
import {
	RELIEF_CANVAS_CELL,
	RELIEF_LEVELS,
	RELIEF_PEAK_CLAMP,
	contourSegments,
	reliefLevelRole,
	sampleField,
	type ReliefPeak,
} from './hero-relief-data';

// Hero signature asset — "Density relief" (P2-03, blueprint §2.2.2).
// A contained topographic figure right of the name: nested contour hairlines
// over a scalar field of two breathing gaussian masses. The pointer is a
// gravity peak — mass migrates toward it and the whole relief re-flows; on
// leave it relaxes back to the resting composition, which is exactly the
// figure the static SVG fallback shows. Zero amber, never the LCP element,
// boots only once the hero's own load cascade has finished (pointer:fine +
// >=60rem + reduced-motion: no-preference, via `mm.add` so the loop tears
// down cleanly if the media match ever flips).

const BOOT_QUERY = `(pointer: fine) and (min-width: 60rem) and ${MOTION_OK}`;
const POSITION_EASE = 0.09;
const STRENGTH_EASE = 0.055;
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

function clamp(n: number, min: number, max: number): number {
	return n < min ? min : n > max ? max : n;
}

function bootCanvas(hero: HTMLElement, box: HTMLElement, canvas: HTMLCanvasElement): () => void {
	const ctx = canvas.getContext('2d');
	if (!ctx) return () => {};

	const svgFallback = box.querySelector<SVGElement>('.hero-relief-fallback');
	const dpr = Math.min(window.devicePixelRatio || 1, 2);
	let width = 0;
	let height = 0;
	let fieldBuffer: Float32Array | undefined;

	const peak: ReliefPeak = { x: 0.5, y: 0.5, strength: 0 };
	let targetX = 0.5;
	let targetY = 0.5;
	let targetStrength = 0;

	let running = false;
	let heroVisible = false;
	let rafId = 0;
	let startTime = -1;

	const styles = getComputedStyle(document.documentElement);
	const strokeFor: Record<ReturnType<typeof reliefLevelRole>, string> = {
		outer: styles.getPropertyValue('--ink-300').trim(),
		mid: styles.getPropertyValue('--ink-400').trim(),
		peak: styles.getPropertyValue('--data-1').trim(),
	};

	function resize() {
		const rect = box.getBoundingClientRect();
		width = rect.width;
		height = rect.height;
		canvas.width = Math.round(width * dpr);
		canvas.height = Math.round(height * dpr);
		canvas.style.width = `${width}px`;
		canvas.style.height = `${height}px`;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	}

	function onPointerMove(event: PointerEvent) {
		if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
		const rect = box.getBoundingClientRect();
		if (rect.width === 0 || rect.height === 0) return;
		targetX = clamp((event.clientX - rect.left) / rect.width, RELIEF_PEAK_CLAMP.minX, RELIEF_PEAK_CLAMP.maxX);
		targetY = clamp((event.clientY - rect.top) / rect.height, RELIEF_PEAK_CLAMP.minY, RELIEF_PEAK_CLAMP.maxY);
		targetStrength = 1;
	}

	function onPointerLeave() {
		targetStrength = 0;
	}

	function frame(now: number) {
		if (!running) return;
		rafId = requestAnimationFrame(frame);

		// Clock starts at the first frame so frame 0 equals the SVG fallback's
		// resting figure (t=0, no peak) and the crossfade is seamless.
		if (startTime < 0) startTime = now;
		const t = (now - startTime) / 1000;

		peak.x += (targetX - peak.x) * POSITION_EASE;
		peak.y += (targetY - peak.y) * POSITION_EASE;
		peak.strength += (targetStrength - peak.strength) * STRENGTH_EASE;

		const { values, cols, rows } = sampleField(
			width,
			height,
			RELIEF_CANVAS_CELL,
			t,
			peak.strength > 0.003 ? peak : null,
			fieldBuffer,
		);
		fieldBuffer = values;

		ctx.clearRect(0, 0, width, height);
		for (let li = 0; li < RELIEF_LEVELS.length; li++) {
			const role = reliefLevelRole(li);
			const segs = contourSegments(values, cols, rows, RELIEF_CANVAS_CELL, RELIEF_LEVELS[li]);
			if (segs.length === 0) continue;
			ctx.strokeStyle = strokeFor[role];
			ctx.globalAlpha = role === 'peak' ? 0.85 : 0.38 + li * 0.06;
			ctx.lineWidth = role === 'peak' ? 1.4 : 1;
			ctx.beginPath();
			for (let k = 0; k < segs.length; k += 4) {
				ctx.moveTo(segs[k], segs[k + 1]);
				ctx.lineTo(segs[k + 2], segs[k + 3]);
			}
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

export default function initHeroRelief(): void {
	mm.add(BOOT_QUERY, () => {
		const hero = document.getElementById('hero');
		const box = hero?.querySelector<HTMLElement>('.hero-relief');
		const canvas = box?.querySelector<HTMLCanvasElement>('[data-hero-relief]');
		if (!hero || !box || !canvas) return;

		let cleanup: (() => void) | undefined;
		waitForCascade(() => {
			cleanup = bootCanvas(hero, box, canvas);
		});

		return () => cleanup?.();
	});
}
