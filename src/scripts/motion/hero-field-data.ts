// Shared, DOM-free logic for the hero signature asset ("Signal in the noise",
// P2-03 / blueprint §2.2.1). Imported both by `hero-field.ts` (browser canvas)
// and by `Hero.astro`'s frontmatter (Node, build time) so the canvas's field
// and the static SVG fallback render from the exact same seeded point set.

export const HERO_FIELD_SEED = 20260707;
export const HERO_FIELD_POINT_COUNT = 300;

// Reference space the static SVG's viewBox is authored in. The runtime canvas
// uses the hero's real pixel size instead — only the normalized (0..1) point
// coordinates need to match between the two, not the absolute pixel grid.
export const HERO_FIELD_REF_WIDTH = 1200;
export const HERO_FIELD_REF_HEIGHT = 700;

// Neighborhood radius, in CSS px, both at runtime and in the reference space —
// keeps the "signal" gathering roughly the same physical size everywhere.
export const HERO_FIELD_RADIUS = 200;

// Resting anchor for the fitted line when no pointer is present: the right
// third of the hero, clear of `.hero-content` (capped at 64rem, left-anchored).
// This is also the anchor the static SVG fallback fits its line against, so
// the fallback matches the canvas's own resting frame.
export const HERO_FIELD_DEFAULT_ANCHOR = { x: 0.74, y: 0.38 };

const MIN_FIT_NEIGHBORS = 6;

export interface FieldPoint {
	x: number; // normalized 0..1
	y: number; // normalized 0..1
	r: number; // dot radius, px
	alpha: number; // 0.10–0.35
	tone: 0 | 1; // 0 = --ink-300, 1 = --canvas-400
	driftPhase: number;
	driftSpeed: number;
}

export interface TrendFit {
	m: number;
	b: number;
	count: number;
}

// Deterministic PRNG (mulberry32) — same seed always yields the same sequence,
// in Node and in every browser, so canvas and build-time SVG agree exactly.
function mulberry32(seed: number): () => number {
	let state = seed;
	return function random() {
		state |= 0;
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function generateFieldPoints(
	seed: number = HERO_FIELD_SEED,
	count: number = HERO_FIELD_POINT_COUNT,
): FieldPoint[] {
	const random = mulberry32(seed);
	const points: FieldPoint[] = [];
	for (let i = 0; i < count; i++) {
		points.push({
			x: random(),
			y: random(),
			r: 1.5 + random() * 1,
			alpha: 0.1 + random() * 0.25,
			tone: random() < 0.5 ? 0 : 1,
			driftPhase: random() * Math.PI * 2,
			driftSpeed: 0.15 + random() * 0.2,
		});
	}
	return points;
}

// Ordinary least squares fit of the points within `radius` px of the anchor
// (anchor + point coordinates given in the same pixel space — reference space
// at build time, real hero size at runtime). Returns null when too few points
// fall in the neighborhood to fit a meaningful line.
export function fitLocalTrend(
	pointsPx: { x: number; y: number }[],
	anchorPx: { x: number; y: number },
	radius: number,
): TrendFit | null {
	let sumX = 0;
	let sumY = 0;
	let sumXY = 0;
	let sumXX = 0;
	let count = 0;
	const r2 = radius * radius;

	for (const p of pointsPx) {
		const dx = p.x - anchorPx.x;
		const dy = p.y - anchorPx.y;
		if (dx * dx + dy * dy > r2) continue;
		sumX += p.x;
		sumY += p.y;
		sumXY += p.x * p.y;
		sumXX += p.x * p.x;
		count++;
	}

	if (count < MIN_FIT_NEIGHBORS) return null;

	const denom = count * sumXX - sumX * sumX;
	if (Math.abs(denom) < 1e-6) return null;

	const m = (count * sumXY - sumX * sumY) / denom;
	const b = (sumY - m * sumX) / count;
	return { m, b, count };
}
