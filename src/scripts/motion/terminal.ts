import { gsap } from './core';

/**
 * Shared timeline builder reused by pipeline.ts (Phase 4). Outer array =
 * sequential steps; inner array = tweens that run together within that step.
 * Each tween's own `position` overrides GSAP's default same-timeline placement
 * (sequential after the previous step) — e.g. `'<+=0.22'` to start partway
 * through the previous tween instead of waiting for it to finish.
 */
export interface SequenceTween extends gsap.TweenVars {
	targets: gsap.TweenTarget;
	position?: gsap.Position;
}

export type SequenceStep = SequenceTween[];

export function sequence(steps: SequenceStep[]): gsap.core.Timeline {
	const tl = gsap.timeline({ paused: true });

	steps.forEach((step) => {
		step.forEach(({ targets, position, ...vars }, i) => {
			tl.to(targets, vars, position ?? (i === 0 ? undefined : '<'));
		});
	});

	return tl;
}
