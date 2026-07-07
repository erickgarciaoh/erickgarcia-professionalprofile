import { gsap, ScrollTrigger, mm, MOTION_OK } from './core';

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

const GROUP_ENTER_START = 'top 78%';
const LINE_DURATION = 0.28;
const LINE_GAP = 0.22;
const TERMINAL_STAGGER = 0.35;

function buildTerminalTimeline(terminal: HTMLElement): gsap.core.Timeline {
	const lines = Array.from(terminal.querySelectorAll<HTMLElement>('.terminal-line'));
	gsap.set(lines, { y: 6, autoAlpha: 0 });

	const steps: SequenceStep[] = lines.map((line, i) => [
		{
			targets: line,
			y: 0,
			autoAlpha: 1,
			duration: LINE_DURATION,
			ease: 'expo.out',
			position: i === 0 ? undefined : `<+=${LINE_GAP}`,
		},
	]);

	return sequence(steps);
}

export default function initTerminals(): void {
	mm.add(MOTION_OK, () => {
		const groups = document.querySelectorAll<HTMLElement>('.build-grid');
		const cleanups: (() => void)[] = [];

		groups.forEach((group) => {
			const terminals = Array.from(group.querySelectorAll<HTMLElement>('.terminal'));
			if (terminals.length === 0) return;

			const timelines = terminals.map(buildTerminalTimeline);
			const delayedCalls: gsap.core.Tween[] = [];

			const trigger = ScrollTrigger.create({
				trigger: group,
				start: GROUP_ENTER_START,
				once: true,
				onEnter: () => {
					timelines.forEach((tl, i) => {
						delayedCalls.push(gsap.delayedCall(i * TERMINAL_STAGGER, () => tl.play()));
					});
				},
			});

			cleanups.push(() => {
				trigger.kill();
				delayedCalls.forEach((call) => call.kill());
				timelines.forEach((tl) => tl.kill());
				const lines = terminals.flatMap((terminal) => Array.from(terminal.querySelectorAll('.terminal-line')));
				gsap.set(lines, { clearProps: 'all' });
			});
		});

		return () => cleanups.forEach((cleanup) => cleanup());
	});
}
