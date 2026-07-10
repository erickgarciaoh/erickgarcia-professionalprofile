// Shared, DOM-free logic for the hero signature asset ("Density relief",
// P2-03 / blueprint §2.2.2). Imported both by `hero-relief.ts` (browser canvas)
// and by `Hero.astro`'s frontmatter (Node, build time) so the runtime canvas
// and the static SVG fallback render the identical resting figure: nested
// contour lines (marching squares) over a scalar field of gaussian masses.

// Reference space the static SVG's viewBox is authored in. The runtime canvas
// uses the `.hero-relief` box's real pixel size instead — masses and sigmas are
// normalized, so both spaces draw the same figure.
export const RELIEF_REF_WIDTH = 600;
export const RELIEF_REF_HEIGHT = 500;

// Marching-squares cell size, in px of whichever space is being sampled.
export const RELIEF_SVG_CELL = 10;
export const RELIEF_CANVAS_CELL = 9;

// Iso levels, lowest (outermost contour) to highest (the peak's core).
export const RELIEF_LEVELS = [0.14, 0.22, 0.31, 0.41, 0.52, 0.64, 0.77, 0.9, 1.04];

// Stroke role per level index — both renderers map these to the same tokens:
// outer → --ink-300, mid → --ink-400, peak → --data-1 (no amber in the asset).
export type ReliefLevelRole = 'outer' | 'mid' | 'peak';
export function reliefLevelRole(levelIndex: number): ReliefLevelRole {
	if (levelIndex >= RELIEF_LEVELS.length - 2) return 'peak';
	return levelIndex > 3 ? 'mid' : 'outer';
}

// The two resting masses of the distribution. Positions normalized to the box,
// sigmas as a fraction of min(width, height). Drift makes the relief breathe
// at rest (~20–30s periods); at t=0 the figure equals the static SVG fallback.
interface ReliefMass {
	x: number;
	y: number;
	sigma: number;
	weight: number;
	driftAmpX: number;
	driftAmpY: number;
	driftSpeedX: number;
	driftSpeedY: number;
}

const MASSES: ReliefMass[] = [
	{ x: 0.6, y: 0.44, sigma: 0.21, weight: 0.95, driftAmpX: 0.045, driftAmpY: 0.06, driftSpeedX: 0.26, driftSpeedY: 0.21 },
	{ x: 0.33, y: 0.62, sigma: 0.17, weight: 0.6, driftAmpX: 0.05, driftAmpY: 0.05, driftSpeedX: 0.17, driftSpeedY: 0.23 },
];

// The pointer's gravity peak. Strength 0..1 (eased in/out by the runtime);
// while it grows, the resting masses yield part of their weight so the relief
// visibly migrates instead of just adding a third blob.
export interface ReliefPeak {
	x: number; // normalized, pre-clamped by the caller
	y: number;
	strength: number;
}

const PEAK_SIGMA = 0.15;
const PEAK_WEIGHT = 1.15;
const MASS_YIELD = [0.35, 0.22];

// Keep the peak's center far enough from the box edge that its innermost
// contours stay closed inside the figure.
export const RELIEF_PEAK_CLAMP = { minX: 0.2, maxX: 0.8, minY: 0.22, maxY: 0.78 };

// Window that fades the field to zero near the box edges, guaranteeing every
// contour closes inside the box — the outermost contour IS the figure's edge.
// Wide enough that the fade reads as an ambient vignette, not a hard crop
// against the box's own rectangle.
const EDGE_MARGIN = 0.22;

function edgeWindow(n: number): number {
	const d = Math.min(n, 1 - n);
	if (d >= EDGE_MARGIN) return 1;
	if (d <= 0) return 0;
	const u = d / EDGE_MARGIN;
	return u * u * (3 - 2 * u);
}

function fieldAt(nx: number, ny: number, aspect: number, t: number, peak: ReliefPeak | null): number {
	let v = 0;
	const px = peak && peak.strength > 0.003 ? peak : null;
	for (let m = 0; m < MASSES.length; m++) {
		const mass = MASSES[m];
		const cx = mass.x + Math.sin(t * mass.driftSpeedX + m * 2.1) * mass.driftAmpX;
		const cy = mass.y + Math.cos(t * mass.driftSpeedY + m * 1.3) * mass.driftAmpY;
		const dx = (nx - cx) * aspect;
		const dy = ny - cy;
		const s = mass.sigma;
		const w = mass.weight * (px ? 1 - MASS_YIELD[m] * px.strength : 1);
		v += w * Math.exp(-(dx * dx + dy * dy) / (2 * s * s));
	}
	if (px) {
		const dx = (nx - px.x) * aspect;
		const dy = ny - px.y;
		v += PEAK_WEIGHT * px.strength * Math.exp(-(dx * dx + dy * dy) / (2 * PEAK_SIGMA * PEAK_SIGMA));
	}
	return v * edgeWindow(nx) * edgeWindow(ny);
}

// Samples the field over a (cols+1)×(rows+1) lattice for a w×h px box.
// `aspect` normalizes x so the gaussians stay circular in pixel space.
export function sampleField(
	w: number,
	h: number,
	cell: number,
	t: number,
	peak: ReliefPeak | null,
	out?: Float32Array,
): { values: Float32Array; cols: number; rows: number } {
	const cols = Math.ceil(w / cell);
	const rows = Math.ceil(h / cell);
	const size = (cols + 1) * (rows + 1);
	const values = out && out.length >= size ? out : new Float32Array(size);
	const aspect = w / h;
	for (let j = 0; j <= rows; j++) {
		const ny = (j * cell) / h;
		for (let i = 0; i <= cols; i++) {
			values[j * (cols + 1) + i] = fieldAt((i * cell) / w, ny, aspect, t, peak);
		}
	}
	return { values, cols, rows };
}

// Marching-squares case table: pairs of crossed edges per corner-occupancy
// index (corners TL·TR·BR·BL as bits 8·4·2·1; edges 0=top 1=right 2=bottom
// 3=left). Cases 5/10 are the ambiguous saddles, resolved as two segments.
const MS_SEGMENTS: number[][] = [
	[], [3, 2], [2, 1], [3, 1], [0, 1], [3, 0, 2, 1], [0, 2], [3, 0],
	[3, 0], [0, 2], [3, 2, 0, 1], [0, 1], [3, 1], [2, 1], [3, 2], [],
];

function lerpT(v0: number, v1: number, level: number): number {
	const d = v1 - v0;
	return d === 0 ? 0.5 : Math.max(0, Math.min(1, (level - v0) / d));
}

// Emits the iso-line of `level` as a flat segment list [x1,y1,x2,y2, ...].
export function contourSegments(
	values: Float32Array,
	cols: number,
	rows: number,
	cell: number,
	level: number,
): number[] {
	const segs: number[] = [];
	const stride = cols + 1;
	for (let j = 0; j < rows; j++) {
		for (let i = 0; i < cols; i++) {
			const a = values[j * stride + i];
			const b = values[j * stride + i + 1];
			const c = values[(j + 1) * stride + i + 1];
			const d = values[(j + 1) * stride + i];
			const idx = (a > level ? 8 : 0) | (b > level ? 4 : 0) | (c > level ? 2 : 0) | (d > level ? 1 : 0);
			const table = MS_SEGMENTS[idx];
			if (table.length === 0) continue;
			const x = i * cell;
			const y = j * cell;
			for (let k = 0; k < table.length; k += 2) {
				for (let e = 0; e < 2; e++) {
					const edge = table[k + e];
					if (edge === 0) segs.push(x + cell * lerpT(a, b, level), y);
					else if (edge === 1) segs.push(x + cell, y + cell * lerpT(b, c, level));
					else if (edge === 2) segs.push(x + cell * lerpT(d, c, level), y + cell);
					else segs.push(x, y + cell * lerpT(a, d, level));
				}
			}
		}
	}
	return segs;
}

// Build-time helper for Hero.astro: the resting figure (t=0, no pointer) as
// one SVG path string per level, in the reference space.
export function buildRestingSvgPaths(): { d: string; role: ReliefLevelRole }[] {
	const { values, cols, rows } = sampleField(RELIEF_REF_WIDTH, RELIEF_REF_HEIGHT, RELIEF_SVG_CELL, 0, null);
	return RELIEF_LEVELS.map((level, li) => {
		const segs = contourSegments(values, cols, rows, RELIEF_SVG_CELL, level);
		let d = '';
		for (let k = 0; k < segs.length; k += 4) {
			d += `M${segs[k].toFixed(1)} ${segs[k + 1].toFixed(1)}L${segs[k + 2].toFixed(1)} ${segs[k + 3].toFixed(1)}`;
		}
		return { d, role: reliefLevelRole(li) };
	});
}
